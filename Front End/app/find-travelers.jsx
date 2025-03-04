import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TravelerCard from '../components/TravelerCard';
import BackButton from '../components/BackButton'; 
import { getNearbyTravelers } from './services/travelersAPI';
import colors from '../constants/colors';
import typography from '../constants/typography';

export default function FindTravelersScreen() {
  const [travelers, setTravelers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchTravelers = async () => {
      try {
        setIsLoading(true);
        const data = await getNearbyTravelers();
        setTravelers(data);
      } catch (error) {
        console.error('Error fetching travelers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTravelers();
  }, []);

  const handleConnect = (travelerId) => {
    const traveler = travelers.find(t => t.id === travelerId);
    if (!traveler) return;

    setNotificationMessage(`Request sent`);
    setShowNotification(true);

    setTravelers(prevTravelers => prevTravelers.filter(t => t.id !== travelerId));

    setTimeout(() => {
      setShowNotification(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      
      <View style={styles.backButtonContainer}>
        <BackButton router={router} />
      </View>

      <Header title="Nearby Travelers" subtitle="Connect with travelers exploring Sri Lanka" />

      <View style={styles.content}>
        

        {isLoading ? (
          <Text style={styles.loadingText}>Loading travelers...</Text>
        ) : travelers.length === 0 ? (
          <Text style={styles.noTravelersText}>There are no travelers at the moment</Text>
        ) : (
          <FlatList
            data={travelers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TravelerCard traveler={item} onConnect={handleConnect} />
            )}
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
      position: "absolute",
      top: 42, 
      left: 5,
      zIndex: 10,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    sectionTitle: {
      ...typography.heading,
      marginBottom: 20,
      textAlign: 'center',
      color: colors.white,
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
    