#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
SOURCE="$ROOT/SparkyFitnessMobile/build-sideload/Build/Products/Release-iphoneos/SparkyFitness.app"
OUT="$ROOT/sideload-output"
test -d "$SOURCE"
test -s "$SOURCE/main.jsbundle"
mkdir -p "$OUT"
STAGING=$(mktemp -d)
trap 'rm -rf "$STAGING"' EXIT

for VARIANT in phone-only with-extensions; do
  PACKAGE="$STAGING/$VARIANT"
  mkdir -p "$PACKAGE/Payload"
  ditto "$SOURCE" "$PACKAGE/Payload/SparkyFitness.app"
  APP="$PACKAGE/Payload/SparkyFitness.app"

  if [[ "$VARIANT" == phone-only ]]; then
    # Keep the first installation within free-account extension limits. The
    # second IPA retains the original widgets, Live Activities and Watch app.
    rm -rf "$APP/Watch" "$APP/PlugIns"
  fi

  # No Apple credentials are used here. Ad-hoc signatures only preserve the
  # requested entitlements for the signing tool; they cannot authorize an
  # installation. Sideloadly supplies the real signature/provisioning profile.
  python3 - "$APP" "$VARIANT" <<'PY'
import pathlib
import plistlib
import json
import subprocess
import sys

app = pathlib.Path(sys.argv[1])
variant = sys.argv[2]
sources = pathlib.Path('SparkyFitnessMobile/ios')
entitlements_by_product = {}
for project in sources.glob('*.xcodeproj/project.pbxproj'):
    objects = json.loads(subprocess.check_output(
        ['plutil', '-convert', 'json', '-o', '-', str(project)]))['objects']
    for target in objects.values():
        if target.get('isa') != 'PBXNativeTarget':
            continue
        product = objects[target['productReference']]['path']
        configurations = objects[target['buildConfigurationList']]['buildConfigurations']
        for reference in configurations:
            configuration = objects[reference]
            if configuration['name'] != 'Release':
                continue
            entitlement = configuration['buildSettings'].get('CODE_SIGN_ENTITLEMENTS')
            if entitlement:
                entitlement = entitlement.replace('$(SRCROOT)', str(sources.resolve()))
                entitlement = entitlement.replace('${SRCROOT}', str(sources.resolve()))
                path = pathlib.Path(entitlement)
                entitlements_by_product[product] = path if path.is_absolute() else sources / path
for code in sorted([*app.rglob('*.framework'), *app.rglob('*.dylib')],
                   key=lambda path: len(path.parts), reverse=True):
    subprocess.run(['codesign', '--force', '--sign', '-', str(code)], check=True)
for bundle in sorted([*app.rglob('*.appex'), *app.rglob('*.app'), app],
                     key=lambda path: len(path.parts), reverse=True):
    with (bundle / 'Info.plist').open('rb') as handle:
        info = plistlib.load(handle)
    identifier = info['CFBundleIdentifier']
    entitlements = None
    # Xcode emits .xcent files even when signing is disabled. Match by bundle
    # identifier, rather than accidentally using a Pods target's entitlements.
    for candidate in pathlib.Path('SparkyFitnessMobile/build-sideload/Build').rglob('*.xcent'):
        with candidate.open('rb') as handle:
            values = plistlib.load(handle)
        if values.get('application-identifier', '').endswith('.' + identifier):
            entitlements = values
            break
    if entitlements is None:
        # Apple-targets writes generated.entitlements beside targets/watch,
        # targets/widget, etc., outside ios/. Use the project's actual setting.
        configured = entitlements_by_product.get(bundle.name)
        candidates = [configured] if configured else list(sources.rglob(bundle.stem + '.entitlements'))
        if len(candidates) == 1:
            with candidates[0].open('rb') as handle:
                entitlements = plistlib.load(handle)
        elif bundle == app:
            raise RuntimeError('Cannot locate the main app entitlements; refusing to drop HealthKit')
        else:
            raise RuntimeError(f'Cannot locate entitlements for {bundle.name}')
    for key in ['application-identifier', 'com.apple.developer.team-identifier',
                'aps-environment', 'com.apple.developer.associated-domains',
                'com.apple.developer.nfc.readersession.formats',
                'com.apple.developer.usernotifications.time-sensitive']:
        entitlements.pop(key, None)
    if variant == 'phone-only':
        entitlements.pop('com.apple.security.application-groups', None)
        entitlements.pop('keychain-access-groups', None)
    entitlements_path = pathlib.Path('sideload-output') / f'{variant}-{bundle.stem}.plist'
    with entitlements_path.open('wb') as handle:
        plistlib.dump(entitlements, handle)
    if bundle == app and not entitlements.get('com.apple.developer.healthkit'):
        raise RuntimeError('HealthKit entitlement missing from main app')
    subprocess.run(['codesign', '--force', '--sign', '-', '--entitlements',
                    str(entitlements_path), str(bundle)], check=True)
PY

  (cd "$PACKAGE" && zip -qry "$OUT/SparkyFitness-$VARIANT.ipa" Payload)
done

{
  echo "Source commit: $(git rev-parse HEAD)"
  echo "Build: ${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-local}/actions/runs/${GITHUB_RUN_ID:-local}"
  xcodebuild -version
  shasum -a 256 "$OUT"/*.ipa
} > "$OUT/build-info.txt"

{
  echo '### Personal iPhone packages'
  echo 'Download the SparkyFitness-iPhone artifact and extract it on Windows.'
  echo 'Start with SparkyFitness-phone-only.ipa in Sideloadly using your free Apple account.'
  echo 'The phone-only package omits widgets, Live Activities and the Watch companion.'
  echo 'The with-extensions package preserves them, but needs separate signing/device validation.'
  echo 'Both packages need signing before installation; neither is an App Store build.'
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
