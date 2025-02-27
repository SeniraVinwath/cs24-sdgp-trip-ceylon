import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const AddItineraryScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "black", padding: 20 }}>
      <TouchableOpacity style={{ backgroundColor: "white", padding: 20, borderRadius: 10, marginBottom: 10, marginTop: 25 }}>
        <Text style={{ fontSize: 16 }}>+ Create Itinerary</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 18, textAlign: "center", marginTop: 20, color: "white" }}>No Ongoing Trips</Text>
    </View>
  );
};

export default AddItineraryScreen;