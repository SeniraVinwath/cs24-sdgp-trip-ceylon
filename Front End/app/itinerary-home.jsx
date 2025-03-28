import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, Pressable, Modal, TouchableOpacity, Keyboard, Alert } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { useRouter } from 'expo-router';
import { wp, hp } from '../helpers/common';
import Input from '../components/Input';
import Button from '../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import Head from '../components/Head';
import { LOCATIONS } from '../constants/info'
import baseApiUrl from "../constants/baseApiUrl";
import axios from 'axios';

const BASE_API_URL = baseApiUrl;

const TRIP_PACES = [
  { id: 'fast', label: 'Fast-Paced', description: 'See and do as much as possible' },
  { id: 'balanced', label: 'Balanced', description: 'Mix of activities and downtime' },
  { id: 'relaxing', label: 'Relaxing', description: 'Slower pace with more free time' },
];

const PREFERENCE_CATEGORIES = [
  { id: 'beach', label: 'Beach', icon: 'beach' },
  { id: 'surfing', label: 'Surfing', icon: 'surf' },
  { id: 'city', label: 'City', icon: 'city' },
  { id: 'historical', label: 'Historical', icon: 'history' },
  { id: 'cultural', label: 'Cultural', icon: 'culture' },
  { id: 'hillcountry', label: 'Hill Country', icon: 'hill' },
  { id: 'wildlife', label: 'Wildlife', icon: 'safari' },
  { id: 'adventure', label: 'Adventure', icon: 'adventure' },
];

// Constant for total preference points
const TOTAL_POINTS = 100;

