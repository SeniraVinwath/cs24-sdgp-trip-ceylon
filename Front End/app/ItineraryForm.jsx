import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ItineraryForm = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "black", padding: 20, marginTop: 20 }}>
      <Text style={{ color: "white", fontSize: 16 }}>Destination</Text>
      <TextInput
        placeholder="Enter preferred Destination"
        placeholderTextColor="gray"
        style={{
          backgroundColor: "white",
          padding: 20,
          borderRadius: 10,
          marginVertical: 10,
        }}
      />

      <Text style={{ color: "white", fontSize: 16 }}>Starting Date</Text>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 10, marginVertical: 10, padding: 12 }}>
        <TextInput placeholder="DD-MM-YYYY" placeholderTextColor="gray" style={{ flex: 1 }} />
        <Ionicons name="calendar-outline" size={24} color="gray" />
      </View>

      <Text style={{ color: "white", fontSize: 16 }}>End Date</Text>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 10, marginVertical: 10, padding: 12 }}>
        <TextInput placeholder="DD-MM-YYYY" placeholderTextColor="gray" style={{ flex: 1 }} />
        <Ionicons name="calendar-outline" size={24} color="gray" />
      </View>

      <TouchableOpacity style={{ backgroundColor: "limegreen", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 20 }}>
        <Text style={{ color: "black", fontSize: 18, fontWeight: "bold" }}>Generate Travel Plan</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ItineraryForm;