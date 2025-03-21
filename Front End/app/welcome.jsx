import { StyleSheet, Text, View, Image, Pressable, Animated, Platform } from 'react-native';
import React, { useRef, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import { theme } from '../constants/theme';
import Button from '../components/Button';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Welcome = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlideAnim = useRef(new Animated.Value(wp(20))).current;
  const imageScaleAnim = useRef(new Animated.Value(0.95)).current;
  
  const platformSpacing = { 
    paddingBottom: Platform.select({ 
      ios: Math.max(insets.bottom, hp(2)), 
      android: Math.max(insets.bottom, hp(2)), 
    }), 
  };
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(imageScaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <ScreenWrapper bg="#303030">
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Background overlay */}
        <Image
          source={require('../assets/images/lauch-gb-overlay.png')}
          style={styles.backgroundOverlay}
          resizeMode="cover"
        />
        
        {/* Content Container with safe area margins */}
        <View style={[styles.contentContainer, { paddingHorizontal: wp(4) }]}>
          {/* logo image */}
          <Animated.Image
            style={[
              styles.logoImage, 
              { 
                opacity: fadeAnim,
                transform: [{ translateX: logoSlideAnim }] 
              }
            ]}
            resizeMode="contain"
            source={require('../assets/images/LOGO/whiteLOGO.png')}
          />
          
          {/* welcome image */}
          <Animated.Image
            style={[
              styles.welcomeImage, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: imageScaleAnim }] 
              }
            ]}
            resizeMode="contain"
            source={require('../assets/images/trip_cey-welcome-img.png')}
          />
        </View>
        
        {/* footer */}
        <Animated.View 
          style={[
            styles.footer, 
            { opacity: fadeAnim },
            platformSpacing
          ]}
        >
          <Button
            title='GET STARTED'
            buttonStyle={[styles.getStartedButton, { backgroundColor: theme.colors.themeGreen }]}
            onPress={() => router.push('tut1')}
          />
          
          {/* Skip Tutorial link */}
          <Pressable 
            style={({ pressed }) => [
              styles.skipButtonContainer,
              pressed && styles.skipButtonPressed
            ]}
            onPress={() => router.push('tut4')}
            hitSlop={{ top: hp(1), bottom: hp(1), left: wp(2), right: wp(2) }}
          >
            <View style={styles.skipInnerContainer}>
              <Text style={[styles.skipTut, { color: theme.colors.lightThemeGreen }]}>
                Skip Tutorial
              </Text>
              <View style={[styles.skipUnderline, { backgroundColor: theme.colors.lightThemeGreen }]} />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#303030',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? hp(3) : hp(2),
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  logoImage: {
    height: hp(7),
    width: wp(55),
    marginTop: hp(2),
    marginBottom: hp(2),
    alignSelf: 'center',
  },
  welcomeImage: {
    height: hp(55),
    width: wp(90),
    marginTop: hp(2),
    alignSelf: 'center',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginTop: 'auto',
    marginBottom: hp(1.5),
  },
  getStartedButton: {
    width: '100%', 
    height: hp(7),
    borderRadius: theme.radius.xxxl,
    marginBottom: hp(3),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: theme.radius.ss,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  skipButtonContainer: {
    padding: hp(1.5),
    alignItems: 'center',
    width: '100%',
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipInnerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  skipTut: {
    fontSize: hp(2),
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
    color: theme.colors.lightThemeGreen,
  },
  skipUnderline: {
    height: 1,
    width: wp(25),
    marginTop: hp(0.1),
  },
});