const ItineraryForm = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const platformSpacing = {
    paddingBottom: Platform.select({
      ios: Math.max(insets.bottom, hp(4)),
      android: Math.max(insets.bottom, hp(4)),
    }),
  };

  // Form state
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 7)));
  const [displayStartDate, setDisplayStartDate] = useState('');
  const [displayEndDate, setDisplayEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Initialize preference state
  const [preferences, setPreferences] = useState(
    PREFERENCE_CATEGORIES.reduce((acc, category) => {
      acc[category.id] = 0; // Set initial value to 0 for all preferences
      return acc;
    }, {})
  );
  const [selectedPace, setSelectedPace] = useState('');
  const [showPaceModal, setShowPaceModal] = useState(false);
  const [mandatoryLocations, setMandatoryLocations] = useState([]);
  const [excludedLocations, setExcludedLocations] = useState([]);
  const [showMandatoryLocationModal, setShowMandatoryLocationModal] = useState(false);
  const [showExcludedLocationModal, setShowExcludedLocationModal] = useState(false);
  const [numTravelers, setNumTravelers] = useState('2');
  const [loading, setLoading] = useState(false);

  // Format dates on initial render
  useEffect(() => {
    setDisplayStartDate(startDate.toLocaleDateString());
    setDisplayEndDate(endDate.toLocaleDateString());
  }, []);

  // Calculate remaining preference points
  const [lockedSliders, setLockedSliders] = useState({});
  const [activeSlider, setActiveSlider] = useState(null);
  const timerRefs = useRef({});
  const totalPreferencePoints = Object.values(preferences).reduce((sum, value) => sum + value, 0);
  const remainingPoints = TOTAL_POINTS - totalPreferencePoints;

  // Handle start date selection
  const handleStartDateSelect = (event, date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    
    if (date) {
      setStartDate(date);
      setDisplayStartDate(date.toLocaleDateString());
      
      // If end date is before start date, adjust it
      if (endDate < date) {
        const newEndDate = new Date(date);
        newEndDate.setDate(date.getDate() + 1);
        setEndDate(newEndDate);
        setDisplayEndDate(newEndDate.toLocaleDateString());
      }
    }
  };

  // Handle end date selection
  const handleEndDateSelect = (event, date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    
    if (date) {
      // Ensure end date is not before start date
      if (date >= startDate) {
        setEndDate(date);
        setDisplayEndDate(date.toLocaleDateString());
      } else {
        Alert.alert('Invalid Date', 'End date cannot be before start date');
      }
    }
  };

  const handleSliderStart = (categoryId) => {
    setActiveSlider(categoryId);
    
    // Clear any existing lock timer for this slider
    if (timerRefs.current[categoryId]) {
      clearTimeout(timerRefs.current[categoryId]);
    }
  };

  const handleSliderComplete = (categoryId) => {
    setActiveSlider(null);
    
    // Only set lock timer if the slider has a value greater than 0
    if (preferences[categoryId] > 0) {
      // Clear any existing timer
      if (timerRefs.current[categoryId]) {
        clearTimeout(timerRefs.current[categoryId]);
      }
      
      // Set a new timer to lock this slider after 2 seconds
      timerRefs.current[categoryId] = setTimeout(() => {
        setLockedSliders(prev => ({
          ...prev,
          [categoryId]: true
        }));
      }, 2000);
    }
  };

  // Handler function for preference changes
  const handlePreferenceChange = (categoryId, newValue) => {
    // If the slider is locked, don't allow any changes
    if (lockedSliders[categoryId]) {
      return;
    }
    
    // Get the current value for this category
    const currentValue = preferences[categoryId];
    
    // Calculate how many points would be used by this change
    const pointChange = newValue - currentValue;
    
    // Check if there are enough remaining points for an increase
    if (pointChange > 0 && pointChange > remainingPoints) {
      // If not enough points, limit to max available
      const limitedValue = currentValue + remainingPoints;
      
      setPreferences(prevPreferences => ({
        ...prevPreferences,
        [categoryId]: limitedValue
      }));
    } else {
      // Otherwise, allow the change (both increases and decreases)
      setPreferences(prevPreferences => ({
        ...prevPreferences,
        [categoryId]: newValue
      }));
    }
  };
  
  const resetPreferences = () => {
    // Clear all timers
    Object.keys(timerRefs.current).forEach(key => {
      clearTimeout(timerRefs.current[key]);
    });
    
    // Reset all states
    setPreferences(
      PREFERENCE_CATEGORIES.reduce((acc, category) => {
        acc[category.id] = 0;
        return acc;
      }, {})
    );
    setLockedSliders({});
    timerRefs.current = {};
  };


  // Handle mandatory location selection
  const handleMandatoryLocationSelect = (locationId) => {
    setMandatoryLocations(prev => {
      // If already selected, remove it
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      }
      
      // If less than 2 locations selected, add it
      if (prev.length < 2) {
        // If this location is in excluded locations, remove it from there
        if (excludedLocations.includes(locationId)) {
          setExcludedLocations(current => 
            current.filter(id => id !== locationId)
          );
        }
        return [...prev, locationId];
      }
      
      // Otherwise, replace the first location
      // If the new location is in excluded locations, remove it from there
      if (excludedLocations.includes(locationId)) {
        setExcludedLocations(current => 
          current.filter(id => id !== locationId)
        );
      }
      return [prev[1], locationId];
    });
  };

  // Handle excluded location selection
  const handleExcludedLocationSelect = (locationId) => {
    setExcludedLocations(prev => {
      // If already selected, remove it
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      }
      
      // Don't allow adding a location that's already in mandatory locations
      if (mandatoryLocations.includes(locationId)) {
        return prev;
      }
      
      // If less than 5 locations selected, add it
      if (prev.length < 5) {
        return [...prev, locationId];
      }
      
      // Otherwise, replace the first location
      return [...prev.slice(1), locationId];
    });
  };

  // Open date pickers
  const openStartDatePicker = () => {
    Keyboard.dismiss();
    setShowStartDatePicker(true);
  };

  const openEndDatePicker = () => {
    Keyboard.dismiss();
    setShowEndDatePicker(true);
  };

  // Validate form
  const validateForm = () => {
    let isValid = true;
    const emptyFields = [];

    if (!displayStartDate) {
      emptyFields.push('start date');
      isValid = false;
    }
    
    if (!displayEndDate) {
      emptyFields.push('end date');
      isValid = false;
    }
    
    if (totalPreferencePoints !== TOTAL_POINTS) {
      Alert.alert('Preferences', `Total preference points must equal ${TOTAL_POINTS}. Current total: ${totalPreferencePoints}`);
      isValid = false;
    }
    
    if (!selectedPace) {
      emptyFields.push('trip pace');
      isValid = false;
    }
    
    if (!numTravelers || isNaN(parseInt(numTravelers)) || parseInt(numTravelers) < 1) {
      emptyFields.push('number of travelers');
      isValid = false;
    }
    
    if (emptyFields.length > 0) {
      Alert.alert('Missing Information', `Please fill in the following: ${emptyFields.join(', ')}`);
      return false;
    }
    
    return isValid;
  };

  // Submit form
  // const onSubmit = async () => {
  //   if (!validateForm()) return;

  //   setLoading(true);

  //   try {
  //     // Prepare data for API
  //     const formData = {
  //       start_date: startDate.toISOString().split('T')[0],
  //       end_date: endDate.toISOString().split('T')[0],
  //       preferences: preferences,
  //       pace: selectedPace,
  //       mandatory_locations: mandatoryLocations.map(id => 
  //         LOCATIONS.find(loc => loc.id === id).name
  //       ),
  //       excluded_locations: excludedLocations.map(id => 
  //         LOCATIONS.find(loc => loc.id === id).name
  //       ),
  //       num_travelers: parseInt(numTravelers)
  //     };

  //     console.log('Submitting form data:', formData);
      
  //     // TODO: Send data to backend
  //     // const response = await api.generateItinerary(formData);
      
  //     // Simulate API call
  //     await new Promise(resolve => setTimeout(resolve, 1500));
      
  //     setLoading(false);
      
  //     // Navigate to results screen or display result
  //     Alert.alert('Success', 'Your itinerary is being generated!');
      
  //     // router.push('/itinerary-results');
      
  //   } catch (error) {
  //     setLoading(false);
  //     Alert.alert('Error', error.message || 'Failed to generate itinerary');
  //   }
  // };

  const onSubmit = async () => {
    if (!validateForm()) return;
  
    setLoading(true);
  
    try {
      const params = {
        'start_date': startDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        'end_date': endDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        'preferences': {
          'Beach': preferences['beach'] || 0,
          'HillCountry': preferences['hillcountry'] || 0,
          'Adventure': preferences['adventure'] || 0,
          'Cultural': preferences['cultural'] || 0,
          'City': preferences['city'] || 0,
          'Surfing': preferences['surfing'] || 0,
          'Historical': preferences['historical'] || 0,
          'Wildlife': preferences['wildlife'] || 0
        },
        'pace': selectedPace.charAt(0).toUpperCase() + selectedPace.slice(1),
        'mandatory_locations': mandatoryLocations.length > 0 
          ? mandatoryLocations.map(id => 
              LOCATIONS.find(loc => loc.id === id).name
            ) 
          : [],
        'excluded_locations': excludedLocations.length > 0 
          ? excludedLocations.map(id => 
              LOCATIONS.find(loc => loc.id === id).name
            ) 
          : [],
        'num_travelers': parseInt(numTravelers)
      };
  
      console.log('Sending API request with params:', params);
  
      // Make POST API call
      const response = await axios.post(`${BASE_API_URL}/api/travelPlanGenerator`, params, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      setLoading(false);
      
      // Handle successful response
      if (response.data) {

        
        // Optionally navigate to results screen
        //console.log(JSON.stringify( response.data ))
        router.push({
          pathname: 'DisplayScreen',
          params: { content: JSON.stringify(response.data) }
        });
      }
  
    } catch (error) {
      setLoading(false);
      
      // Handle API error
      console.error('API Error:', error.response ? error.response.data : error.message);
      
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to generate itinerary. Please try again.'
      );
    }
  };
  

  // Render date pickers
  const renderStartDatePicker = () => {
    if (!showStartDatePicker) return null;
    
    return (
      <View>
        {Platform.OS === 'ios' ? (
          <View style={styles.iosDatePickerContainer}>
            <View style={styles.iosDatePickerHeader}>
              <TouchableOpacity 
                onPress={() => setShowStartDatePicker(false)}
                style={styles.iosDatePickerButton}
              >
                <Text style={styles.iosDatePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  setShowStartDatePicker(false);
                }}
                style={styles.iosDatePickerButton}
              >
                <Text style={[styles.iosDatePickerButtonText, {color: theme.colors.themebg}]}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <DateTimePicker
              value={startDate}
              mode="date"
              display="spinner"
              onChange={handleStartDateSelect}
              minimumDate={new Date()}
              style={styles.iosDatePicker}
            />
          </View>
        ) : (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartDateSelect}
            minimumDate={new Date()}
          />
        )}
      </View>
    );
  };

  const renderEndDatePicker = () => {
    if (!showEndDatePicker) return null;
    
    return (
      <View>
        {Platform.OS === 'ios' ? (
          <View style={styles.iosDatePickerContainer}>
            <View style={styles.iosDatePickerHeader}>
              <TouchableOpacity 
                onPress={() => setShowEndDatePicker(false)}
                style={styles.iosDatePickerButton}
              >
                <Text style={styles.iosDatePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  setShowEndDatePicker(false);
                }}
                style={styles.iosDatePickerButton}
              >
                <Text style={[styles.iosDatePickerButtonText, {color: theme.colors.themebg}]}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <DateTimePicker
              value={endDate}
              mode="date"
              display="spinner"
              onChange={handleEndDateSelect}
              minimumDate={startDate}
              style={styles.iosDatePicker}
            />
          </View>
        ) : (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={handleEndDateSelect}
            minimumDate={startDate}
          />
        )}
      </View>
    );
  };

  // Modal components
  const PaceModal = () => {
    return (
      <Modal
        visible={showPaceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaceModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPaceModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Trip Pace</Text>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {TRIP_PACES.map(pace => (
                <TouchableOpacity
                  key={pace.id}
                  style={[
                    styles.paceOption,
                    selectedPace === pace.id && styles.selectedPaceOption
                  ]}
                  onPress={() => {
                    setSelectedPace(pace.id);
                    setShowPaceModal(false);
                  }}
                >
                  <View style={styles.paceHeader}>
                    <Text style={[
                      styles.paceOptionText,
                      selectedPace === pace.id && styles.selectedPaceOptionText
                    ]}>
                      {pace.label}
                    </Text>
                    {selectedPace === pace.id && (
                      <Icon name="lock" size={wp(5)} color={theme.colors.themebg} />
                    )}
                  </View>
                  <Text style={styles.paceDescription}>{pace.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const LocationModal = ({ 
    visible, 
    onClose, 
    title, 
    selectedLocations, 
    onSelectLocation, 
    maxSelections,
    selectionType,
    conflictingLocations // This is a new prop to receive locations that should be hidden
  }) => {
    // Filter locations based on conflicting locations
    const filteredLocations = LOCATIONS.filter(location => 
      !conflictingLocations.includes(location.id)
    );
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={[styles.modalContent, styles.locationModalContent]}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalSubtitle}>
              {selectionType === 'mandatory' 
                ? 'Select up to 2 locations you must visit' 
                : 'Select up to 5 locations you want to avoid'}
            </Text>
            
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {filteredLocations.map(location => (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.locationOption,
                    selectedLocations.includes(location.id) && styles.selectedLocationOption
                  ]}
                  onPress={() => onSelectLocation(location.id)}
                >
                  <Text style={[
                    styles.locationOptionText,
                    selectedLocations.includes(location.id) && styles.selectedLocationOptionText
                  ]}>
                    {location.name}
                  </Text>
                  
                  {selectedLocations.includes(location.id) && (
                    <Icon name="lock" size={wp(5)} color={theme.colors.themebg} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseButtonText}>
                Done ({selectedLocations.length}/{maxSelections})
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <ScreenWrapper>
      
      <View style={styles.container}>
      <Head title="Create Itinerary" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formContainer}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Date Selection */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>When is your trip?</Text>
              
              <View style={styles.dateInputContainer}>
                <Pressable 
                  style={styles.dateInput}
                  onPress={openStartDatePicker}
                >
                  <Text style={styles.dateInputLabel}>Start Date</Text>
                  <View style={styles.dateInputValue}>
                    <Text style={styles.dateValueText}>
                      {displayStartDate || 'Select date'}
                    </Text>
                    <Icon name="calendar" size={wp(5)} color={theme.colors.textWhite} />
                  </View>
                </Pressable>
                
                <Pressable 
                  style={styles.dateInput}
                  onPress={openEndDatePicker}
                >
                  <Text style={styles.dateInputLabel}>End Date</Text>
                  <View style={styles.dateInputValue}>
                    <Text style={styles.dateValueText}>
                      {displayEndDate || 'Select date'}
                    </Text>
                    <Icon name="calendar" size={wp(5)} color={theme.colors.textWhite} />
                  </View>
                </Pressable>
              </View>
            </View>
            
            {/* Preferences Section */}
            <View style={styles.formSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Your Preferences</Text>
                <Text style={styles.pointsRemaining}>
                  {remainingPoints} points remaining
                </Text>
              </View>
              
              {PREFERENCE_CATEGORIES.map(category => {
                // Calculate the maximum value this slider can be set to
                // It's the current value plus any remaining points
                const maxValue = preferences[category.id] + remainingPoints;
                
                // Determine if slider should be disabled
                const isLocked = lockedSliders[category.id];
                const isZeroAndNoPoints = preferences[category.id] === 0 && remainingPoints === 0;
                const isDisabled = isLocked || isZeroAndNoPoints;
                
                // Determine countdown status for currently adjusted slider
                const isActiveSlider = activeSlider === category.id && preferences[category.id] > 0;
                
                return (
                  <View key={category.id} style={styles.preferenceItem}>
                    <View style={styles.preferenceHeader}>
                      <View style={styles.preferenceIconContainer}>
                        <Icon 
                          name={category.icon}
                          size={wp(5)} 
                          color={theme.colors.textWhite}
                        />
                      </View>
                      <Text style={styles.preferenceLabel}>{category.label}</Text>
                      <Text style={styles.preferenceValue}>{preferences[category.id]}</Text>
                      <Text style={[
                        styles.maxPointsIndicator, 
                        { 
                          color: isLocked ? theme.colors.roseLight : 
                                isZeroAndNoPoints ? theme.colors.textDark2 : 
                                isActiveSlider ? theme.colors.forgotpasswordlink :
                                theme.colors.textWhite 
                        }
                      ]}>
                        {isLocked ? '(locked)' : 
                        isZeroAndNoPoints ? '(unavailable)' : 
                        isActiveSlider ? '(locking in 2s)' :
                        preferences[category.id] > 0 ? '(adjustable)' : ''}
                      </Text>
                    </View>
                    
                    <Slider
                      style={[
                        styles.slider,
                        isDisabled && styles.disabledSlider,
                        isLocked && styles.lockedSlider
                      ]}
                      minimumValue={0}
                      maximumValue={maxValue} 
                      step={1}
                      value={preferences[category.id]}
                      onValueChange={(value) => handlePreferenceChange(category.id, value)}
                      onSlidingStart={() => handleSliderStart(category.id)}
                      onSlidingComplete={() => handleSliderComplete(category.id)}
                      minimumTrackTintColor={isLocked ? theme.colors.textWhite : 
                                            isZeroAndNoPoints ? theme.colors.textDark2 : 
                                            theme.colors.textWhite}
                      maximumTrackTintColor={theme.colors.textDark2}
                      thumbTintColor={isLocked ? theme.colors.linkGreen : 
                                      isZeroAndNoPoints ? theme.colors.textDark2 : 
                                      theme.colors.textWhite}
                      disabled={isDisabled}
                    />
                  </View>
                );
              })}

              {/* Reset button to allow users to start over */}
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetPreferences}
              >
                <Text style={styles.resetButtonText}>Reset All Preferences</Text>
              </TouchableOpacity>
            </View>

            
            {/* Trip Pace Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Trip Pace</Text>
              
              <Pressable 
                style={styles.selectInput}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowPaceModal(true);
                }}
              >
                <Text style={styles.selectInputLabel}>
                  {selectedPace 
                    ? TRIP_PACES.find(pace => pace.id === selectedPace).label
                    : 'Select trip pace'
                  }
                </Text>
                <Icon name="lock" size={wp(5)} color={theme.colors.text} />
              </Pressable>
            </View>
            
            {/* Locations Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Location Preferences</Text>
              
              {/* Mandatory Locations */}
              <View style={styles.locationPreference}>
                <Text style={styles.locationPreferenceLabel}>Must-Visit Locations (Optional)</Text>
                
                <Pressable 
                  style={styles.selectInput}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowMandatoryLocationModal(true);
                  }}
                >
                  <Text style={styles.selectInputLabel}>
                    {mandatoryLocations.length > 0 
                      ? `${mandatoryLocations.length} location${mandatoryLocations.length > 1 ? 's' : ''} selected`
                      : 'Select locations (max 2)'
                    }
                  </Text>
                  <Icon name="lock" size={wp(5)} color={theme.colors.text} />
                </Pressable>
              </View>
              
              {/* Excluded Locations */}
              <View style={styles.locationPreference}>
                <Text style={styles.locationPreferenceLabel}>Locations to Avoid (Optional)</Text>
                
                <Pressable 
                  style={styles.selectInput}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowExcludedLocationModal(true);
                  }}
                >
                  <Text style={styles.selectInputLabel}>
                    {excludedLocations.length > 0 
                      ? `${excludedLocations.length} location${excludedLocations.length > 1 ? 's' : ''} selected`
                      : 'Select locations (max 5)'
                    }
                  </Text>
                  <Icon name="lock" size={wp(5)} color={theme.colors.text} />
                </Pressable>
              </View>
            </View>
            
            {/* Number of Travelers */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Number of Travelers</Text>
              
              <Input
                value={numTravelers}
                onChangeText={setNumTravelers}
                placeholder="Enter number of travelers"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            
            <View style={styles.buttonSpacing} />
          </ScrollView>
          
          {/* Submit Button */}
          <View style={[styles.submitButtonContainer, platformSpacing]}>
            <Button
              title="Generate Itinerary"
              onPress={onSubmit}
              loading={loading}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
      
      {/* Modals */}
      <PaceModal />
      
      <LocationModal
        visible={showMandatoryLocationModal}
        onClose={() => setShowMandatoryLocationModal(false)}
        title="Must-Visit Locations"
        selectedLocations={mandatoryLocations}
        onSelectLocation={handleMandatoryLocationSelect}
        maxSelections={2}
        selectionType="mandatory"
        conflictingLocations={excludedLocations}
      />
      
      <LocationModal
        visible={showExcludedLocationModal}
        onClose={() => setShowExcludedLocationModal(false)}
        title="Locations to Avoid"
        selectedLocations={excludedLocations}
        onSelectLocation={handleExcludedLocationSelect}
        maxSelections={5}
        selectionType="excluded"
        conflictingLocations={mandatoryLocations}
      />
      
      {renderStartDatePicker()}
      {renderEndDatePicker()}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.themebg,
    paddingHorizontal: wp(2)
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(2.5),
    paddingBottom: hp(5),
  },
  formSection: {
    marginTop: hp(2.5),
    marginBottom: hp(3),
    backgroundColor: '#404040',
    padding: wp(5),
    borderRadius: theme.radius.sm,
  },
  sectionTitle: {
    fontSize: wp(4),
    fontWeight: '600',
    color: theme.colors.textWhite,
    marginBottom: hp(1),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  pointsRemaining: {
      fontSize: wp(3),
      fontWeight: '500',
      color: theme.colors.textDark2,
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: wp(2),
    padding: wp(3),
    borderWidth: 1,
    borderColor: theme.colors.textDark2,
  },
  dateInputLabel: {
    fontSize: wp(3.2),
    color: theme.colors.textWhite,
    opacity: 0.8,
    marginBottom: hp(0.5),
  },
  dateInputValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateValueText: {
    fontSize: wp(3.6),
    color: theme.colors.textWhite,
    fontWeight: '500',
  },
  preferenceItem: {
    marginBottom: hp(2),
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  preferenceIconContainer: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  preferenceLabel: {
    fontSize: wp(3.6),
    fontWeight: '500',
    color: theme.colors.textWhite,
    flex: 1,
  },
  preferenceValue: {
    fontSize: wp(3.6),
    fontWeight: '600',
    color: theme.colors.textDark,
    width: wp(8),
    textAlign: 'right',
  },
  maxPointsIndicator: {
    fontSize: wp(3),
    marginLeft: wp(2),
    width: wp(20),
  },
  slider: {
    width: '100%',
    height: hp(4),
    alignSelf: 'center',
    marginHorizontal: 0,
  },
  sliderThumb: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
  },
  selectInput: {
    backgroundColor: theme.colors.textWhite,
    borderRadius: wp(2),
    padding: wp(4),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectInputLabel: {
    fontSize: wp(3.6),
    color: theme.colors.text,
  },
  locationPreference: {
    marginBottom: hp(2),
  },
  locationPreferenceLabel: {
    fontSize: wp(3.5),
    fontWeight: '500',
    color: theme.colors.textDark2,
    marginBottom: hp(0.8),
  },
  buttonSpacing: {
    height: hp(0.2),
  },
  submitButtonContainer: {
    paddingHorizontal: wp(5),
    backgroundColor: theme.colors.background,
    paddingTop: hp(2),
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: wp(3),
    padding: wp(4),
    maxHeight: '80%',
  },
  locationModalContent: {
    paddingBottom: wp(2),
  },
  modalTitle: {
    fontSize: wp(4.5),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: hp(1),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: wp(3.5),
    color: theme.colors.textLight,
    marginBottom: hp(2),
    textAlign: 'center',
  },
  modalScrollContent: {
    paddingBottom: hp(2),
  },
  paceOption: {
    padding: wp(4),
    borderRadius: wp(2),
    marginBottom: hp(1.5),
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedPaceOption: {
    borderColor: theme.colors.themebg,
    backgroundColor: `${theme.colors.textDark2}`,
  },
  paceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  paceOptionText: {
    fontSize: wp(4),
    fontWeight: '500',
    color: theme.colors.text,
  },
  selectedPaceOptionText: {
    color: theme.colors.themebg,
    fontWeight: '600',
  },
  paceDescription: {
    fontSize: wp(3.2),
    color: theme.colors.textLight,
  },
  locationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(3),
    borderRadius: wp(2),
    marginBottom: hp(1),
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedLocationOption: {
    borderColor: theme.colors.themebg,
    backgroundColor: `${theme.colors.textDark2}10`,
  },
  locationOptionText: {
    fontSize: wp(3.8),
    color: theme.colors.text,
  },
  selectedLocationOptionText: {
    color: theme.colors.themebg,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: theme.colors.buttonGreen,
    padding: wp(3),
    borderRadius: wp(2),
    alignItems: 'center',
    marginTop: hp(1),
  },
  modalCloseButtonText: {
    color: theme.colors.white,
    fontSize: wp(3.8),
    fontWeight: '600',
  },
  iosDatePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.themeGreen,
    zIndex: 1000,
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
    overflow: 'hidden',
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.linkGreen,
  },
  iosDatePickerButton: {
    paddingHorizontal: wp(2),
  },
  iosDatePickerButtonText: {
    fontSize: wp(4),
    fontWeight: '500',
    color: theme.colors.textWhite,
  },
  iosDatePicker: {
    height: hp(25),
  },
  disabledSlider: {
    opacity: 0.5,
  },
  resetButton: {
    backgroundColor: "#F44336",
    padding: wp(2),
    borderRadius: wp(2),
    alignItems: 'center',
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  resetButtonText: {
    color: theme.colors.textWhite,
    fontSize: wp(3.5),
    fontWeight: '500',
  },
  lockedSlider: {
    opacity: 0.8,
  }
});

export default ItineraryForm;