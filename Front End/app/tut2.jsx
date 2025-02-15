import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import React from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import { theme } from '../constants/theme';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Tut2 = () => {
  const router = useRouter();

  return (
    <ScreenWrapper bg="#303030">
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Tutorial Image */}
        <Image
          style={styles.welcomeImage}
          resizeMode="contain"
          source={require('../assets/images/TOTORIAL 2 TRACK YOUR LUGGAGES 2.png')}
        />

        {/* Title and Paragraph */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Track Your Luggage,{'\n'}Travel Stress Free
          </Text>
          <Text style={styles.paragraph}>
            Travel worry free with Trip Ceylon! Our{'\n'}luggage tracking feature ensures your{'\n'}
            personalized itineraries tailored to your{'\n'}preferences and needs!
          </Text>
        </View>

        {/* Navigation Dots */}
        <View style={styles.navContainer}>
          <Pressable
            style={styles.navDot}
            onPress={() => router.push('tut1')}
          />
          <Pressable
            style={[styles.navDot, styles.activeNavDot]}
            onPress={() => router.push('tut2')}
          />
          <Pressable
            style={styles.navDot}
            onPress={() => router.push('tut3')}
          />
          <Pressable
            style={styles.navDot}
            onPress={() => router.push('tut4')}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.buttonStyle}
              onPress={() => router.push('tut3')}
            >
              <Text style={styles.buttonText}>Next</Text>
              <Icon name="arrow-forward" size={20} color="white" style={styles.icon} />
            </Pressable>
          </View>
          <Pressable onPress={() => router.push('tut4')}>
            <Text style={styles.skipTut}>Skip Tutorial</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Tut2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.themebg,
    paddingHorizontal: wp(3),
  },

  welcomeImage: {
    height: hp(40),
    alignSelf: 'center',
    marginTop: -hp(2),
  },

  textContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: wp(5),
    marginBottom: hp(10),
  },

  title: {
    color: 'white',
    textAlign: 'left',
    fontSize: hp(3.8),
    fontWeight: theme.fonts.extraBold,
    marginBottom: hp(2),
  },

  paragraph: {
    color: 'white',
    textAlign: 'left',
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    lineHeight: hp(2.5),
    marginTop: hp(2),
  },

  navContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(5),
  },

  navDot: {
    width: wp(3),
    height: wp(3),
    borderRadius: wp(1.5),
    backgroundColor: 'gray',
    marginHorizontal: wp(1.5),
  },

  activeNavDot: {
    backgroundColor: theme.colors.buttonGreen,
  },

  footer: {
    width: '60%',
    alignItems: 'center',
    marginBottom: hp(3),
  },

  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },

  buttonStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.buttonGreen,
    borderRadius: theme.radius.lg,
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    marginBottom: hp(1.5),
    width: '80%',
  },

  buttonText: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    marginRight: wp(2),
  },

  icon: {
    marginLeft: wp(1),
  },

  skipTut: {
    textAlign: 'center',
    color: theme.colors.linkGreen,
    marginTop: hp(1),
    fontSize: hp(2),
    textDecorationLine: 'underline',
    fontWeight: theme.fonts.semibold,
  },
});
