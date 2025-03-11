import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router'; 
import { Link } from 'expo-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton'; 
import colors from '../constants/colors';
import typography from '../constants/typography';

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const router = useRouter(); 

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "We need location access to find nearby travelers.");
        return;
      }
      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation.coords);
      console.log("User's Location:", userLocation.coords);
    };

    requestLocationPermission();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.backButtonContainer}>
        <BackButton router={router} />
      </View>

      <Header title="Find Travel Companions" subtitle="Connect with travelers exploring Sri Lanka" />

      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>MENU</Text>

        <Link href="/find-travelers" style={styles.menuItem}>
          <Text style={styles.menuItemText}>Find Travelers</Text>
        </Link>

        <Link href="/MyConnectionsScreen" style={styles.menuItem}>
          <Text style={styles.menuItemText}>My Connections</Text>
        </Link>

        <Link href="/requests" style={styles.menuItem}>
          <Text style={styles.menuItemText}> Connection Requests</Text>
        </Link>

        <Image source={require('../assets/images/LANDING IMAGE.png')} style={styles.map} resizeMode="contain" />
      </View>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondary,
    },
    backButtonContainer: {
      position: "absolute",
      top: 42, 
      left: 5,
      zIndex: 10, 
    },
    menuContainer: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
    },
    menuTitle: {
      ...typography.heading,
      marginBottom: 20,
    },
    menuItem: {
      backgroundColor: '#222222',
      width: '100%',
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      alignItems: 'center',
    },
    menuItemText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: '500',
    },
    map: {
      width: '80%',
      height: 250,
      marginTop: 50,
      marginLeft: 10,
    },
  });
  