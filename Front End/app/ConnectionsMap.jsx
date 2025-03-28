import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import colors from '../constants/colors';
import { useRouter } from 'expo-router';
import Head from '../components/Head';
import ScreenWrapper from '../components/ScreenWrapper';
import { hp, wp } from '../helpers/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUserImageSrc } from '../services/imageService';

export default function ConnectionsMap() {
  const [connectedLocations, setConnectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); 
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchConnectedTravelerLocations = async () => {
      if (!user?.id) return;

      try {
        // Calling Supabase function to fetch locations of connected users
        const { data: locations, error } = await supabase
          .rpc('get_connected_locations', { current_user_id: user.id });

        if (error) {
          console.error('Error fetching connected traveler locations:', error.message);
          return;
        }
        
        // Additional query to get traveler profiles with their images
        const { data: travelers, error: travelersError } = await supabase
          .from('travelers')
          .select('id, image')
          .in('id', locations.map(loc => loc.user_id));
          
        if (travelersError) {
          console.error('Error fetching travelers:', travelersError.message);
        }
        
        const travelerImageMap = {};
        if (travelers) {
          travelers.forEach(traveler => {
            travelerImageMap[traveler.id] = traveler.image;
          });
        }
        
        // Process the locations to ensure image field is correct
        const processedLocations = locations.map(location => {
          // Look up the image from our travelers query
          const travelerImage = travelerImageMap[location.user_id];
          
          return {
            ...location,
            // Use the traveler image we found
            image: travelerImage
          };
        });
        
        // Saving the list of connected users locations
        setConnectedLocations(processedLocations);
      } catch (err) {
        console.error('Unexpected error in map screen:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnectedTravelerLocations();
  }, [user]);

  const defaultRegion = {
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 4,
    longitudeDelta: 4,
  };

  // Show a loading spinner until data is fetched
  if (isLoading) {
    return (
      <ScreenWrapper bg={colors.secondary} statusBarStyle="light-content">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  //Filtering out duplicates(to prevent redundancy)
  const uniqueTravelers = [...new Map(
    connectedLocations.map(t => [t.user_id, t])
  ).values()];

  const platformSpacing = { 
    paddingBottom: Platform.select({ 
      ios: Math.max(insets.bottom, hp(2)), 
      android: Math.max(insets.bottom, hp(2)) 
    }) 
  };

  return (
    <ScreenWrapper bg="#303030" statusBarStyle="light-content">
      <View style={[styles.container, platformSpacing]}>
        {/* Added a custom backbutton in map to navigate to menu */}
        <Head title="Map View" />
        
        {/* showing all connected users with their profile images on Map */}
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            initialRegion={defaultRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {uniqueTravelers.map((traveler) => {
              // Get proper image source using getUserImageSrc
              const imageSource = getUserImageSrc(traveler.image);
              
              return (
                <Marker
                  key={`${traveler.user_id}-${traveler.latitude}-${traveler.longitude}`}
                  coordinate={{
                    latitude: traveler.latitude,
                    longitude: traveler.longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.markerContainer}>
                    <Image 
                      source={imageSource}
                      style={styles.profileImage}
                      defaultSource={require('../assets/images/defaultUserIMG.jpg')}
                      onError={(e) => {
                        console.error('Failed to load image for user:', traveler.user_id);
                      }}
                    />
                  </View>
                </Marker>
              );
            })}
          </MapView>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(2),
    backgroundColor: '#303030',
  },
  mapContainer: {
    flex: 1,
    borderRadius: hp(1),
    overflow: 'hidden',
    marginVertical: hp(1),
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: hp(4),
    height: hp(4),
    borderRadius: hp(2),
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: colors.primary,
  },
});