import React, { useState, useEffect } from "react";
import { View, Text, Alert, StyleSheet } from "react-native";
import { Camera } from "expo-camera";

const QRScanner = ({ onScanSuccess }) => {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    Alert.alert("QR Code Scanned", `Device ID: ${data}`);
    onScanSuccess(data);
  };

  if (hasPermission === null) return <Text>Requesting Camera Permission...</Text>;
  if (hasPermission === false) return <Text>No access to camera</Text>;

  return <Camera style={styles.camera} onBarCodeScanned={handleBarCodeScanned} />;
};

const styles = StyleSheet.create({
  camera: { width: 300, height: 300, borderRadius: 10 },
});

export default QRScanner;