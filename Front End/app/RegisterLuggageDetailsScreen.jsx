import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import globalStyles from "../styles/GlobalStyles";

const RegisterLuggageDetailsScreen = () => {
  const [luggageName, setLuggageName] = useState("");
  const [size, setSize] = useState("");
  const [weight, setWeight] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const router = useRouter();

  return (
    <View style={globalStyles.container}>
      <Image source={require("../assets/luggage-image.png")} style={globalStyles.image} />

      <TextInput
        style={globalStyles.input}
        placeholder="Name of your luggage type"
        placeholderTextColor="#888"
        value={luggageName}
        onChangeText={setLuggageName}
      />

      <TextInput
        style={globalStyles.input}
        placeholder="Size"
        placeholderTextColor="#888"
        value={size}
        onChangeText={setSize}
      />

      <TextInput
        style={globalStyles.input}
        placeholder="Weight"
        placeholderTextColor="#888"
        value={weight}
        onChangeText={setWeight}
      />

      <TextInput
        style={globalStyles.input}
        placeholder="Additional Information"
        placeholderTextColor="#888"
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
      />

      <TouchableOpacity style={globalStyles.button} onPress={() => router.push("/LuggageTrackingDashboard")}>
        <Text style={globalStyles.buttonText}>Proceed to Luggage Tracking Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity style={globalStyles.button} onPress={() => alert("Luggage Registered Successfully!")}>
        <Text style={globalStyles.buttonText}>REGISTER</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterLuggageDetailsScreen;