import { StyleSheet, Text, View, Image, ScrollView, Animated, Platform, BackHandler } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import { theme } from '../constants/theme';
import Button from '../components/Button';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

const DisplayScreen = ({ title }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { content } = route.params || { message: "No Travel Plan Found!" };
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(hp(20))).current;
  const scrollRef = useRef(null);
  
  const platformSpacing = { 
    paddingBottom: Platform.select({ 
      ios: Math.max(insets.bottom, hp(2)), 
      android: Math.max(insets.bottom, hp(2)), 
    }), 
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.push('/home');
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [router])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const itineraryData = typeof content === 'string' ? JSON.parse(content) : content;
  const tripData = itineraryData.data;

  return (
    <ScreenWrapper bg="#303030">
      <StatusBar style="light" />
      <View style={styles.container}>
        <Image
          source={require('../assets/images/lauch-gb-overlay.png')}
          style={styles.backgroundOverlay}
          resizeMode="cover"
        />
        
        <View style={[styles.contentContainer, { paddingHorizontal: wp(4) }]}>
          <Animated.Image
            style={[
              styles.logoImage, 
              { opacity: fadeAnim }
            ]}
            resizeMode="contain"
            source={require('../assets/images/LOGO/whiteLOGO.png')}
          />
          
          <Animated.View 
            style={[
              styles.textContentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <Text style={styles.titleText}>{tripData?.title || title}</Text>
            <ScrollView 
              ref={scrollRef}
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              scrollIndicatorInsets={{ right: 1 }}
              indicatorStyle="white"
            >
              {tripData?.trip_summary && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Trip Summary</Text>
                  <Text style={styles.contentText}>
                    Duration: {tripData.trip_summary.trip_duration} days
                    {'\n'}Pace: {tripData.trip_summary.pace}
                    {'\n'}Travelers: {tripData.trip_summary.num_travelers}
                    {'\n'}Budget per Person: ${tripData.trip_summary.budget_estimate_per_person}
                    {'\n'}Total Budget: ${tripData.trip_summary.total_group_budget}
                    {'\n'}Locations: {tripData.trip_summary.total_locations}
                  </Text>
                </View>
              )}

              {tripData?.daily_itineraries && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Daily Itinerary</Text>
                  {tripData.daily_itineraries.map((day, index) => (
                    <View key={index} style={styles.dayContainer}>
                      <Text style={styles.dayTitle}>Day {day.day}</Text>
                      <Text style={styles.contentText}>{day.description}</Text>
                      {day.locations.map((location, locIndex) => (
                        <View key={locIndex} style={styles.locationContainer}>
                          <Text style={styles.locationName}>{location.name}</Text>
                          <Text style={styles.contentText}>
                            Types: {location.types}
                            {'\n'}Rating: {location.rating}
                            {'\n'}Distance to Next: {location.distance_to_next}
                          </Text>
                        </View>
                      ))}
                      <Text style={styles.contentText}>
                        Total Travel Distance: {day.total_travel_distance}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {tripData?.budget_breakdown && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Budget Breakdown</Text>
                  <Text style={styles.contentText}>
                    Transportation: ${tripData.budget_breakdown.transportation}
                    {'\n'}Accommodation: ${tripData.budget_breakdown.accommodation}
                    {'\n'}Food: ${tripData.budget_breakdown.food}
                    {'\n'}Activities: ${tripData.budget_breakdown.activities}
                    {'\n'}Total per Person: ${tripData.budget_breakdown.total_per_person}
                    {'\n'}Total for Group: ${tripData.budget_breakdown.total_for_group}
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
        
        <Animated.View 
          style={[
            styles.footer, 
            { opacity: fadeAnim },
            platformSpacing
          ]}
        >
          <Button
            title='BACK TO HOME'
            buttonStyle={[styles.backButton]}
            textStyle={styles.backButtonText}
            onPress={() => router.push('/home')}
          />
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default DisplayScreen;

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
    marginBottom: hp(3),
    alignSelf: 'center',
  },
  textContentContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: theme.radius.xl,
    padding: wp(5),
    marginBottom: hp(2),
  },
  titleText: {
    fontSize: hp(3),
    fontWeight: '600',
    color: 'white',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingRight: wp(4), 
  },
  section: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2.5),
    fontWeight: '500',
    color: theme.colors.lightThemeGreen,
    marginBottom: hp(1),
  },
  dayContainer: {
    marginBottom: hp(2),
  },
  dayTitle: {
    fontSize: hp(2.3),
    fontWeight: '500',
    color: 'white',
    marginBottom: hp(0.5),
  },
  locationContainer: {
    marginLeft: wp(4),
    marginTop: hp(1),
  },
  locationName: {
    fontSize: hp(2.2),
    fontWeight: '400',
    color: 'white',
    marginBottom: hp(0.5),
  },
  contentText: {
    fontSize: hp(2),
    lineHeight: hp(2.8),
    color: 'white',
    textAlign: 'left',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: wp(5),
    marginTop: 'auto',
    marginBottom: hp(1.5),
  },
  backButton: {
    width: '100%',
    height: hp(7),
    borderRadius: theme.radius.xxxl,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.lightThemeGreen,
  },
  backButtonText: {
    color: theme.colors.lightThemeGreen,
    fontWeight: '500',
  },
  scrollBar: {
    width: wp(1.5),
    backgroundColor: theme.colors.lightThemeGreen,
    borderRadius: theme.radius.sm,
    opacity: 0.8,
  },
});