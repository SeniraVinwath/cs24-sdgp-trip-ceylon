import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabaseUrl } from '../constants/index';
import colors from '../constants/colors';
import typography from '../constants/typography';

const TravelerCard = ({ traveler, onConnect, requestStatus }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleConnect = async () => {
    if (!onConnect || !traveler.user_id) return;
    setIsRequesting(true);
    try {
      await onConnect(traveler);
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
    setIsRequesting(false);
  };

  // Adjusted path with correct Supabase bucket prefixes
  const imagePath = traveler.image?.startsWith('profiles/')
    ? `trip_cey_traveler_uploads/${traveler.image}`
    : `trip_cey_traveler_uploads/profiles/${traveler.image}`;

  const imageUrl = traveler.image
    ? `${supabaseUrl}/storage/v1/object/public/${imagePath}`
    : null;

  const disabled = requestStatus === 'pending' || requestStatus === 'accepted';
  const buttonText =
    requestStatus === 'accepted'
      ? 'Accepted'
      : requestStatus === 'pending'
      ? 'Requested'
      : 'Connect';

  console.log('traveler.image:', traveler.image);
  console.log('imageUrl:', imageUrl);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.profileContainer}>
          <View style={styles.profileIconContainer}>
            {!imageUrl || imageError ? (
              <Ionicons name="person-circle" size={50} color={colors.white} />
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.avatar}
                onError={() => setImageError(true)}
              />
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{traveler.full_name || 'Unknown Traveler'}</Text>
            <Text style={styles.country}>
              {traveler.distance_km
                ? `${traveler.distance_km.toFixed(2)} km away`
                : 'Distance: N/A'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.connectButton,
            requestStatus === 'pending'
              ? styles.requestedButton
              : requestStatus === 'accepted'
              ? styles.acceptedButton
              : {},
          ]}
          onPress={handleConnect}
          disabled={disabled || isRequesting}
        >
          {isRequesting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.connectButtonText}>{buttonText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1616',
    borderRadius: 10,
    padding: 15,
    marginBottom: 35,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileIconContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.gray,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.cardTitle,
    fontSize: 18,
    fontWeight: 'bold',
  },
  country: {
    ...typography.cardSubtitle,
    marginTop: 5,
  },
  connectButton: {
    backgroundColor: colors.buttonGreen,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 35,
    alignItems: 'center',
  },
  requestedButton: {
    backgroundColor: colors.gray,
  },
  acceptedButton: {
    backgroundColor: 'green',
  },
  connectButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TravelerCard;
