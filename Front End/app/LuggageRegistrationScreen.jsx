import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

const LuggageRegistrationScreen = () => {
  const [userId, setUserId] = useState(""); // New state for User ID
  const [luggageType, setLuggageType] = useState("");
  const [luggageName, setLuggageName] = useState("");
  const [size, setSize] = useState("");
  const [weight, setWeight] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Validation function
  const validateInputs = () => {
    let errors = [];

    // Validate User ID (Alphanumeric only)
    if (!/^[A-Za-z0-9]+$/.test(userId.trim()) || userId.trim() === "") {
      errors.push("User ID must contain only letters and numbers.");
    }

    // Validate Size (Only Numbers)
    if (!/^\d+(\.\d+)?$/.test(size.trim()) || size.trim() === "") {
      errors.push("Size must be a valid number.");
    }

    // Validate Weight (Only Numbers)
    if (!/^\d+(\.\d+)?$/.test(weight.trim()) || weight.trim() === "") {
      errors.push("Weight must be a valid number.");
    }

    // Validate Luggage Type (Only Letters)
    if (!/^[A-Za-z\s]+$/.test(luggageType.trim()) || luggageType.trim() === "") {
      errors.push("Use only letters for Type.");
    }

    // Validate Luggage Name (Only Letters)
    if (!/^[A-Za-z\s]+$/.test(luggageName.trim()) || luggageName.trim() === "") {
      errors.push("Use only letters for Name.");
    }

    // Validate Additional Info (Only Letters)
    if (!/^[A-Za-z\s]+$/.test(additionalInfo.trim()) || additionalInfo.trim() === "") {
      errors.push("Use only letters for Additional Info.");
    }

    // Show all errors in one alert
    if (errors.length > 0) {
      Alert.alert("Invalid Input", errors.join("\n"));
      return false;
    }

    return true;
  };

  // Function for register button
  const handleRegister = () => {
    if (validateInputs()) {
      Alert.alert("Success", "Luggage registered successfully!");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Luggage </Text>

      {/* User ID (Alphanumeric Only) */}
      <Text style={styles.label}>User ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter User ID"
        placeholderTextColor="#999"
        value={userId}
        onChangeText={setUserId}
        keyboardType="default"
      />

      {/* Luggage Type (Letters Only) */}
      <Text style={styles.label}>Name of your luggage type</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter type"
        placeholderTextColor="#999"
        value={luggageType}
        onChangeText={setLuggageType}
        keyboardType="default"
      />

      {/* Luggage Name (Letters Only) */}
      <Text style={styles.label}>Provide a name for your luggage</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter name"
        placeholderTextColor="#999"
        value={luggageName}
        onChangeText={setLuggageName}
        keyboardType="default"
      />

      {/* Size (Numbers Only) */}
      <Text style={styles.label}>Size</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter size"
        placeholderTextColor="#999"
        value={size}
        onChangeText={setSize}
        keyboardType="numeric"
      />

      {/* Weight (Numbers Only) */}
      <Text style={styles.label}>Weight</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter weight"
        placeholderTextColor="#999"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
      />

      {/* Additional Info (Letters Only) */}
      <Text style={styles.label}>Additional Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Any extra details"
        placeholderTextColor="#999"
        value={additionalInfo}
        onChangeText={setAdditionalInfo}
        keyboardType="default"
      />

      {/* Register Button */}
      <TouchableOpacity style={styles.greenButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>OR</Text>

      {/* Add Luggage Button */}
      <TouchableOpacity style={styles.addLuggageButton}>
        <Text style={styles.buttonText}>+ Add Luggage</Text>
      </TouchableOpacity>

      {/* Navigation Link */}
      <TouchableOpacity>
        <Text style={styles.linkText}>
          Proceed to the Luggage Tracking Dashboard
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = {
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  label: {
    color: "white",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    color: "black",
  },
  greenButton: {
    backgroundColor: "#9DD900",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  addLuggageButton: {
    backgroundColor: "#9DD900",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    color: "white",
    marginVertical: 10,
  },
  linkText: {
    color: "#9DD900",
    marginTop: 10,
    textDecorationLine: "underline",
  },
};

export default LuggageRegistrationScreen;