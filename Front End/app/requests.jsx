import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Footer from '../components/Footer.jsx';
import { supabase } from '../lib/supabase.js';
import colors from '../constants/colors.js';
import typography from '../constants/typography.js';
import { Image } from 'react-native'; 
import Head from '../components/Head';
import ScreenWrapper from '../components/ScreenWrapper';
import { hp, wp } from '../helpers/common.js';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
  
        // Get current user ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
  
        if (userError || !user) throw new Error("User not found");
  
        // Fetch pending connection requests
        const { data, error } = await supabase
          .from('connection_requests')
          .select(`
            id,
            requester_id,
            requested_id,
            created_at,
            travelers:requester_id (id, user_name, image)
          `)
          .eq('requested_id', user.id)
          .eq('status', 'pending');
  
        if (error) throw error;
  
        // Convert filenames to full public URLs
        const processedRequests = data.map((req) => {
          if (req.travelers?.image) {
            req.travelers.image = supabase.storage
              .from('trip_cey_traveler_uploads') 
              .getPublicUrl(req.travelers.image).publicUrl;
          }
          return req;
        });
        
        setRequests(processedRequests);
  
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      // Fetch the full request details
      const { data: request, error: requestError } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) throw new Error('Request not found');

      // Create bidirectional connection
      const { error: connectionError } = await supabase
        .from('connections')
        .insert([
          { user_id: request.requested_id, connected_user_id: request.requester_id },
        ]);

      if (connectionError) throw connectionError;

      // Update request status
      const { error: updateError } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Remove from UI
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  // Decline a request
  const handleDecline = async (requestId) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  // View a traveler's profile
  const handleViewProfile = (requesterId) => {
    router.push({
      pathname: '/ViewProfile',
      params: {requesterId },
    });
  };

  return (
    <ScreenWrapper bg={colors.secondary} statusBarStyle="light-content">
      <View style={styles.container}>
        <Head title="Friend Requests" />
        <View style={[styles.content, { paddingHorizontal: wp(4) }]}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : requests.length === 0 ? (
            <Text style={styles.noRequestsText}>No pending requests</Text>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.requestCard}>
                  <View style={styles.profileContainer}>
                    <Image
                      source={item.travelers?.image
                        ? { uri: item.travelers.image }
                        : require('../assets/images/defaultUserIMG.jpg')}
                      style={styles.profileImage}
                      onError={(e) => console.log("Image failed to load:", e.nativeEvent.error)}
                    />
                    <Text style={styles.requesterName}>
                      {item.travelers?.user_name || 'Unknown User'} wants to connect!
                    </Text>
                  </View>
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewProfile(item.requester_id)}
                    >
                      <Text style={styles.buttonText}>View Profile</Text>
                    </TouchableOpacity>
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
              contentContainerStyle={[
                styles.list, 
                platformSpacing,
                { paddingHorizontal: wp(2) }
              ]}
            />
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
    paddingHorizontal: hp(2)
  },
  content: {
    flex: 1,
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  list: {
    paddingBottom: hp(4),
  },
  requestCard: {
    backgroundColor: '#222222',
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(2),
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: hp(1.5),
    width: '100%',
  },
  profileImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: wp(7.5),
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: hp(1),
  },
  requesterName: {
    ...typography.cardTitle,
    color: colors.white,
    fontSize: wp(4.5),
    fontWeight: 'bold',
    marginBottom: hp(1.5),
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: Platform.OS === 'ios' ? 'nowrap' : 'wrap',
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: wp(6),
    marginRight: wp(1.5),
    minWidth: wp(25),
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.buttonGreen,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: wp(6),
    marginRight: wp(1.5),
    minWidth: wp(22),
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: 'red',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: wp(6),
    minWidth: wp(22),
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: wp(3.8),
    textAlign: 'center',
  },
  noRequestsText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: hp(5),
    fontSize: wp(4),
  },
  loadingText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: hp(2.5),
    fontSize: wp(4),
  },
})