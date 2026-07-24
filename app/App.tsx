import "./global.css";
import React from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { SpaceMono_400Regular, SpaceMono_700Bold } from "@expo-google-fonts/space-mono";

import { usePostureStore } from "./src/store/postureStore";
import { ConsentScreen } from "./src/screens/ConsentScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { CaptureScreen } from "./src/screens/CaptureScreen";
import { AnalyzingScreen } from "./src/screens/AnalyzingScreen";
import { ResultsScreen } from "./src/screens/ResultsScreen";
import { ProgressScreen } from "./src/screens/ProgressScreen";
import { color } from "./src/theme/tokens";

export default function App() {
  const screen = usePostureStore((s) => s.screen);
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: color.canvas, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={color.acid} />
      </View>
    );
  }

  const content = (
    <View style={{ flex: 1, backgroundColor: color.canvas }}>
      <StatusBar style="light" />
      {screen === "consent" && <ConsentScreen />}
      {screen === "home" && <HomeScreen />}
      {screen === "capture" && <CaptureScreen />}
      {screen === "analyzing" && <AnalyzingScreen />}
      {screen === "results" && <ResultsScreen />}
      {screen === "progress" && <ProgressScreen />}
    </View>
  );

  // On desktop web, lock the app into a centered phone frame so it reads as a
  // device instead of stretching full-width. On native it fills the screen.
  if (Platform.OS === "web") {
    return (
      <View className="min-h-screen w-full items-center" style={{ backgroundColor: "#0b0b0e" }}>
        <View
          className="relative h-screen w-full max-w-[430px] overflow-hidden shadow-2xl"
          style={{ backgroundColor: color.canvas }}
        >
          {content}
        </View>
      </View>
    );
  }

  return content;
}
