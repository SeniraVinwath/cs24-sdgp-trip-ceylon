import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert, Platform, Pressable } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import ScreenWrapper from '../components/ScreenWrapper';
import { wp, hp } from '../helpers/common';
import Head from '../components/Head';
import Icon from '../assets/icons';

export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const platformSpacing = {
    paddingBottom: Platform.select({
      ios: Math.max(insets.bottom, hp(2)),
      android: Math.max(insets.bottom, hp(2)),
    }),
  };

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

      const user_id = user?.id;
      if (!user_id) {
        console.error("Error: User ID not found");
        return;
      }

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

  // Direct navigation handler function
  const navigateTo = (path) => {
    router.push(path);
  };

  return (
    <ScreenWrapper bg="#303030">
      <View style={[styles.container, platformSpacing]}>
        <Head title="Stay Connected" />

        <View style={styles.menuContainer}>
          <View style={styles.gridContainer}>
            {/* Option 1: Using Link with Pressable */}
            <Link href="/find-travelers" asChild>
              <Pressable style={styles.menuItem}>
                <View style={styles.iconContainer}>
                  <Icon name="findTravelers" size={hp(3.2)} strokeWidth={2}/>
                </View>
                <Text style={styles.menuItemText}>Nearby{'\n'}Travelers</Text>
              </Pressable>
            </Link>

            {/* Option 2: Using Pressable with router.push */}
            <Pressable 
              style={styles.menuItem} 
              onPress={() => navigateTo('/MyConnectionsScreen')}
            >
              <View style={styles.iconContainer}>
                <Icon name="myConnections" size={hp(3.2)} strokeWidth={2}/>
              </View>
              <Text style={styles.menuItemText}>My{'\n'}Connections</Text>
            </Pressable>

            <Pressable 
              style={styles.menuItem} 
              onPress={() => navigateTo('/requests')}
            >
              <View style={styles.iconContainer}>
                <Icon name="pending" size={hp(3.2)} strokeWidth={2}/>
              </View>
              <Text style={styles.menuItemText}>Pending{'\n'}Requests</Text>
            </Pressable>

            <Pressable 
              style={styles.menuItem} 
              onPress={() => navigateTo('/ConnectionsMap')}
            >
              <View style={styles.iconContainer}>
                <Icon name="viewMap" size={hp(3.2)} strokeWidth={2}/>
              </View>
              <Text style={styles.menuItemText}>View on{'\n'}Map</Text>
            </Pressable>
          </View>
          
          {/* Added Image Component */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/images/c-home img2.png')} 
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: hp(2),
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: wp(3),
    paddingTop: hp(3),
    paddingBottom: hp(4),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    width: '48%',
    aspectRatio: 1,
    padding: hp(2),
    borderRadius: 16,
    marginBottom: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    backgroundColor: '#303030',
    borderRadius: hp(3),
    width: hp(6),
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  menuItemText: {
    color: colors.white,
    fontSize: hp(1.8),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: hp(2.2),
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: hp(40),
  }
})