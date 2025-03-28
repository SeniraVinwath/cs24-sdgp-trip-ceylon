// import { StatusBar } from 'expo-status-bar';
// import { Button, StyleSheet, TextInput, View } from 'react-native';
// import { useState, useEffect } from 'react';
// import MapView from 'react-native-maps';

// export default function index() {
//   const [location, setLocation] = useState();
//   const [address, setAddress] = useState();

//   <MapView
//     style={{flex:1}}
//     provider="google"
//     googleMapsApiKey = "http://localhost:3000/api/data"
//   ></MapView>

//   useEffect(() => {
//     const getPermissions = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         console.log("Please grant location permissions");
//         return;
//       }

//       let currentLocation = await Location.getCurrentPositionAsync({});
//       setLocation(currentLocation);
//       console.log("Location:");
//       console.log(currentLocation);
//     };
//     getPermissions();
//   }, []);

//   const geocode = async () => {
//     const geocodedLocation = await Location.geocodeAsync(address);
//     console.log("Geocoded Address:");
//     console.log(geocodedLocation);
//   };

//   const reverseGeocode = async () => {
//     const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
//       longitude: location.coords.longitude,
//       latitude: location.coords.latitude
//     });

//     console.log("Reverse Geocoded:");
//     console.log(reverseGeocodedAddress);
//   };

//   return (
//     <View style={styles.container}>
//       <TextInput placeholder='Address' value={address} onChangeText={setAddress} />
//       <Button title="Geocode Address" onPress={geocode} />
//       <Button title="Reverse Geocode Current Location" onPress={reverseGeocode} />
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

// import { StatusBar } from 'expo-status-bar';
// import { Button, StyleSheet, TextInput, View } from 'react-native';
// import { useState, useEffect } from 'react';
// import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';

// export default function index() {
//   const [location, setLocation] = useState(null);
//   const [address, setAddress] = useState('');

//   useEffect(() => {
//     const getPermissions = async () => {
//       let { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         console.log("Please grant location permissions");
//         return;
//       }

//       let currentLocation = await Location.getCurrentPositionAsync({});
//       setLocation(currentLocation);
//     };

//     getPermissions();
//   }, []);

//   const geocode = async () => {
//     const geocodedLocation = await Location.geocodeAsync(address);
//     console.log("Geocoded Address:", geocodedLocation);
//     if (geocodedLocation.length > 0) {
//       setLocation({
//         coords: {
//           latitude: geocodedLocation[0].latitude,
//           longitude: geocodedLocation[0].longitude,
//         },
//       });
//     }
//   };

//   const reverseGeocode = async () => {
//     if (!location) return;
//     const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
//       longitude: location.coords.longitude,
//       latitude: location.coords.latitude,
//     });
//     console.log("Reverse Geocoded:", reverseGeocodedAddress);
//   };

//   return (
//     <View style={styles.container}>
//       {location && (
//         <MapView
//           style={styles.map}
//           provider="google"
//           initialRegion={{
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude,
//             latitudeDelta: 0.0922,
//             longitudeDelta: 0.0421,
//           }}
//         >
//           <Marker
//             coordinate={{
//               latitude: location.coords.latitude,
//               longitude: location.coords.longitude,
//             }}
//             title="Your Location"
//           />
//         </MapView>
//       )}

//       <TextInput
//         style={styles.input}
//         placeholder="Enter Address"
//         value={address}
//         onChangeText={setAddress}
//       />
//       <Button title="Geocode Address" onPress={geocode} />
//       <Button title="Reverse Geocode Current Location" onPress={reverseGeocode} />
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   map: {
//     width: '100%',
//     height: '50%',
//   },
//   input: {
//     height: 40,
//     borderColor: 'gray',
//     borderWidth: 1,
//     width: '80%',
//     marginVertical: 10,
//     paddingLeft: 8,
//   },
// });

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function LuggageLocationTracking() {
  const [luggageLocation, setLuggageLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Alert.alert(
      'Permission Request',
      'This app would like to track the luggage location. Do you allow this?',
      [
        {
          text: 'Cancel',
          onPress: () => {
            setErrorMsg('Permission denied by user');
            setLoading(false);
          },
          style: 'cancel',
        },
        {
          text: 'Allow',
          onPress: () => {
            const response = {
              data: {
                latitude: 6.08515,   
                longitude: 80.160755, 
              },
            };

            if (response.data) {
              setLuggageLocation(response.data);
            } else {
              setErrorMsg('Failed to fetch luggage location');
            }
            setLoading(false);
          },
        },
      ],
      { cancelable: false }
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {luggageLocation && (
        <MapView 
          style={styles.map}
          initialRegion={{
            latitude: luggageLocation.latitude,
            longitude: luggageLocation.longitude,
            latitudeDelta: 0.01, // Adjusted for better zoom
            longitudeDelta: 0.01, // Adjusted for better zoom
          }}
          mapType="standard" // Standard map with labels
          showsUserLocation={false}
        >
          <Marker
            coordinate={{
              latitude: luggageLocation.latitude,
              longitude: luggageLocation.longitude,
            }}
            title="Luggage Location"
            description="This is where your luggage is!"
          />
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});