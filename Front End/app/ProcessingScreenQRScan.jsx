import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import globalStyles from "../styles/GlobalStyles";
import SuccessIcon from "../components/SuccessIcon"; // Import the component

const ProcessingScreenQRScan = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Scanning successful!</Text>

      {/* Use SuccessIcon Component */}
      <SuccessIcon size={120} color="green" />

      <Text style={globalStyles.deviceID}>Device ID: {id ? id : "N/A"}</Text>

      <TouchableOpacity style={globalStyles.button} onPress={() => router.push("/HomeScreen")}>
        <Text style={globalStyles.buttonText}>PROCEED</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProcessingScreenQRScan;