import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import colors from '../constants/colors';

export default function ConnectionsMap() {
  const [connectedLocations, setConnectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConnectedTravelerLocations = async () => {
      if (!user?.id) return;

      try {
        const { data: locations, error } = await supabase
          .rpc('get_connected_locations', { current_user_id: user.id });

        if (error) {
          console.error('Error fetching connected traveler locations:', error.message);
          return;
        }

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const uniqueTravelers = [...new Map(
    connectedLocations.map(t => [t.user_id, t])
  ).values()];

  return (
    <MapView style={styles.map} initialRegion={defaultRegion}>
  {uniqueTravelers.map((traveler) => {
    const shortName = traveler.full_name.split(' ')[0]; // getting the first name of the user

    return (
      <React.Fragment key={`${traveler.user_id}-${traveler.latitude}`}>
        {/* Label that showing above the pin */}
        <Marker
          coordinate={{
            latitude: traveler.latitude + 0.0004, // had to add a offset to upwards
            longitude: traveler.longitude,
          }}
          anchor={{ x: 0.5, y: 1 }}
          
        >
          <View style={styles.labelAbovePin}>
            <Text style={styles.labelText}>{shortName}</Text>
          </View>
        </Marker>

        {/* real red color pin */}
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

  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
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
    textAlign: 'left'
  },
  
});
