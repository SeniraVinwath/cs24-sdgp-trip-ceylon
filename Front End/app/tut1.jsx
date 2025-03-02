import { StyleSheet, Text, View, Image, Pressable, Animated, Platform, Easing, Dimensions } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import { theme } from '../constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';

const Tut1 = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  
  const [currentPage, setCurrentPage] = useState(0);
  
  const tutorialData = [
    {
      image: require('../assets/images/TOTORIAL 1 PLAN YOUR TRIP.png'),
      title: "Effortlessly Generate\nYour Perfect Itinerary",
      text: "Design your dream trip in seconds! Trip\nCeylon's AI-powered tool creates\npersonalized itineraries tailored to your\npreferences and needs!"
    },
    {
      image: require('../assets/images/TOTORIAL 2 TRACK YOUR LUGGAGES 2.png'),
      title: "Track Your Luggage,\nTravel Stress Free",
      text: "Travel worry free with Trip Ceylon! Our\nluggage tracking feature ensures your\nbelongings are secure giving you\npeace of mind."
    },
    {
      image: require('../assets/images/TOTORIAL 3 TRAVELER CONNECTIONS 3.png'),
      title: "Forge Bonds,\nShare Adventures!",
      text: "Connect with fellow travelers who share\nyour language or interests, creating\nmeaningful friendships and unforgettable\njourneys around Sri Lanka!"
    }
  ];
  
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

  const animateContentChange = (nextPage) => {
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
      if (nextPage === 3) {
        router.push('tut4');
        return;
      }
      
      setCurrentPage(nextPage);
      
      textFadeAnim.setValue(0);
      textSlideAnim.setValue(-screenWidth * 0.3);
      imageFadeAnim.setValue(0);
      imageSlideAnim.setValue(screenWidth * 0.3);
      
      runEntryAnimation();
    });
  };

  const handleNextPress = () => {
    if (currentPage === 2) {
      animateContentChange(3);
      return;
    }
    
    animateContentChange(currentPage + 1);
  };

  const handleNavDotPress = (pageIndex) => {
    if (pageIndex === 3) {
      router.push('tut4');
      return;
    }
    
    if (pageIndex !== currentPage) {
      animateContentChange(pageIndex);
    }
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
            source={tutorialData[currentPage].image}
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
            {tutorialData[currentPage].title}
          </Text>
          <Text style={styles.paragraph}>
            {tutorialData[currentPage].text}
          </Text>
        </Animated.View>

        <View style={styles.navContainer}>
          {[0, 1, 2, 3].map((index) => (
            <Pressable
              key={index}
              style={[
                styles.navDot, 
                currentPage === index && styles.activeNavDot,
                currentPage === index && { transform: [{ scale: dotScale._value }] }
              ]}
              onPress={() => handleNavDotPress(index)}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.buttonStyle}
            onPress={handleNextPress}
          >
            <Text style={styles.buttonText}>Next</Text>
            <Icon 
              name="arrow-forward" 
              size={20} 
              color="white" 
              style={styles.icon} 
            />
          </Pressable>

          <Pressable 
            onPress={() => router.push('tut4')}
            style={styles.skipTutContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipTut}>Skip Tutorial</Text>
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
    borderRadius: theme.radius.lg,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    width: Platform.select({
      ios: '50%',
      android: '55%',
    }),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: Math.min(hp(2), 18),
    fontWeight: '600',
    marginRight: wp(2),
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  icon: {
    marginLeft: wp(1),
  },
  skipTutContainer: {
    padding: 10,
    marginTop: hp(1.5),
  },
  skipTut: {
    color: theme.colors.linkGreen,
    fontSize: Math.min(hp(2), 18),
    textDecorationLine: 'underline',
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default Tut1;