import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors.js';
import typography from '../constants/typography.js';

const TravelerCard = ({ traveler, onConnect }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Profile Details */}
        <View style={styles.profileContainer}>
          <View style={styles.profileIconContainer}>
            <Ionicons name="person-circle" size={50} color={colors.white} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{traveler.name}</Text>
            <Text style={styles.country}>From {traveler.country}</Text>
          </View>
        </View>

        {/* Connect Button on Right Side */}
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => onConnect && onConnect(traveler.id)}
        >
          <Text style={styles.connectButtonText}>Connect</Text>
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
    flexDirection: 'row', // Aligning elements in a row
    alignItems: 'center',
    justifyContent: 'space-between', // Pushing button to the right
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allowing the profile container to take available space
  },
  profileIconContainer: {
    marginRight: 15,
  },
  info: {
    flex: 1, // making sure text takes up available space
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
  connectButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TravelerCard;
