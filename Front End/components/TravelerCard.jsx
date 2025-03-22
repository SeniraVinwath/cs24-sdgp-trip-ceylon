import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import typography from '../constants/typography';

const TravelerCard = ({ traveler, onConnect, isRequestSent }) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleConnect = async () => {
    if (!onConnect || !traveler.user_id) return;

    setIsRequesting(true);
    try {
      await onConnect(traveler);
    } catch (error) {
      console.error("Error sending connection request:", error);
    }
    setIsRequesting(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Profile Details */}
        <View style={styles.profileContainer}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person-circle" size={50} color={colors.white} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>
              {traveler.full_name ? traveler.full_name : "Unknown Traveler"}
            </Text>
            <Text style={styles.country}>
              {traveler.distance_km
                ? `${traveler.distance_km.toFixed(2)} km away`
                : "Distance: N/A"}
            </Text>
          </View>
        </View>

        {/* Connect Button */}
        <TouchableOpacity
          style={[
            styles.connectButton,
            isRequestSent ? styles.connectedButton : {},
          ]}
          onPress={handleConnect}
          disabled={isRequesting || isRequestSent}
        >
          {isRequesting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.connectButtonText}>
              {isRequestSent ? "Requested" : "Connect"}
            </Text>
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
  connectedButton: {
    backgroundColor: colors.gray,
  },
  connectButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TravelerCard;
