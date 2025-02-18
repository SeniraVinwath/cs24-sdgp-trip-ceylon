import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import globalStyles from "../styles/GlobalStyles";
import SuccessIcon from "../components/SuccessIcon";

const ProcessingScreenDeviceID = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Scanning Successful!</Text>
      <SuccessIcon size={120} color="green" />
      <Text style={globalStyles.title}>Device ID: {id}</Text>

      <TouchableOpacity style={globalStyles.button} onPress={() => router.push("/RegisterLuggageScreen")}>
        <Text style={globalStyles.buttonText}>PROCEED</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProcessingScreenDeviceID;