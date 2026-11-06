# Fork-only Android emulator validation

This harness belongs on `cgm-emulator-validation`, not the upstream feature PR.
It builds the actual native CGM chart and glucose-unit setting with their real
hooks, native platform icons, Victory/Skia drawing, gestures, pickers and storage.
Only the API and connectivity boundaries are replaced at build time with
explicit synthetic fixtures. No real credentials or health records are used.

The UI test checks default and chosen units, fixture preference retention after
process restart, real two-finger zoom and horizontal pan, reset, exercise start
and end times, and API-sourced custom categories. Screenshots, results, failure
hierarchy and logs are kept as Actions artifacts. This test does not claim a
HealthKit read or server/database persistence; real database checks are recorded
separately in the local test report.

The workflow runs on a push to this testing branch or a manual dispatch. Fork
Actions must be enabled. Its dependencies are pinned and its repository token is
read-only. The APK is a synthetic test app signed with an ephemeral test key,
not a distributable production build.
