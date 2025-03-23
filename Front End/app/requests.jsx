import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import BackButton from '../components/BackButton.jsx';
import { supabase } from '../lib/supabase.js';
import colors from '../constants/colors.js';
import typography from '../constants/typography.js';
import { Image } from 'react-native'; 

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

        //console.log("Final Profile Image URL:", item.travelers?.image);
       
        console.log("Raw Supabase Data:", data);
        console.log("Processed Requests:", processedRequests); 
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

  const handleViewProfile = (requesterId) => {
    router.push(`/profile/${requesterId}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <View style={styles.backButtonContainer}>
        <BackButton router={router} />
      </View>
      <Header title="Pending Requests" subtitle="Manage connection requests" />
      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : requests.length === 0 ? (
          <Text style={styles.noRequestsText}>No pending requests</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <View style={styles.profileContainer}>
                <Image
                  source={item.travelers?.image?
                    { uri: item.travelers.image}: 
                  require('../assets/images/defaultUserIMG.jpg')}
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
            contentContainerStyle={styles.list}
          />
        )}
      </View>
      <Footer />
    </View>
  );
}

// Keep the same StyleSheet as before


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
  requestCard: {
    backgroundColor: '#222222',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  requesterName: {
    ...typography.cardTitle,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 10,
  },
  acceptButton: {
    backgroundColor: colors.buttonGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 10,
  },
  declineButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  noRequestsText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  loadingText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: 20,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30, // Circular image
    borderWidth: 2,
    borderColor: 'white',
    marginBottom: 5,
  },
});