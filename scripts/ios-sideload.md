# Personal iPhone builds from Windows

Run **Build iPhone IPA for Sideloadly** from the fork's Actions tab. It builds
the selected branch on a hosted Mac without any Apple password, certificate,
provisioning profile, Expo account, or paid Apple membership. Standard GitHub
hosted runners are free for public repositories. Artifacts expire after 7 days.

The workflow uses a separate development bundle ID, but builds **Release** so
the JavaScript is embedded and the app does not need Metro running on your PC.
Enter your own SparkyFitness server and login in the installed app. Updating
the app does not update or migrate the server.

## Install on Windows

1. Download the `SparkyFitness-iPhone-<run number>` artifact from a successful
   run and extract the ZIP. Start with `SparkyFitness-phone-only.ipa`.
2. Install Sideloadly from https://sideloadly.io/. Follow its current Windows
   requirements for Apple's desktop iTunes and iCloud components. Do not
   uninstall existing Apple software without checking which version is installed.
3. Connect your unlocked iPhone by USB and tap **Trust** on the phone when asked.
4. Open Sideloadly, choose your phone, and load the IPA. Use Apple ID sideloading
   with your own free Apple account. Enter the password and any verification
   code directly in Sideloadly, never in a GitHub secret or chat.
5. Keep the configured bundle identifier if possible; changing it can affect
   shared groups, entitlements, and future updates. Click **Start**.
6. If prompted on the phone, enable Developer Mode under Settings > Privacy &
   Security, restart, and confirm. Trust your developer profile under Settings >
   General > VPN & Device Management. These are user actions on the phone.
7. Launch **DevSparkyFitness**, configure your server, and test login, camera,
   notifications and Apple Health access/sync. Source compilation and IPA
   validation do not prove these hardware features work.

## Packages and limits

- `phone-only`: no widget extensions, Live Activities or Watch companion. Shared
  App Group and shared keychain entitlements are removed for this package;
  extension-based shortcuts and controls may therefore be unavailable. HealthKit
  entitlements are retained, but the final profile produced by Sideloadly must
  authorize them. Verify the Apple Health permission prompt and sync on device.
- `with-extensions`: preserves the widgets and Watch targets and their requested
  groups. **Sideloadly 0.71.0 supports Watch signing only with paid Apple
  accounts; its release notes list free-account Watch support as forthcoming.**
  This package preserves the Watch build for future use; it is not a verified
  free-account Watch installation route. Free-account limits, group remapping
  and the signing tool may also affect shared-data features.
- NFC, Associated Domains and remote push entitlements are excluded. In-app
  scanning and local notifications remain available. Time-sensitive notification
  entitlement is excluded, so Focus mode may silence notifications.
- The packaged binaries have only local ad-hoc signatures preserving entitlement
  metadata; these cannot install the app by themselves. Sideloadly must re-sign
  the binaries and obtain the free-account provisioning profile.
- Free-account profiles expire after 7 days, and Apple limits installed apps to
  3 per device. Sideloadly can refresh automatically while the PC and phone can
  connect. Refresh before expiry; an expired app needs re-signing, not a rebuild.
- No TestFlight/App Store distribution is configured.

## Build troubleshooting

On failure, inspect the failed Actions step and the uploaded Xcode log if one
exists. The macOS runner must include an Xcode version compatible with this
revision of Expo/React Native. Do not substitute an iOS Simulator artifact:
it cannot run on an iPhone. The package script checks that the device build
contains its JavaScript bundle and retains the main app's HealthKit entitlement.

If Sideloadly rejects an entitlement, keep the exact error (without account or
device identifiers) so the signing/profile mismatch can be corrected. Installing
the IPA is only the first check; successful launch and feature tests are needed.
