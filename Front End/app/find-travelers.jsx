import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, StatusBar, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TravelerCard from '../components/TravelerCard';
import BackButton from '../components/BackButton';
import {getNearbyTravelers,sendConnectionRequest,getSentRequests,} from '../services/travelersAPI';
import colors from '../constants/colors';
import typography from '../constants/typography';

export default function FindTravelersScreen() {
  const [travelers, setTravelers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Map());
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission denied');
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setUserLocation({ latitude, longitude });

        if (!user || !user.id) {
          console.error('Missing user ID');
          setIsLoading(false);
          return;
        }

        const nearby = await getNearbyTravelers({ latitude, longitude }, user.id);
        if (nearby && nearby.length > 0) setTravelers(nearby);

        const requests = await getSentRequests(user.id);
        const map = new Map();
        requests.forEach(({ requested_id, status }) => {
          map.set(requested_id, status);
        });
        setSentRequests(map);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleConnect = async (traveler) => {
    if (!user || !user.id) {
      console.error('Not logged in');
      return;
    }

    try {
      const result = await sendConnectionRequest(user.id, traveler.user_id);
      if (result.success) {
        setSentRequests((prev) => new Map(prev).set(traveler.user_id, 'pending'));
        setNotificationMessage(`Request sent to ${traveler.full_name}`);
        setShowNotification(true);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      console.error('Connection request error:', err);
      Alert.alert('Network Error', 'Failed to send request.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <View style={styles.backButtonContainer}>
        <BackButton router={router} />
      </View>

      <Header
        title="Nearby Travelers"
        subtitle="Connect with travelers exploring Sri Lanka"
      />

      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading travelers...</Text>
        ) : travelers.length === 0 ? (
          <Text style={styles.noTravelersText}>
            There are no travelers at the moment
          </Text>
        ) : (
          <FlatList
            data={travelers}
            keyExtractor={(item) => item.user_id || item.id}
            renderItem={({ item }) => {
              const id = item.user_id || item.id;
              const requestStatus = sentRequests.get(id);
              console.log('Traveler:', item.full_name, '| Image:', item.image);
              return (
                <TravelerCard
                  traveler={item}
                  onConnect={handleConnect}
                  requestStatus={requestStatus}
                />
              );
            }}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      {showNotification && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>{notificationMessage}</Text>
        </View>
      )}

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
    position: 'absolute',
    top: 42,
    left: 5,
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  list: {
    paddingBottom: 20,
  },
  loadingText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: 20,
  },
  noTravelersText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  notification: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    color: colors.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
