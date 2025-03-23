import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import colors from '../constants/colors';
import { useRouter } from 'expo-router';
import Icon from '../assets/icons';

export default function ConnectionsMap() {
  const [connectedLocations, setConnectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth(); 
  const router = useRouter();

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
        // Saving the list of connected users locations
        setConnectedLocations(locations);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  //Filtering out duplicates(to prevent redundancy)
  const uniqueTravelers = [...new Map(
    connectedLocations.map(t => [t.user_id, t])
  ).values()];

  return (
    <View style={styles.container}>
      {/* Added a custom backbutton in map to navigate to menu */}
      <View style={styles.backButtonWrapper}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrowLeft" size={28} strokeWidth={2.5} color="black" />
        </Pressable>
      </View>

      {/* showing all connected users with their location pins on Map */}
      <MapView style={styles.map} initialRegion={defaultRegion}>
        {uniqueTravelers.map((traveler) => {
          const shortName = traveler.full_name.split(' ')[0];

          return (
            <React.Fragment key={`${traveler.user_id}-${traveler.latitude}`}>
              
              {/* Label which shows users name slightly above the redpin */}
              <Marker
                coordinate={{
                  latitude: traveler.latitude + 0.0004,
                  longitude: traveler.longitude,
                }}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.labelAbovePin}>
                  <Text style={styles.labelText}>{shortName}</Text>
                </View>
              </Marker>

              {/*Red pin on map*/}
              <Marker
                coordinate={{
                  latitude: traveler.latitude,
                  longitude: traveler.longitude,
                }}
              />
            </React.Fragment>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  backButtonWrapper: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.black,
  },
  labelAbovePin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    backgroundColor: 'white',
    paddingHorizontal: 0,
    paddingVertical: 2,
    borderRadius: 5,
    fontWeight: 'bold',
    fontSize: 6,
    color: colors.black,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    textAlign: 'left',
  },
});
