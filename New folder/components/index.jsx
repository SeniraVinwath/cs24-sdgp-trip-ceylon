// import React, { useState, useEffect } from "react";
// import { View, Text, Alert, StyleSheet } from "react-native";
// import { Camera } from "expo-camera";

// const QRScanner = ({ onScanSuccess }) => {
//   const [hasPermission, setHasPermission] = useState(null);

//   useEffect(() => {
//     (async () => {
//       const { status } = await Camera.requestCameraPermissionsAsync();
//       setHasPermission(status === "granted");
//     })();
//   }, []);

//   const handleBarCodeScanned = ({ data }) => {
//     Alert.alert("QR Code Scanned", `Device ID: ${data}`);
//     onScanSuccess(data);
//   };

//   if (hasPermission === null) return <Text>Requesting Camera Permission...</Text>;
//   if (hasPermission === false) return <Text>No access to camera</Text>;

//   return <Camera style={styles.camera} onBarCodeScanned={handleBarCodeScanned} />;
// };

// const styles = StyleSheet.create({
//   camera: { width: 300, height: 300, borderRadius: 10 },
// });

// export default QRScanner;

import { Camera, CameraView } from "expo-camera";
import { Stack } from "expo-router";
import {
  AppState,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from "react-native";
import { Overlay } from "./Overlay";
import { useEffect, useRef } from "react";

export default function Home() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      <Stack.Screen
        options={{
          title: "Overview",
          headerShown: false,
        }}
      />
      {Platform.OS === "android" ? <StatusBar hidden /> : null}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={({ data }) => {
          if (data && !qrLock.current) {
            qrLock.current = true;
            setTimeout(async () => {
              await Linking.openURL(data);
            }, 500);
          }
        }}
      />
      <Overlay />
    </SafeAreaView>
  );
}