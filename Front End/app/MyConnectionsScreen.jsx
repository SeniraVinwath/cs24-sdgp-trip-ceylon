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
        
        // Fetch all connections (without user-specific filtering)
        const { data, error } = await supabase
          .from('connections')
          .select('*'); 
  
        if (error) throw error;
  
        if (!data || data.length === 0) {
          console.log("No connections found.");
          setConnections([]);
        } else {
          // Fetch connected user details
          const connectionsWithUsers = await Promise.all(
            data.map(async (connection) => {
              const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, name')
                .eq('id', connection.connected_user_id)
                .single();
  
              if (userError) {
                console.error("User fetch error:", userError);
                return { ...connection, user: null };
              }
              return { ...connection, user };
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
                <Text style={styles.travelerName}>{item.user?.name || 'Unknown User'}</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.viewButton}>
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
