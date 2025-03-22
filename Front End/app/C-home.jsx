import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase'; // Supabase-native import
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import colors from '../constants/colors';
import typography from '../constants/typography';

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const { user } = useAuth(); // Get logged-in user data
  const router = useRouter();

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "We need location access to find nearby travelers.");
        return;
      }

      const userLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = userLocation.coords;
      setLocation({ latitude, longitude });

      console.log("User's Location:", latitude, longitude);

      const user_id = user?.id;
      if (!user_id) {
        console.error("Error: User ID not found");
        return;
      }

      // Store location using Supabase
      const { error } = await supabase
        .from('user_locations')
        .upsert([
          {
            user_id,
            location: `SRID=4326;POINT(${longitude} ${latitude})`,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: ['user_id'] });

      if (error) {
        console.error("Error storing location in Supabase:", error.message);
      } else {
        console.log("Location stored successfully via Supabase.");
      }
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
