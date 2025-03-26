import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import BackButton from '../components/BackButton.jsx';
import { supabase } from '../lib/supabase.js';
import colors from '../constants/colors.js';
import typography from '../constants/typography.js';

export default function MyConnectionsScreen({ userId }) {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        setIsLoading(true);
        
        // Get the logged-in user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
  
        if (userError || !user) throw new Error("User not found");
  
        // Fetch connections where the user is involved
        const { data, error } = await supabase
          .from('connections')
          .select('*')
          .or(`connected_user_id.eq.${user.id},user_id.eq.${user.id}`);  // Fix filtering
  
        if (error) throw error;
  
        if (!data || data.length === 0) {
          console.log("No connections found.");
          setConnections([]);
        } else {
          // Fetch traveler details for each connection
          const connectionsWithUsers = await Promise.all(
            data.map(async (connection) => {
              const otherUserId = connection.connected_user_id === user.id ? connection.user_id : connection.connected_user_id;
  
              const { data: traveler, error: travelerError } = await supabase
                .from('travelers')
                .select('id, user_name')
                .eq('id', otherUserId)
                .single();
  
              if (travelerError || !traveler) {
                console.error("User fetch error:", travelerError);
                return { ...connection, travelers: { user_name: "Unknown User" } };
              }
  
              return { ...connection, travelers: traveler };
            })
          );
  
          setConnections(connectionsWithUsers);
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchConnections();
  }, []);

  // Remove a connection
  const handleRemoveConnection = async (connectionId) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      setConnections((prevConnections) => prevConnections.filter((c) => c.id !== connectionId));
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  // View a traveler's profile
  const handleViewProfile = (requesterId) => {
    router.push({
      pathname: '/ViewProfile',
      params: {requesterId},
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      <View style={styles.backButtonContainer}>
        <BackButton router={router} />
      </View>

      <Header title="My Connections" subtitle="Your accepted traveler connections" />

      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : connections.length > 0 ? (
          <FlatList
            data={connections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.connectionCard}>
                <Text style={styles.travelerName}>{item.travelers?.user_name || 'Unknown User'}</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.viewButton}
                  onPress={() => handleViewProfile(item.connected_user_id)}>
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveConnection(item.id)}
                    style={styles.trashButton}
                  >
                    <Ionicons name="trash-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.list}
          />
        ) : (
          <Text style={styles.noConnectionsText}>You don't have any connections yet</Text>
        )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  list: {
    paddingBottom: 20,
  },
  connectionCard: {
    backgroundColor: '#222222',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  travelerName: {
    ...typography.cardTitle,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  viewButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  trashButton: {
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: 20,
  },
  noConnectionsText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
