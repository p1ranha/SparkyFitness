import React, { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n, { initializeI18n } from "../../src/localization/i18n";
import { setThemePreference } from "../../src/services/themeService";
import { queryClient } from "../../src/hooks/queryClient";
import MeasurementTimelineCard from "../../src/components/reports/MeasurementTimelineCard";
import GlucoseUnitSetting from "../../src/components/GlucoseUnitSetting";
import "../../global.css";
const Stack = createNativeStackNavigator();
function FixtureScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
    >
      <Text className="text-text-muted mb-3">
        Synthetic CGM fixture · API simulated · native UI
      </Text>
      <View className="bg-surface rounded-xl p-4 mb-3">
        <GlucoseUnitSetting />
      </View>
      <MeasurementTimelineCard startDate="2026-11-02" endDate="2026-11-03" />
    </ScrollView>
  );
}
export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([initializeI18n("en"), setThemePreference("Light")]).then(() =>
      setReady(true),
    );
  }, []);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <NavigationContainer>
                <Stack.Navigator>
                  <Stack.Screen
                    name="CGM emulator fixture"
                    component={FixtureScreen}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
