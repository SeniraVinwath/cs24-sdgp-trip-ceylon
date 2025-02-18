import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import globalStyles from "../styles/GlobalStyles";

const LuggageTrackingHomeQRScreen = () => {
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>A Luggage Tracker Like No Other</Text>

      <Image source={require("../assets/qr-sticker.png")} style={globalStyles.qrImage} />

      <Text style={globalStyles.subtitle}>For improved security and recovery</Text>

      <TouchableOpacity style={globalStyles.button} onPress={() => router.push("/ScanScreen")}>
        <Text style={globalStyles.buttonText}>NEXT</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LuggageTrackingHomeQRScreen;