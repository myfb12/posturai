import React, { useRef, useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { CameraView, useCameraPermissions, CameraType, FlashMode } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import Svg, { Line, Rect } from "react-native-svg";
import { GlassCard } from "../components/ui/Glass";
import { Button, IconButton } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { MonoLabel } from "../components/ui/Typography";
import { color } from "../theme/tokens";
import { usePostureStore } from "../store/postureStore";

// Guided side-on capture. Wraps the native camera + gallery hardware; the actual
// permission checks, flip, and flash state live here and dispatch a photo URI
// into the store, which owns the analyze→result pipeline.
export function CaptureScreen() {
  const { submitPhoto, go } = usePostureStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<FlashMode>("off");
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const cameraReady = permission?.granted && Platform.OS !== "web";

  async function takePhoto() {
    if (busy) return;
    setBusy(true);
    try {
      const shot = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
      submitPhoto(shot?.uri ?? null);
    } catch {
      // Web / no-camera fallback: still run the flow with a sample scan.
      submitPhoto(null);
    } finally {
      setBusy(false);
    }
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]) submitPhoto(res.assets[0].uri);
  }

  return (
    <View className="flex-1 bg-canvas">
      {/* Camera layer (or dark placeholder when unavailable) */}
      {cameraReady ? (
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} flash={flash} />
      ) : (
        <View className="flex-1 items-center justify-center bg-canvas">
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 260,
              height: 260,
              borderRadius: 260,
              backgroundColor: color.acid,
              opacity: 0.05,
              filter: "blur(70px)" as any,
            }}
          />
        </View>
      )}

      {/* Guided framing overlay: the plumb line + a side-on frame */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <Svg width="100%" height="100%">
          <Line x1="50%" y1="8%" x2="50%" y2="86%" stroke={color.acid} strokeWidth={1.5} strokeOpacity={0.55} strokeDasharray="3 7" />
          <Rect x="24%" y="14%" width="52%" height="70%" rx={20} stroke={color.acid} strokeWidth={1.5} strokeOpacity={0.35} fill="none" strokeDasharray="6 8" />
        </Svg>
      </View>

      {/* Top controls */}
      <View
        style={{ position: "absolute", top: Platform.OS === "ios" ? 54 : 28, left: 20, right: 20 }}
        className="flex-row items-center justify-between"
      >
        <IconButton icon="close" label="Close capture" onPress={() => go("home")} />
        <View className="rounded-full border border-white/[0.08] bg-surface/70 px-3 py-1.5">
          <MonoLabel className="text-acid">Guided capture</MonoLabel>
        </View>
        <View className="flex-row gap-2">
          <IconButton
            icon={flash === "on" ? "flashOn" : "flashOff"}
            label="Toggle flash"
            active={flash === "on"}
            onPress={() => setFlash((f) => (f === "on" ? "off" : "on"))}
          />
          <IconButton
            icon="flipCamera"
            label="Flip camera"
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          />
        </View>
      </View>

      {/* Instruction */}
      <View style={{ position: "absolute", top: "17%", left: 0, right: 0 }} className="items-center">
        <View className="rounded-full border border-white/[0.08] bg-surface/80 px-4 py-2">
          <Text className="font-display text-zinc-200 text-[13px]">
            Left shoulder toward the camera · stand tall
          </Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={{ position: "absolute", bottom: Platform.OS === "ios" ? 42 : 28, left: 24, right: 24 }}>
        {!permission?.granted && Platform.OS !== "web" ? (
          <GlassCard className="mb-4 p-4">
            <Text className="font-display text-zinc-200 text-[13px]">
              Camera access lets you take the scan photo. It&apos;s analyzed on your device.
            </Text>
            <View className="mt-3">
              <Button label="Enable camera" onPress={requestPermission} />
            </View>
          </GlassCard>
        ) : null}

        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={pickFromGallery}
            accessibilityRole="button"
            accessibilityLabel="Choose a photo from your library"
            hitSlop={12}
            className="h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-surface/70"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Icon name="image" size={24} color={color.zinc100} />
          </Pressable>

          {/* Shutter */}
          <Pressable
            onPress={takePhoto}
            accessibilityRole="button"
            accessibilityLabel="Take posture photo"
            disabled={busy}
            className="h-[76px] w-[76px] items-center justify-center rounded-full bg-acid"
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.85 : 1,
                shadowColor: color.acid,
                shadowOpacity: 0.6,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            <View className="h-[62px] w-[62px] rounded-full border-4 border-canvas" />
          </Pressable>

          <View className="h-14 w-14 items-center justify-center">
            <MonoLabel>Side{"\n"}view</MonoLabel>
          </View>
        </View>
      </View>
    </View>
  );
}
