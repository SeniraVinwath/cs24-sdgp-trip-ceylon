// import React, { useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Alert,
// } from "react-native";
// import { useRouter } from "expo-router";

// const LuggageTrackerLogin = () => {
//   const [account, setAccount] = useState(""); 
//   const [imei, setIMEI] = useState("");
//   const [password, setPassword] = useState("");
//   const router = useRouter();

//   const handleLogin = async () => {
//     try {
//       const response = await fetch("http://localhost:3000/api/data", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ account, imei, password }),
//       });

//       const data = await response.json();
//       if (data.success) {
//         Alert.alert("Login Successful", "Proceed to luggage registration.");
//         router.push(`/luggage-registration/${account}`); // Redirect to registration screen
//       } else {
//         Alert.alert("Login Failed", "Invalid credentials or IMEI mismatch");
//       }
//     } catch (error) {
//       console.error(error);
//       Alert.alert("Error", "Failed to connect to server");
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Luggage Tracker Login</Text>

//       {/* Account */}
//       <Text style={styles.label}>Account</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter Account"
//         placeholderTextColor="#999"
//         value={account}
//         onChangeText={setAccount}
//         keyboardType="default"
//       />

//       {/* IMEI */}
//       <Text style={styles.label}>IMEI</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter IMEI"
//         placeholderTextColor="#999"
//         value={imei}
//         onChangeText={setIMEI}
//         keyboardType="numeric"
//       />

//       {/* Password */}
//       <Text style={styles.label}>Password</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter Password"
//         placeholderTextColor="#999"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />

//       {/* Login Button */}
//       <TouchableOpacity style={styles.greenButton} onPress={handleLogin}>
//         <Text style={styles.buttonText}>Login</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = {
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "black",
//     padding: 20,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: "white",
//     marginBottom: 20,
//   },
//   label: {
//     color: "white",
//     alignSelf: "flex-start",
//     marginBottom: 5,
//   },
//   input: {
//     width: "100%",
//     backgroundColor: "white",
//     padding: 10,
//     borderRadius: 8,
//     marginBottom: 15,
//     color: "black",
//   },
//   greenButton: {
//     backgroundColor: "#9DD900",
//     padding: 15,
//     borderRadius: 8,
//     width: "100%",
//     alignItems: "center",
//     marginTop: 10,
//   },
//   buttonText: {
//     color: "black",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
// };

// export default LuggageTrackerLogin;

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

const index2 = () => {
  const [account, setAccount] = useState(""); 
  const [imei, setIMEI] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Replace with your actual backend URL
  const API_URL = "http://192.168.8.x:3000/api/data";

  const handleLogin = async () => {
    // Validate inputs
    if (!account || !imei || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          account,
          imei, 
          password 
        }),
      });

      const data = await response.json();
      
      // Check if we received tracking data
      if (data.trackingData) {
        Alert.alert(
          "Login Successful", 
          "Device found at coordinates: ${data.trackingData.latitude}, ${data.trackingData.longitude}"
          [
            {
              text: "View on Map",
              onPress: () => {
                // Navigate to tracking screen with location data
                router.push({
                  pathname: "/LuggageLocationTracking",
                  params: { 
                    latitude: data.trackingData.latitude,
                    longitude: data.trackingData.longitude,
                    battery: data.trackingData.battery,
                    imei: data.trackingData.imei
                  }
                });
              }
            },
            {
              text: "Register Luggage",
              onPress: () => {
                // Navigate to registration screen and pass the IMEI
                router.push({
                  pathname: "/LuggageRegistrationScreen",
                  params: { 
                    imei: imei,
                    account: account
                  }
                });
              }
            }
          ]
        );
      } else {
        Alert.alert("Login Failed", data.message || "Could not retrieve tracking data");
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
      Alert.alert(
        "Connection Error", 
        "Could not connect to the server. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Luggage Tracker Login</Text>

      {/* Account */}
      <Text style={styles.label}>Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Account"
        placeholderTextColor="#999"
        value={account}
        onChangeText={setAccount}
        keyboardType="default"
      />

      {/* IMEI */}
      <Text style={styles.label}>IMEI</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter IMEI"
        placeholderTextColor="#999"
        value={imei}
        onChangeText={setIMEI}
        keyboardType="numeric"
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Login Button */}
      <TouchableOpacity 
        style={styles.greenButton} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
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
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
};

export default index2;

