import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Footer from '../components/Footer';
import TravelerCard from '../components/TravelerCard';
import Head from '../components/Head';
import {
  getNearbyTravelers,
  sendConnectionRequest,
  getSentRequests,
  getIncomingRequests,
  getAcceptedIncomingRequests
} from '../services/travelersAPI';
import colors from '../constants/colors';
import { hp, wp } from '../helpers/common';
import ScreenWrapper from '../components/ScreenWrapper';

export default function FindTravelersScreen() {
  const [travelers, setTravelers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tracking status of sent and received requests
  const [sentRequests, setSentRequests] = useState(new Map());
  const [incomingRequests, setIncomingRequests] = useState(new Set());
  const [acceptedIncoming, setAcceptedIncoming] = useState(new Set());

  // Pop-up message state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Platform-specific spacing to ensure consistent appearance
  const platformSpacing = { 
    paddingBottom: Platform.select({ 
      ios: Math.max(insets.bottom, hp(2)),
      android: Math.max(insets.bottom, hp(2)),
    }),
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Requesting for location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission denied');
          setIsLoading(false);
          return;
        }
        // Getting current location
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        if (!user?.id) {
          console.error('Missing user ID');
          setIsLoading(false);
          return;
        }
        // Getting list of nearby travelers and excluding the current user
        const nearby = await getNearbyTravelers({ latitude, longitude }, user.id);
        if (nearby?.length > 0) setTravelers(nearby);

        // Get connection requests **sent** by me
        const requests = await getSentRequests(user.id);
        const map = new Map();
        requests.forEach(({ requested_id, status }) => {
          map.set(requested_id, status);
        });
        setSentRequests(map);
        
        // Get **incoming** connection requests (pending)
        const incoming = await getIncomingRequests(user.id);
        const pendingIncoming = incoming
          .filter(req => req.status === 'pending')
          .map(req => req.requester_id);
        setIncomingRequests(new Set(pendingIncoming));

        // Get requests that were sent to me and I have accepted
        const acceptedFromOthers = await getAcceptedIncomingRequests(user.id);
        setAcceptedIncoming(new Set(acceptedFromOthers));

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handling new connection requests
  const handleConnect = async (traveler) => {
    if (!user?.id) return;

    try {
      const result = await sendConnectionRequest(user.id, traveler.user_id);
      if (result.success) {
        // Saving the new pending request
        setSentRequests(prev => new Map(prev).set(traveler.user_id, 'pending'));

        //Showing a success message to user saying that request has sent successfully
        setNotificationMessage(`Request sent to ${traveler.full_name}`);
        setShowNotification(true);

        setTimeout(()=>{
          setShowNotification(false);
        }, 1000);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      console.error('Connection request error:', err);
      Alert.alert('Network Error', 'Failed to send request.');
    }
  };

  return (
    <ScreenWrapper bg={colors.secondary}>
      <View style={styles.container}>
        <Head title="Nearby Travelers" />
        
        {/* showing the list of nearby travelers */}
        <View style={styles.content}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading travelers...</Text>
          ) : travelers.length === 0 ? (
            <Text style={styles.noTravelersText}>There are no travelers at the moment</Text>
          ) : (
            <FlatList
              data={travelers}
              keyExtractor={(item) => item.user_id || item.id}
              renderItem={({ item }) => {
                const id = item.user_id || item.id;
                const requestStatus = sentRequests.get(id);
                const isIncomingRequest = incomingRequests.has(id);
                const isConnected =
                  requestStatus === 'accepted' || acceptedIncoming.has(id);

                return (
                  <TravelerCard
                    traveler={item}
                    onConnect={handleConnect}
                    requestStatus={requestStatus}
                    isIncomingRequest={isIncomingRequest}
                    isConnected={isConnected}
                  />
                );
              }}
              contentContainerStyle={[styles.list, platformSpacing]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Temporary pop-up message after sending request */}
        {showNotification && (
          <View style={styles.notification}>
            <Text style={styles.notificationText}>{notificationMessage}</Text>
          </View>
        )}

        <Footer />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.secondary,
    paddingHorizontal: wp(4),  // More responsive horizontal padding using wp
  },
  backButtonContainer: {
    position: 'absolute', 
    top: hp(5), 
    left: wp(1.5), 
    zIndex: 10 
  },
  content: { 
    flex: 1, 
    paddingTop: hp(2),
    paddingHorizontal: wp(2),
  },
  list: { 
    paddingBottom: hp(2.5),  // More responsive bottom padding
  },
  loadingText: { 
    color: colors.white, 
    textAlign: 'center', 
    marginTop: hp(2.5),
    fontSize: wp(4),  // Responsive font size
  },
  noTravelersText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: hp(5),
    fontSize: wp(4),
  },
  notification: {
    position: 'absolute',
    bottom: hp(12),  // Responsive positioning
    left: wp(5),
    right: wp(5),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: hp(1.5),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationText: {
    color: colors.black,
    fontWeight: 'bold',
    fontSize: wp(4),  // Responsive font size
  },
});