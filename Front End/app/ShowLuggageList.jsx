import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

const ShowLuggageList = () => {
  const router = useRouter();
  const [luggageData, setLuggageData] = useState([]);

  // Fetch real-time data
  const fetchLuggageData = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/data");
      const data = await response.json();
      setLuggageData(data.luggage);
    } catch (error) {
      console.error("Error fetching luggage data:", error);
    }
  };

  useEffect(() => {

    const mockData = [
      { id: '1', name: 'Luggage 1', imei: '123456789', battery: 80, mode: 'Active', timestamp: '2025-03-22 14:00' },
      { id: '2', name: 'Luggage 2', imei: '987654321', battery: 60, mode: 'Inactive', timestamp: '2025-03-22 14:05' },
    ];

    // Set mock data to state
    setLuggageData(mockData);

    fetchLuggageData(); // Initial fetch
    const interval = setInterval(fetchLuggageData, 60000); // Auto-refresh every 1 minute
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SHOW LUGGAGE LIST</Text>

      <FlatList
        data={luggageData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.luggageCard}>
            <View style={styles.luggageInfo}>
              {/* Luggage Icon and Name */}
              <View style={styles.row}>
                <FontAwesome5 name="suitcase-rolling" size={20} color="black" />
                <Text style={styles.luggageName}>{item.name}</Text>
              </View>

              {/* IMEI */}
              <View style={styles.row}>
                <Text style={styles.luggageDetails}>IMEI: {item.imei}</Text>
              </View>

              {/* Battery Icon & Percentage */}
              <View style={styles.row}>
                <Ionicons name="battery-full" size={20} color="green" />
                <Text style={styles.luggageDetails}>{item.battery}%</Text>
              </View>

              {/* GPS Mode */}
              <View style={styles.row}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color="blue" />
                <Text style={styles.luggageDetails}>{item.mode}</Text>
              </View>

              {/* Time Icon & Timestamp */}
              <View style={styles.row}>
                <Ionicons name="time-outline" size={20} color="gray" />
                <Text style={styles.luggageDetails}>{item.timestamp}</Text>
              </View>
            </View>

            {/* "For More Details" Green Button with Icon */}
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => router.push(`/luggage-details/${item.id}`)}
            >
              <Text style={styles.buttonText}>For More Details</Text>
              <Ionicons name="arrow-forward-circle" size={20} color="black" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 15,
  },
  luggageCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // Space between icon and text
    marginBottom: 5,
  },
  luggageName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "green",
  },
  luggageDetails: {
    fontSize: 14,
    color: "black",
  },
  detailsButton: {
    backgroundColor: "#9DD900",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5, // Space between text and icon
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
  },
});

export default ShowLuggageList;
