import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Footer from '../components/Footer.jsx';
import { supabase } from '../lib/supabase.js';
import colors from '../constants/colors.js';
import typography from '../constants/typography.js';
import Head from '../components/Head';
import { hp, wp } from '../helpers/common';
import ScreenWrapper from '../components/ScreenWrapper';

export default function MyConnectionsScreen({ userId }) {
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProfileId, setLoadingProfileId] = useState(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
          .or(`connected_user_id.eq.${user.id},user_id.eq.${user.id}`);
  
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

  // View a traveler's profile with loading state
  const handleViewProfile = async (connection) => {
    try {
      // Set loading state for this specific connection
      setLoadingProfileId(connection.id);
      
      // Get the logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) throw new Error("User not found");
      
      // Determine which ID is the other user's ID
      const otherUserId = connection.connected_user_id === user.id 
        ? connection.user_id 
        : connection.connected_user_id;
        
      router.push({
        pathname: '/ViewProfile',
        params: {requesterId: otherUserId},
      });
    } catch (error) {
      console.error('Error determining profile to view:', error);
    } finally {
      // Clear loading state
      setLoadingProfileId(null);
    }
  };

  const platformSpacing = { 
    paddingBottom: Platform.select({ 
      ios: Math.max(insets.bottom, hp(2)), 
      android: Math.max(insets.bottom, hp(2)), 
    }), 
  };

  return (
    <ScreenWrapper bg={colors.secondary}>
      <View style={styles.container}>
        <Head title="Your Connections" />
        <View style={[styles.content, { paddingHorizontal: wp(4) }]}>
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
                    <TouchableOpacity 
                      style={[styles.viewButton, loadingProfileId === item.id && styles.viewButtonLoading]}
                      onPress={() => handleViewProfile(item)}
                      disabled={loadingProfileId === item.id}
                    >
                      {loadingProfileId === item.id ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Text style={styles.viewButtonText}>View</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveConnection(item.id)}
                      style={styles.trashButton}
                      disabled={loadingProfileId === item.id}
                    >
                      <Ionicons name="trash-outline" size={wp(5)} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={[styles.list, platformSpacing]}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.noConnectionsText}>You don't have any connections yet</Text>
            </View>
          )}
        </View>

        <Footer />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingHorizontal: wp(2),
  },
  content: {
    flex: 1,
    paddingVertical: hp(3),
  },
  list: {
    paddingBottom: hp(2),
  },
  connectionCard: {
    backgroundColor: '#222222',
    borderRadius: wp(2.5),
    padding: wp(4),
    marginBottom: hp(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  travelerName: {
    ...typography.cardTitle,
    color: colors.white,
    fontSize: wp(4.5),
    fontWeight: 'bold',
    flex: 1,
    marginRight: wp(2),
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3.5),
    borderRadius: wp(5),
    marginRight: wp(2),
    minWidth: wp(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonLoading: {
    opacity: 0.8,
  },
  viewButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: wp(4),
  },
  trashButton: {
    backgroundColor: 'red',
    padding: wp(2),
    borderRadius: wp(5),
    width: wp(10),
    height: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: hp(2.5),
    fontSize: wp(4),
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConnectionsText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: wp(4),
    paddingHorizontal: wp(4),
  },
});