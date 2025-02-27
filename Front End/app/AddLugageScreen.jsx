import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const AddLugageScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "black", padding: 20 }}>
      <TouchableOpacity style={{ backgroundColor: "white", padding: 20, borderRadius: 10, marginBottom: 10, marginTop: 25 }}>
        <Text style={{ fontSize: 16 }}>+ Add Luggage</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 18, textAlign: "center", marginTop: 20, color: "white" }}>
        No Added Luggages
      </Text>
    </View>
  );
};

export default AddLugageScreen;
