import { StyleSheet, Text, View, Image, Pressable, Animated, Platform, Easing, Dimensions } from 'react-native';
import React, { useEffect, useRef } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import { theme } from '../constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';

const Tut4 = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(-screenWidth * 0.3)).current;
  const imageFadeAnim = useRef(new Animated.Value(0)).current;
  const imageSlideAnim = useRef(new Animated.Value(screenWidth * 0.3)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  const platformSpacing = {
    paddingBottom: Platform.select({
      ios: Math.max(insets.bottom, hp(2)),
      android: Math.max(insets.bottom, hp(2)),
    }),
  };

  const resetAnimations = useCallback(() => {
    textFadeAnim.setValue(0);
    textSlideAnim.setValue(-screenWidth * 0.3);
    imageFadeAnim.setValue(0);
    imageSlideAnim.setValue(screenWidth * 0.3);
    dotScale.setValue(1);
    
    runEntryAnimation();
    runPulseAnimation();
  }, [textFadeAnim, textSlideAnim, imageFadeAnim, imageSlideAnim, dotScale]);

  const runEntryAnimation = () => {
    Animated.parallel([
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(textSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(imageFadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(imageSlideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start();
  };

  const runPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotScale, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(dotScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  };

  useEffect(() => {
    runEntryAnimation();
    runPulseAnimation();
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetAnimations();
      
      return () => {
        dotScale.stopAnimation();
        textFadeAnim.stopAnimation();
        textSlideAnim.stopAnimation();
        imageFadeAnim.stopAnimation();
        imageSlideAnim.stopAnimation();
      };
    }, [resetAnimations, dotScale, textFadeAnim, textSlideAnim, imageFadeAnim, imageSlideAnim])
  );

  const handleRegisterNow = () => {
    Animated.parallel([
      Animated.timing(textFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(textSlideAnim, {
        toValue: screenWidth * 0.3,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(imageFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(imageSlideAnim, {
        toValue: -screenWidth * 0.3,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start(() => {
      router.push('signUp');
    });
  };

  const imageHeight = Math.min(screenHeight * 0.35, hp(40));

  return (
    <ScreenWrapper bg="#303030">
      <StatusBar style="light" />
      <View style={[styles.container, platformSpacing]}>
        <Animated.View style={[
          styles.imageContainer, 
          {
            opacity: imageFadeAnim,
            transform: [{ translateX: imageSlideAnim }],
            height: imageHeight
          }
        ]}>
          <Image
            style={styles.welcomeImage}
            resizeMode="contain"
            source={require('../assets/images/TOTORIAL 4 SOCIAL MEDIA 4.png')}
          />
        </Animated.View>

        <Animated.View style={[
          styles.textContainer,
          {
            opacity: textFadeAnim,
            transform: [{ translateX: textSlideAnim }],
          }
        ]}>
          <Text style={styles.title}>
            Connect, Explore,{'\n'}Share Your Journey!
          </Text>
          <Text style={styles.paragraph}>
            Trip Ceylon is the ultimate social media{'\n'}platform for travelers! Sign up today and{'\n'}
            unlock the best of Sri Lanka! Its your journey,{'\n'}in your way with Trip Ceylon!
          </Text>
        </Animated.View>

        <View style={styles.navContainer}>
            {[1, 2, 3].map((num) => (
                <Pressable key={num} style={styles.navDot} onPress={() => router.push(`tut1`)} />
            ))}
            <Animated.View style={[
                styles.navDot,
                styles.activeNavDot,
                { transform: [{ scale: dotScale }] }
            ]} />
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.buttonStyle}
            onPress={handleRegisterNow}
          >
            <Text style={styles.buttonText}>REGISTER NOW</Text>
          </Pressable>

          <Pressable 
            onPress={() => router.push('login')}
            style={styles.loginContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.loginText}>Use Existing Account</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.themebg,
    paddingHorizontal: wp(3),
    paddingTop: hp(2),
  },
  imageContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    width: '100%',
    alignItems: 'flex-start',
    paddingHorizontal: wp(5),
  },
  title: {
    color: 'white',
    fontSize: Math.min(hp(3.6), 28),
    fontWeight: '800',
    marginBottom: hp(2),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  paragraph: {
    color: 'white',
    fontSize: Math.min(hp(1.8), 16),
    fontWeight: '500',
    lineHeight: Platform.select({
      ios: Math.min(hp(2.5), 22),
      android: Math.min(hp(2.8), 24),
    }),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: hp(2),
  },
  navDot: {
    width: Math.min(wp(3), 12),
    height: Math.min(wp(3), 12),
    borderRadius: Math.min(wp(1.5), 6),
    backgroundColor: 'gray',
    marginHorizontal: wp(1.5),
  },
  activeNavDot: {
    backgroundColor: theme.colors.buttonGreen,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  buttonStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.buttonGreen,
    borderRadius: theme.radius.xxxl,
    paddingVertical: hp(2),
    paddingHorizontal: wp(5),
    width: Platform.select({
      ios: '65%',
      android: '70%',
    }),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4.5,
  },
  buttonText: {
    color: 'white',
    fontSize: Math.min(hp(5), 20),
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  loginContainer: {
    padding: 10,
    marginTop: hp(1.5),
  },
  loginText: {
    color: theme.colors.linkGreen,
    fontSize: Math.min(hp(2), 18),
    textDecorationLine: 'underline',
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default Tut4;