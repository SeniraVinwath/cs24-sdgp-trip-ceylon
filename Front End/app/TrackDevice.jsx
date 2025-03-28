import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Alert, ActivityIndicator, Platform } from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import { wp, hp } from '../helpers/common';
import Head from "../components/Head";
import { useRoute } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import { PermissionsAndroid } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import baseApiUrl from "../constants/baseApiUrl";

const TrackDevice = () => {
  const insets = useSafeAreaInsets();
  const horizontalPadding = wp(5);
  const route = useRoute();
  const luggage = route.params;
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  // Platform-specific bottom spacing
  const platformSpacing = { 
    paddingBottom: Platform.select({ 
      ios: Math.max(insets.bottom, hp(2)), 
      android: Math.max(insets.bottom, hp(2)), 
    }),
  };

  const checkLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        
        if (!granted) {
          const permissionResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'We need your location to show your luggage on the map.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (permissionResult !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Location permission is required to view the map.');
          }
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    }
  };

  useEffect(() => {
    checkLocationPermission();
    fetchData(); // Initial data fetch
    const interval = setInterval(fetchData, 5 * 60000); // setInterval for 5 minutes

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const fetchData = async () => {
    setLoading(true);
    console.log("tl: ", JSON.stringify(luggage));

    if (!luggage.account || !luggage.imei || !luggage.password) {
      Alert.alert("Track", "Account, IMEI, and password are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${baseApiUrl}/api/data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: luggage.account,
          imei: luggage.imei,
          password: luggage.password,
        }),
      });
      const data = await response.json();
      console.log("luggage tracker data: ", data);

      if (data && data.trackingData) {
        setTrackingData(data.trackingData);
        setSuccess(true);
      } else {
        setSuccess(false);
        Alert.alert('Track', 'No location data available for this luggage.');
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setSuccess(false);
      console.error("Error:", error);
      Alert.alert('Track', 'An error occurred. Please try again.');
    }
  };

  return (
    <ScreenWrapper bg="#303030">
      <View style={[
        styles.container, 
        { paddingHorizontal: horizontalPadding },
        platformSpacing
      ]}>
        <Head title="Luggage Details" />
        
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator 
                size={Platform.OS === 'ios' ? 'large' : hp(4)} 
                color="#FFFFFF" 
              />
              <Text style={styles.loadingText}>Locating your luggage...</Text>
            </View>
          ) : (
            <>
              {trackingData && trackingData.latitude && trackingData.longitude ? (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: trackingData.latitude,
                    longitude: trackingData.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: trackingData.latitude,
                      longitude: trackingData.longitude,
                    }}
                    title="Luggage Location"
                    description={`Last updated: ${new Date().toLocaleTimeString()}`}
                  />
                </MapView>
              ) : (
                <View style={styles.noMapContainer}>
                  <Text style={styles.noMapText}>Map data unavailable</Text>
                </View>
              )}
              
              {/* Status overlay on top of map */}
              {success && (
                <View style={styles.statusOverlay}>
                  <View style={styles.statusCard}>
                    <Text style={styles.successText}>Luggage located!</Text>
                    {trackingData && trackingData.battery && (
                      <View style={styles.batteryContainer}>
                        <Text style={styles.batteryLabel}>Battery:</Text>
                        <Text style={[
                          styles.batteryValue, 
                          trackingData.battery > 50 ? styles.batteryHigh : 
                          trackingData.battery > 20 ? styles.batteryMedium : 
                          styles.batteryLow
                        ]}>
                          {trackingData.battery}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303030",
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: hp(1.5),
    overflow: 'hidden',
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#424242',
    padding: wp(4),
  },
  loadingText: {
    color: "#E0E0E0",
    fontSize: hp(2),
    marginTop: hp(2),
    textAlign: 'center',
  },
  noMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#424242',
    padding: wp(4),
  },
  noMapText: {
    color: "#E0E0E0",
    fontSize: hp(2),
    textAlign: 'center',
  },
  statusOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp(2) : hp(2.5),
    left: wp(3),
    zIndex: 1000,
    width: wp(45),
  },
  statusCard: {
    backgroundColor: 'rgba(66, 66, 66, 0.85)',
    borderRadius: hp(1),
    padding: wp(3),
    shadowColor: "#000",
    shadowOffset: { 
      width: 0, 
      height: Platform.OS === 'ios' ? hp(0.2) : hp(0.5) 
    },
    shadowOpacity: 0.25,
    shadowRadius: Platform.OS === 'ios' ? hp(0.5) : hp(0.6),
    elevation: 5,
  },
  successText: {
    color: "#4CAF50",
    fontSize: hp(1.8),
    fontWeight: Platform.OS === 'ios' ? "600" : "bold",
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
    flexWrap: 'wrap',
  },
  batteryLabel: {
    color: "#E0E0E0",
    fontSize: hp(1.7),
    marginRight: wp(1),
  },
  batteryValue: {
    fontSize: hp(1.7),
    fontWeight: Platform.OS === 'ios' ? "600" : "bold",
  },
  batteryHigh: {
    color: "#4CAF50",
  },
  batteryMedium: {
    color: "#FFC107",
  },
  batteryLow: {
    color: "#F44336",
  },
});

export default TrackDevice;