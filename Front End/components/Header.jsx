import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import colors from '../constants/colors.js';
import typography from '../constants/typography.js';

const Header = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.transparent} barStyle="light-content" />
      <View style={styles.safeArea} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  safeArea: {
    height: 40, // For status bar space
  },
  title: {
    ...typography.heading,
    color: colors.white,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subheading,
    color: colors.white,
    marginTop: 5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // Shadow color
    textShadowOffset: { width: 3, height: 3  }, // Adds depth (X, Y)
    textShadowRadius: 6, //Controls the blur intensity
  },
});

export default Header;
