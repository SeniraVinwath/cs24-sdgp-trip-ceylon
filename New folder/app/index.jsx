import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const index = () => {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>DO NOT WORRY ABOUT YOUR LUGGAGE NOW</Text>
      <Text style={styles.subtitle}>Register to confirm the security of your Luggage!</Text>

      {/* Centered Image Gallery (Top to Bottom) */}
      <View style={styles.imageContainer}>
        <Image source={require('../assets/images/photo1.jpg')} style={styles.image} />
        <Image source={require('../assets/images/photo2.jpg')} style={styles.image} />
        <Image source={require('../assets/images/photo3.jpg')} style={styles.image} />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('LuggageTrackerLogin')}
      >
        <Text style={styles.buttonText}>Start Tracking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: -15,
  },
  image: {
    width: 250,
    height: 180,
    marginBottom: 15,
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#9DD900',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default index;
