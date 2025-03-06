import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackButton from '../components/BackButton';
import { getPendingRequests, acceptRequest, declineRequest } from './services/travelersAPI';
import colors from '../constants/colors.js';
import typography from '../constants/typography.js';

export default function RequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getPendingRequests();
        setRequests(data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    await acceptRequest(id);
    setRequests(requests.filter(req => req.id !== id));
    setModalVisible(false);
  };

  const handleDecline = async (id) => {
    await declineRequest(id);
    setRequests(requests.filter(req => req.id !== id));
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

     
      <View style={styles.backButtonContainer}>
        <BackButton router={router} />
      </View>

      <Header title="Pending Requests" subtitle="Manage connection requests" />

      <View style={styles.content}>
        {requests.length === 0 ? (
          <Text style={styles.noRequestsText}>No pending requests</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <Text style={styles.requesterName}>{item.name} wants to connect!</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.acceptButton} 
                    onPress={() => handleAccept(item.id)}
                  >
                    <Text style={styles.buttonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.declineButton} 
                    onPress={() => handleDecline(item.id)}
                  >
                    <Text style={styles.buttonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      <Footer />
    </View>
  );
}