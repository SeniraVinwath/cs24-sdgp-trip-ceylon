import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

const UserIDScreen = () => {
  const [userID, setUserID] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (userID.trim()) {
      router.push(`/luggage-details/${userID}`);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("../assets/images/luggage-image.png")} style={styles.image}resizeMode="contain" />
      <Text style={styles.title}>Enter User ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your ID"
        placeholderTextColor="gray"
        value={userID}
        onChangeText={setUserID}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  image: {
    width: "100%",
    height: 200,
    marginBottom: 20,
  },
  title: {
    
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#9DD900",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
});

export default UserIDScreen;