import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Camera } from "expo-camera";
import { useRouter } from "expo-router";
import globalStyles from "../styles/GlobalStyles";

const EnterDeviceIDScreen = () => {
  const [deviceID, setDeviceID] = useState("");
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const router = useRouter();
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleCapture = async () => {
    if (cameraRef.current) {
      // Capture a photo using Expo Camera but ignore its output.
      await cameraRef.current.takePictureAsync();
      // Simply exit the camera view.
      setScanning(false);
    }
  };

  return (
    <View style={globalStyles.container}>
      {!scanning ? (
        <>
          <Text style={globalStyles.title}>Scan a QR Code</Text>
          <Image source={require("../assets/qr-icon.png")} style={globalStyles.image} />
          <Text style={globalStyles.title}>OR</Text>

          <TextInput
            style={globalStyles.input}
            placeholder="Enter your Device ID"
            placeholderTextColor="#888"
            value={deviceID}
            onChangeText={setDeviceID}
          />

          <TouchableOpacity
            style={globalStyles.button}
            onPress={() => {
              if (hasPermission) {
                setScanning(true);
              } else {
                alert("Camera permission not granted");
              }
            }}
          >
            <Text style={globalStyles.buttonText}>SCAN QR CODE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[globalStyles.button, { marginTop: 10 }]}
            onPress={() => router.push(`/ProcessingScreen?id=${deviceID}`)}
            disabled={!deviceID}
          >
            <Text style={globalStyles.buttonText}>PROCEED</Text>
          </TouchableOpacity>
        </>
      ) : (
        // Camera view when scanning is enabled.
        <View style={{ flex: 1, width: "100%" }}>
          <Camera style={{ flex: 1 }} ref={cameraRef} />
          <View style={{ position: "absolute", bottom: 20, flexDirection: "row", justifyContent: "space-evenly", width: "100%" }}>
            <TouchableOpacity style={globalStyles.button} onPress={handleCapture}>
              <Text style={globalStyles.buttonText}>CAPTURE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={globalStyles.button} onPress={() => setScanning(false)}>
              <Text style={globalStyles.buttonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default EnterDeviceIDScreen;