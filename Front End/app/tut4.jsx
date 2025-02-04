import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import React from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import { theme } from '../constants/theme';
import Button from '../components/Button';
import { useRouter } from 'expo-router';

const Tut4 = () => {
  const router = useRouter();

  return (
    <ScreenWrapper bg="#303030">
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Tutorial Image */}
        <Image
          style={styles.welcomeImage}
          resizeMode="contain"
          source={require('../assets/images/TOTORIAL 4 SOCIAL MEDIA 4.png')}
        />

        {/* Title and Paragraph */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Connect, Explore,{'\n'}Share Your Journey!
          </Text>
          <Text style={styles.paragraph}>
            Trip Ceylon is the ultimate social media{'\n'}platform for travelers! Sign up today and{'\n'}
            unlock the best of Sri Lanka! Its your journey,{'\n'}in your way with Trip Ceylon!
          </Text>
        </View>

        {/* Navigation Shapes */}
        <View style={styles.navContainer}>
          <Pressable
            style={styles.navDot}
            onPress={() => router.push('tut1')}
          />
          <Pressable
            style={styles.navDot}
            onPress={() => router.push('tut2')}
          />
          <Pressable
            style={styles.navDot}
            onPress={() => router.push('tut3')}
          />
          <Pressable
            style={[styles.navDot, styles.activeNavDot]}
            onPress={() => router.push('tut4')}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.buttonStyle]}
            onPress={() => router.push('')}
          >
            <Text style={styles.buttonText}>Register Now</Text>
          </Pressable>
          <Pressable onPress={() => router.push('tut4')}>
            <Text style={styles.login}>Use an existing Account</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Tut4;

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
    marginLeft: 0,
  },

  navContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3.5), // Moved up slightly
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
    width: '70%', // Wider
    marginTop: -hp(5), // Moved up
  },

  login: {
    textAlign: 'center',
    color: theme.colors.linkGreen,
    marginTop: hp(1),
    fontSize: hp(2),
    textDecorationLine: 'underline',
    fontWeight: theme.fonts.semibold,
  },

  buttonStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.buttonGreen,
    borderRadius: 8, // More rounded
    paddingVertical: hp(1.5), // Increased height
    paddingHorizontal: wp(5),
  },

  buttonText: {
    color: 'white',
    fontSize: hp(2.5), // Larger text
    fontWeight: theme.fonts.semibold,
    marginRight: wp(2),
  },
});
