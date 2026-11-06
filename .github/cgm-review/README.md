# Glucose UI validation proof

All screenshots use synthetic health data.

Native Android screenshots: Pixel 6 emulator, API 35, real React Native controls and Victory/Skia drawing. Built from feature source `06c9234d233eebee10a11893866b976124ababea` (includes the shortened setting subtitle). Six native UI checks passed: https://github.com/p1ranha/SparkyFitness/actions/runs/42259070604 .

API/connectivity boundaries are fixtures; preference retention in the fixture is AsyncStorage. Actual database persistence and access isolation were tested separately. These screenshots do not establish a real Dexcom/HealthKit or Health Connect import.

Web screenshots show the actual web components with synthetic data. The circled settings image highlights the added glucose-unit preference.
