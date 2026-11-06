import AsyncStorage from "@react-native-async-storage/async-storage";
const DAY = "2026-11-03";
const KEY = "@cgm-emulator-fixture/preferences";
const defaults = {
  timezone: "UTC",
  time_format: "HH:mm",
  default_glucose_unit: "mmol/L",
};
const samples = Array.from({ length: 288 }, (_, i) => ({
  t: new Date(Date.UTC(2026, 10, 3, 0, i * 5)).toISOString(),
  mmol_l:
    5.2 +
    0.25 * Math.sin(i / 10) +
    3.2 * Math.exp(-(((i - 95) / 15) ** 2)) +
    2.4 * Math.exp(-(((i - 160) / 17) ** 2)) +
    2.7 * Math.exp(-(((i - 225) / 14) ** 2)),
  source_bundle_id: "com.dexcom.fixture",
})).filter((_, i) => i < 174 || i > 183);
export const normalizeUrl = (url: string) => url.replace(/\/$/, "");
/** Test-build API boundary only. Native components, hooks, storage and drawing stay real. */
export async function apiFetch<T>({
  endpoint,
  method = "GET",
  body,
}: {
  endpoint: string;
  method?: string;
  body?: unknown;
}): Promise<T> {
  const url = new URL(endpoint, "https://fixture.invalid");
  const path = url.pathname.replace(/^\/api/, "");
  let result: unknown;
  if (path === "/user-preferences") {
    const prefs = {
      ...defaults,
      ...JSON.parse((await AsyncStorage.getItem(KEY)) ?? "{}"),
    };
    if (method === "PUT") {
      Object.assign(prefs, body);
      await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
    }
    result = prefs;
  } else if (path === "/measurements/custom-categories")
    result = [
      {
        id: "cgm-import",
        name: "Imported CGM",
        measurement_type: "mg/dL",
        data_type: "numeric",
        frequency: "All",
      },
    ];
  else if (path.startsWith("/measurements/custom-entries/"))
    result = [
      {
        id: "custom-1",
        category_id: "cgm-import",
        entry_date: DAY,
        entry_timestamp: DAY + "T10:00:00Z",
        value: "90",
        source: "dexcom-api",
      },
      {
        id: "custom-2",
        category_id: "cgm-import",
        entry_date: DAY,
        entry_timestamp: DAY + "T10:05:00Z",
        value: "110",
        source: "dexcom-api",
      },
    ];
  else if (path === "/generic-health/samples")
    result = {
      data:
        url.searchParams.get("metric") === "blood_glucose"
          ? [
              {
                metric: "blood_glucose",
                entry_date: DAY,
                source_provider: "SparkyFitness Mobile",
                samples,
              },
            ]
          : [
              {
                metric: "stress",
                entry_date: DAY,
                source_provider: "Fixture watch",
                samples: [{ t: DAY + "T11:00:00Z", level: 35 }],
              },
            ],
    };
  else if (path === "/generic-health/metrics") result = { data: [] };
  else if (path === "/daily-summary")
    result =
      url.searchParams.get("date") === DAY
        ? {
            foodEntries: [
              {
                id: "breakfast",
                entry_date: DAY,
                entry_time: "07:00",
                food_name: "Oatmeal and coffee",
                quantity: 100,
                serving_size: 100,
                carbs: 45,
                caffeine_mg: 80,
              },
              {
                id: "lunch",
                entry_date: DAY,
                entry_time: "12:30",
                food_name: "Rice and chicken",
                quantity: 100,
                serving_size: 100,
                carbs: 60,
              },
              {
                id: "dinner",
                entry_date: DAY,
                entry_time: "18:00",
                food_name: "Pasta",
                quantity: 100,
                serving_size: 100,
                carbs: 65,
                alcohol_g: 10,
              },
            ],
            exerciseSessions: [
              {
                id: "walk",
                type: "individual",
                name: "Walk",
                entry_time: "15:30",
                duration_minutes: 45,
              },
            ],
            waterIntake: 1800,
          }
        : { foodEntries: [], exerciseSessions: [], waterIntake: 0 };
  else if (path === "/sleep")
    result = [
      {
        id: "sleep",
        entry_date: DAY,
        bedtime: "2026-11-02T22:30:00Z",
        wake_time: DAY + "T06:30:00Z",
      },
    ];
  else if (path === "/v2/medications/entries")
    result = [
      {
        id: "dose",
        entry_date: DAY,
        status: "taken",
        taken_at: DAY + "T06:45:00Z",
        med_name_snapshot: "Fixture medication",
        dose_amount_snapshot: 5,
        dose_unit_snapshot: "mg",
      },
    ];
  else if (path.endsWith("/log"))
    result = [
      {
        id: "water",
        entry_date: DAY,
        logged_at: DAY + "T09:15:00Z",
        water_ml: 250,
        container_name: "Glass",
      },
    ];
  else throw new Error("Unexpected emulator fixture endpoint: " + path);
  return result as T;
}
