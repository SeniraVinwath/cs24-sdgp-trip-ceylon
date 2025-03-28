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
//       const response = await fetch("http://192.168.8.x:3000/api/data", {
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

//       <TouchableOpacity
//           onPress={() => navigation.navigate('UserIdEntry')}
//         ></TouchableOpacity>
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
import * as Network from 'expo-network';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LuggageTrackerLogin = () => {
  const [account, setAccount] = useState(""); 
  const [imei, setIMEI] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("Unknown");
  const [apiUrl, setApiUrl] = useState("http://192.168.8.x:3000/api/data");
  const router = useRouter();

  // Check network status on component mount
  useEffect(() => {
    checkNetworkStatus();
    loadSavedApiUrl();
  }, []);

  const loadSavedApiUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem('apiUrl');
      if (savedUrl) {
        setApiUrl(savedUrl);
      }
    } catch (error) {
      console.error("Error loading saved API URL:", error);
    }
  };

  const saveApiUrl = async (url) => {
    try {
      await AsyncStorage.setItem('apiUrl', url);
    } catch (error) {
      console.error("Error saving API URL:", error);
    }
  };

  const checkNetworkStatus = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      console.log("Network state:", networkState);
      
      if (networkState.isConnected) {
        // Try pinging the server
        pingServer();
      } else {
        setServerStatus("No network connection");
      }
    } catch (error) {
      console.error("Network check error:", error);
      setServerStatus("Network check failed");
    }
  };

  const pingServer = async () => {
    try {
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
      );
      
      const fetchPromise = fetch(apiUrl.replace('/api/data', '/api/ping'), {
        method: 'GET',
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeout]);
      
      if (response.ok) {
        setServerStatus("Server online");
      } else {
        setServerStatus(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error("Server ping error:", error);
      setServerStatus(`Server unreachable: ${error.message}`);
    }
  };

  const updateApiUrl = () => {
    Alert.prompt(
      "Update API URL",
      "Enter your server's IP address and port (e.g., 192.168.1.100:3000)",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Save",
          onPress: (ipPort) => {
            if (ipPort) {
              const newUrl = `http://${ipPort}/api/data`;
              setApiUrl(newUrl);
              saveApiUrl(newUrl);
              Alert.alert("Updated", `API URL set to: ${newUrl}`);
              pingServer();
            }
          }
        }
      ],
      "plain-text"
    );
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!account || !imei || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setLoading(true);
    console.log(`Attempting to connect to: ${apiUrl}`);
    console.log(`Sending data: Account=${account}, IMEI=${imei}, Password=****`);

    try {
      // Add timeout to the fetch call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          account,
          imei, 
          password 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log(`Response status: ${response.status}`);
      
      // Check if response is valid JSON
      const responseText = await response.text();
      console.log(`Response body: ${responseText}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        Alert.alert(
          "Response Error", 
          `Server responded with invalid format: ${responseText.substring(0, 100)}...`
        );
        setLoading(false);
        return;
      }
      
      // Save the IMEI for later use in luggage registration
      try {
        await AsyncStorage.setItem('lastLoginImei', imei);
        await AsyncStorage.setItem('lastLoginAccount', account);
        await AsyncStorage.setItem('lastLoginPassword', password);
        console.log("Login credentials saved to storage");
      } catch (error) {
        console.error("Error saving login data to storage:", error);
      }
      
      // Check if we received tracking data
      if (data.trackingData) {
        console.log("Tracking data received:", data.trackingData);
        Alert.alert(
          "Login Successful", 
          `Device found at coordinates: ${data.trackingData.latitude}, ${data.trackingData.longitude}`,
          [
            {
              text: "View on Map",
              onPress: () => {
                console.log("Navigating to map view");
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
                console.log("Navigating to luggage registration");
                router.push({
                  pathname: "/LuggageRegistrationScreen",
                  params: { 
                    imei: imei,
                    fromLogin: true
                  }
                });
              }
            }
          ]
        );
      } else {
        console.log("Login failed:", data.message || "No tracking data");
        Alert.alert("Login Failed", data.message || "Could not retrieve tracking data");
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
      
      let errorMessage = "Could not connect to the server. ";
      
      if (error.name === 'AbortError') {
        errorMessage += "Request timed out after 10 seconds.";
      } else if (error.message.includes('Network request failed')) {
        errorMessage += "Network request failed. Check server status and URL.";
      } else {
        errorMessage += error.toString();
      }
      
      Alert.alert(
        "Connection Error", 
        errorMessage,
        [
          {
            text: "Try Again",
            onPress: () => handleLogin()
          },
          {
            text: "Change API URL",
            onPress: () => updateApiUrl()
          },
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // For testing - bypass the API call
  const testNavigation = () => {
    router.push({
      pathname: "/LuggageRegistrationScreen",
      params: { 
        imei: "123456789012345",
        fromLogin: true
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Luggage Tracker Login</Text>
      
      <Text style={[styles.statusText, 
        serverStatus.includes("online") ? styles.statusOnline : 
        serverStatus.includes("error") || serverStatus.includes("unreachable") ? styles.statusError : 
        styles.statusWarning]}>
        Server: {serverStatus} 
        <Text 
          style={styles.updateLink}
          onPress={checkNetworkStatus}> (Check)</Text>
        <Text 
          style={styles.updateLink}
          onPress={updateApiUrl}> (Change URL)</Text>
      </Text>

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

      {/* Registration Navigation Button */}
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push("/LuggageRegistrationScreen")}
      >
        <Text style={styles.linkText}>Register New Luggage</Text>
      </TouchableOpacity>
      
      {/* Debug section - visible only in development */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Options</Text>
          <Text style={styles.debugText}>API URL: {apiUrl}</Text>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={testNavigation}
          >
            <Text style={styles.debugButtonText}>Test Navigation</Text>
          </TouchableOpacity>
        </View>
      )}
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
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 15,
    alignSelf: "center",
  },
  statusOnline: {
    color: "#9DD900",
  },
  statusWarning: {
    color: "#FFA500",
  },
  statusError: {
    color: "#FF4444",
  },
  updateLink: {
    textDecorationLine: "underline",
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
  linkButton: {
    marginTop: 15,
    padding: 10,
  },
  linkText: {
    color: "#9DD900",
    textDecorationLine: "underline",
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#9DD900",
    borderRadius: 8,
    width: "100%",
  },
  debugTitle: {
    color: "#9DD900",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  debugText: {
    color: "#9DD900",
    fontSize: 12,
    marginBottom: 5,
  },
  debugButton: {
    backgroundColor: "#444",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 5,
  },
  debugButtonText: {
    color: "#9DD900",
    fontSize: 14,
  },
};

export default LuggageTrackerLogin;

//   // Update with your actual local IP address
//   const API_URL = "http://192.168.8.x:3000/api/data"; 

//   const handleLogin = async () => {
//     // Validate inputs
//     if (!account || !imei || !password) {
//       Alert.alert("Error", "All fields are required");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await fetch(API_URL, {
//         method: "POST",
//         headers: { 
//           "Content-Type": "application/json" 
//         },
//         body: JSON.stringify({ 
//           account,
//           imei, 
//           password 
//         }),
//       });

//       const data = await response.json();
      
//       // Save the IMEI for later use in luggage registration
//       try {
//         await AsyncStorage.setItem('lastLoginImei', imei);
//         await AsyncStorage.setItem('lastLoginAccount', account);
//         await AsyncStorage.setItem('lastLoginPassword', password);
//       } catch (error) {
//         console.error("Error saving login data to storage:", error);
//       }
      
//       // Check if we received tracking data
//       if (data.trackingData) {
//         Alert.alert(
//           "Login Successful", 
//           `Device found at coordinates: ${data.trackingData.latitude}, ${data.trackingData.longitude}`,
//           [
//             {
//               text: "View on Map",
//               onPress: () => {
//                 // Navigate to tracking screen with location data
//                 router.push({
//                   pathname: "/LuggageLocationTracking",
//                   params: { 
//                     latitude: data.trackingData.latitude,
//                     longitude: data.trackingData.longitude,
//                     battery: data.trackingData.battery,
//                     imei: data.trackingData.imei
//                   }
//                 });
//               }
//             },
//             {
//               text: "Register Luggage",
//               onPress: () => {
//                 // Navigate to registration screen with IMEI parameter
//                 router.push({
//                   pathname: "/LuggageRegistrationScreen",
//                   params: { 
//                     imei: imei,
//                     fromLogin: true  // Flag to indicate this came from login
//                   }
//                 });
//               }
//             }
//           ]
//         );
//       } else {
//         Alert.alert("Login Failed", data.message || "Could not retrieve tracking data");
//       }
//     } catch (error) {
//       console.error("Error connecting to server:", error);
//       Alert.alert(
//         "Connection Error", 
//         "Could not connect to the server. Please check your internet connection and try again."
//       );
//     } finally {
//       setLoading(false);
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
//       <TouchableOpacity 
//         style={styles.greenButton} 
//         onPress={handleLogin}
//         disabled={loading}
//       >
//         {loading ? (
//           <ActivityIndicator color="black" />
//         ) : (
//           <Text style={styles.buttonText}>Login</Text>
//         )}
//       </TouchableOpacity>

//       {/* Registration Navigation Button */}
//       <TouchableOpacity
//         style={styles.linkButton}
//         onPress={() => router.push("/LuggageRegistrationScreen")}
//       >
//         <Text style={styles.linkText}>Register New Luggage</Text>
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
//   linkButton: {
//     marginTop: 15,
//     padding: 10,
//   },
//   linkText: {
//     color: "#9DD900",
//     textDecorationLine: "underline",
//   },
// };

// export default LuggageTrackerLogin;
