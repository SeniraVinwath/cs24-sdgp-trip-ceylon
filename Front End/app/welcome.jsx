import { StyleSheet, Text, View, Image, Pressable, Animated, Platform } from 'react-native';
import React, { useRef, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import { theme } from '../constants/theme';
import Button from '../components/Button';
import { useRouter } from 'expo-router';

const Welcome = () => {
  const router = useRouter();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlideAnim = useRef(new Animated.Value(wp(20))).current;
  const imageScaleAnim = useRef(new Animated.Value(0.95)).current;
  
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
          source={require('../assets/images/LANDING IMAGE.png')}
        />
        
        {/* title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>
            Your Journey, Your Way..!
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.themeGreen }]}>
            Discover Sri Lanka with Ease
          </Text>
        </Animated.View>
        
        {/* footer */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
    paddingHorizontal: wp(4),
    paddingTop: Platform.OS === 'ios' ? hp(1) : 0,
  },
  
  logoImage: {
    height: hp(10),
    width: wp(70),
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  
  welcomeImage: {
    height: hp(45),
    width: wp(90),
    marginBottom: hp(2),
  },
  
  title: {
    color: 'white',
    textAlign: 'center',
    fontSize: hp(3),
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
    marginBottom: hp(1),
    includeFontPadding: false,
  },
  
  subtitle: {
    textAlign: 'center',
    fontSize: hp(2.4),
    fontWeight: Platform.OS === 'ios' ? '500' : '500',
    marginBottom: hp(4),
    includeFontPadding: false,
  },
  
  footer: {
    width: wp(90),
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? hp(8) : hp(6),
  },
  
  getStartedButton: {
    width: wp(90),
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
    borderRadius: theme.radius.xs,
  },
  
  skipButtonPressed: {
    opacity: 0.7,
  },
  
  skipInnerContainer: {
    alignItems: 'center',
  },
  
  skipTut: {
    fontSize: hp(2),
    fontWeight: Platform.OS === 'ios' ? '500' : '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  
  skipUnderline: {
    width: wp(20),
    height: 1.5,
    marginTop: 4,
    borderRadius: 1,
  },
});