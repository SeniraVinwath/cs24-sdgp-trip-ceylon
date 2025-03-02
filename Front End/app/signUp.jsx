import { StyleSheet, Text, View, Image, Alert, ScrollView, KeyboardAvoidingView, Platform, Pressable, Modal, TouchableOpacity, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
import { wp, hp } from '../helpers/common';
import Input from '../components/Input';
import Button from '../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import { parsePhoneNumber, getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { Picker } from '@react-native-picker/picker';
import Flag from 'react-native-flags';
import { LANGUAGES, COUNTRIES, getFormattedCountryCodes } from '../constants/info';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
};

const isValidFullName = (fullName) => {
  const nameParts = fullName.trim().split(/\s+/);
  return nameParts.length >= 2 && nameParts.length <= 4;
};

const isPasswordValid = (password) => {
  return password.length >= 8;
};

const Signup = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const platformSpacing = {
    paddingBottom: Platform.select({
      ios: Math.max(insets.bottom, hp(2)),
      android: Math.max(insets.bottom, hp(2)),
    }),
  };
  
  const [userName, setUserName] = useState('');
  const [userNameError, setUserNameError] = useState('');
  const [fullName, setFullName] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emergencyPhoneNumber, setEmergencyPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [emergencyCountryCode, setEmergencyCountryCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [countryList, setCountryList] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  
  useEffect(() => {
    const countries = getCountries();
    const formattedCountries = getFormattedCountryCodes(countries, getCountryCallingCode);
    setCountryList(formattedCountries);
    
    if (formattedCountries.length > 0) {
      setCountryCode(formattedCountries[0].value);
      setEmergencyCountryCode(formattedCountries[0].value);
    }
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [displayDate, setDisplayDate] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [isEmergencyPhoneValid, setIsEmergencyPhoneValid] = useState(true);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleUsernameChange = (value) => {
    setUserName(value);
    if (value && !isValidUsername(value)) {
      setUserNameError('Username can only contain letters, numbers, and underscores');
    } else {
      setUserNameError('');
    }
  };

  const handleFullNameChange = (value) => {
    setFullName(value);
    if (value && !isValidFullName(value)) {
      setFullNameError('Full name must contain 2-4 parts separated by spaces');
    } else {
      setFullNameError('');
    }
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (value && !isValidEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePhoneChange = (value) => {
    setPhoneNumber(value);
    try {
      const phoneNumberWithCode = countryCode + value;
      const parsedNumber = parsePhoneNumber(phoneNumberWithCode);
      setIsPhoneValid(parsedNumber.isValid());
    } catch (error) {
      setIsPhoneValid(false);
    }
  };

  const handleEmergencyPhoneChange = (value) => {
    setEmergencyPhoneNumber(value);
    try {
      const phoneNumberWithCode = emergencyCountryCode + value;
      const parsedNumber = parsePhoneNumber(phoneNumberWithCode);
      setIsEmergencyPhoneValid(parsedNumber.isValid());
    } catch (error) {
      setIsEmergencyPhoneValid(false);
    }
  };

  const handleDateSelect = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (date) {
      setSelectedDate(date);
      setDisplayDate(date.toLocaleDateString());
    }
  };

  const openDatePicker = () => {
    Keyboard.dismiss();
    setShowDatePicker(true);
  };

  const handleLanguageSelect = (value) => {
    setSelectedLanguage(value);
    setShowLanguageModal(false);
  };

  const handleCountrySelect = (value) => {
    setSelectedCountry(value);
    setShowCountryModal(false);
  };

  const checkIfEmailExists = async (email) => {
    try {
      const { data, error } = await supabase
        .from('travelers')
        .select('email')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error) {
        throw new Error('Failed to check email availability');
      }
      
      return data !== null;
    } catch (err) {
      throw err;
    }
  };

  const validateForm = async () => {
    let isValid = true;
    const emptyFields = [];
  
    // Check each field and collect empty ones
    if (!userName) {
      setUserNameError('Username is required');
      emptyFields.push('username');
      isValid = false;
    } else if (!isValidUsername(userName)) {
      setUserNameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    } else {
      setUserNameError('');
    }
  
    if (!fullName) {
      setFullNameError('Full name is required');
      emptyFields.push('full name');
      isValid = false;
    } else if (!isValidFullName(fullName)) {
      setFullNameError('Full name must contain 2-4 parts separated by spaces');
      isValid = false;
    } else {
      setFullNameError('');
    }
  
    if (!email) {
      setEmailError('Email is required');
      emptyFields.push('email');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      try {
        const emailExists = await checkIfEmailExists(email);
        if (emailExists) {
          setEmailError('This email is already registered');
          isValid = false;
        } else {
          setEmailError('');
        }
      } catch (error) {
        setEmailError('Unable to verify email availability');
        isValid = false;
      }
    }
  
    if (!password) {
      emptyFields.push('password');
      isValid = false;
    }
  
    if (!confirmPassword) {
      emptyFields.push('confirm password');
      isValid = false;
    } else if (password && confirmPassword && password !== confirmPassword) {
      Alert.alert('Signup', 'Passwords do not match!');
      isValid = false;
    }
  
    if (!displayDate) {
      emptyFields.push('date of birth');
      isValid = false;
    }
  
    if (!phoneNumber) {
      emptyFields.push('phone number');
      isValid = false;
    } else if (!isPhoneValid) {
      Alert.alert('Signup', 'Please enter a valid phone number!');
      isValid = false;
    }
  
    if (!emergencyPhoneNumber) {
      emptyFields.push('emergency contact number');
      isValid = false;
    } else if (!isEmergencyPhoneValid) {
      Alert.alert('Signup', 'Please enter a valid emergency contact number!');
      isValid = false;
    }
  
    if (!selectedLanguage) {
      emptyFields.push('language');
      isValid = false;
    }
  
    if (!selectedCountry) {
      emptyFields.push('country');
      isValid = false;
    }
  
    if (emptyFields.length > 1) {
      Alert.alert('Signup', 'Please fill all the details to continue!');
      return false;
    } else if (emptyFields.length === 1) {
      switch (emptyFields[0]) {
        case 'username':
          Alert.alert('Signup', 'Please enter a username!');
          break;
        case 'full name':
          Alert.alert('Signup', 'Please enter your full name!');
          break;
        case 'email':
          Alert.alert('Signup', 'Please enter your email!');
          break;
        case 'password':
          Alert.alert('Signup', 'Please enter a password!');
          break;
        case 'confirm password':
          Alert.alert('Signup', 'Please confirm your password!');
          break;
        case 'date of birth':
          Alert.alert('Signup', 'Please select your date of birth!');
          break;
        case 'phone number':
          Alert.alert('Signup', 'Please enter your phone number!');
          break;
        case 'emergency contact number':
          Alert.alert('Signup', 'Please enter an emergency contact number!');
          break;
        case 'language':
          Alert.alert('Signup', 'Please select your preferred language!');
          break;
        case 'country':
          Alert.alert('Signup', 'Please select your country!');
          break;
      }
      return false;
    }

    if (password && !isPasswordValid(password)) {
      Alert.alert('Signup', 'Password must be at least 8 characters long!');
      isValid = false;
    }
  
    return isValid;
  };

  const onSubmit = async () => {
    setUserName(prevName => prevName.trim());
    setFullName(prevFullName => prevFullName.trim());
    setEmail(prevEmail => prevEmail.trim());
    setPhoneNumber(prevPhone => prevPhone.trim());
    setEmergencyPhoneNumber(prevPhone => prevPhone.trim());
    setPassword(prevPassword => prevPassword.trim());

    await new Promise(resolve => setTimeout(resolve, 0));

    const isFormValid = await validateForm();
    if (!isFormValid) return;

    setLoading(true);

    const fullPhoneNumber = `${countryCode}${phoneNumber.trim()}`;
    const fullEmergencyPhoneNumber = `${emergencyCountryCode}${emergencyPhoneNumber.trim()}`;

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password: password.trim(),
        });

        if (error) {
            setLoading(false);
            Alert.alert('Sign up failed', error.message);
            return;
        }

        const userId = data?.user?.id;
        if (!userId) {
            setLoading(false);
            Alert.alert('Sign up failed', 'User ID is missing.');
            return;
        }

        const { error: insertError } = await supabase
            .from('travelers')
            .insert([
                {
                    id: userId,
                    user_name: userName.trim(),
                    full_name: fullName.trim(),
                    email: email.trim(),
                    date_of_birth: selectedDate,
                    phone_number: fullPhoneNumber,
                    emergency_phone: fullEmergencyPhoneNumber,
                    language: selectedLanguage,
                    country: selectedCountry,
                    created_at: new Date().toISOString(),
                }
            ]);

        setLoading(false);

        if (insertError) {
            Alert.alert('Sign up error', insertError.message);
            return;
        }
    } catch (err) {
        setLoading(false);
        Alert.alert('Sign up error', err.message || 'An unexpected error occurred');
    }
};

  const CountryCodePicker = ({ selectedValue, onValueChange }) => (
    <Picker
      selectedValue={selectedValue}
      style={{ 
        width: 80,
        height: '100%',
        opacity: 0,
        position: 'absolute',
        left: 0,
        top: 0
      }}
      onValueChange={onValueChange}
    >
      {countryList.map(({ value, label }) => (
        <Picker.Item 
          key={value}
          label={label}
          value={value}
        />
      ))}
    </Picker>
  );

  const LanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Language</Text>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {LANGUAGES.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.languageOption,
                  selectedLanguage === value && styles.selectedLanguageOption
                ]}
                onPress={() => handleLanguageSelect(value)}
              >
                <Text style={[
                  styles.languageOptionText,
                  selectedLanguage === value && styles.selectedLanguageOptionText
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const CountryModal = () => (
    <Modal
      visible={showCountryModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCountryModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCountryModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Country</Text>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {COUNTRIES.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.countryOption,
                  selectedCountry === value && styles.selectedCountryOption
                ]}
                onPress={() => handleCountrySelect(value)}
              >
                <Flag
                  code={value}
                  size={24}
                  type="flat"
                />
                <Text style={[
                  styles.countryOptionText,
                  selectedCountry === value && styles.selectedCountryOptionText
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderDatePicker = () => {
    if (!showDatePicker) return null;
    
    return (
      <View>
        {Platform.OS === 'ios' ? (
          <View style={styles.iosDatePickerContainer}>
            <View style={styles.iosDatePickerHeader}>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(false)}
                style={styles.iosDatePickerButton}
              >
                <Text style={styles.iosDatePickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  setShowDatePicker(false);
                }}
                style={styles.iosDatePickerButton}
              >
                <Text style={[styles.iosDatePickerButtonText, {color: theme.colors.themebg}]}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateSelect}
              maximumDate={new Date()}
              style={styles.iosDatePicker}
            />
          </View>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateSelect}
            maximumDate={new Date()}
          />
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper bg="#303030">
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={styles.container}
      >
        <BackButton router={router} />

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, platformSpacing]} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            style={styles.iconImage}
            resizeMode="contain"
            source={require('../assets/images/WHITE ICON.png')}
          />

          <Text style={styles.welcomeText}>JOIN TRIP CEYLON DISCOVER MORE!</Text>

          <View style={styles.form}>
            <Text style={styles.label}>User Name</Text>
            <Input
              icon={<Icon name="user" size={26} strokeWidth={1.6} />}
              placeholder='Enter a preferred User Name'
              value={userName}
              onChangeText={handleUsernameChange}
            />
            {userNameError ? <Text style={styles.errorText}>{userNameError}</Text> : null}

            <Text style={styles.label}>Full Name</Text>
            <Input
              icon={<Icon name="user" size={26} strokeWidth={1.6} />}
              placeholder='Enter your Full Name (First Last)'
              value={fullName}
              onChangeText={handleFullNameChange}
            />
            {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}

            <Text style={styles.label}>E-mail</Text>
            <Input
              icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
              placeholder="Enter your Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <Text style={styles.label}>Password</Text>
            <Input
              icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
              placeholder="Password Must Contain 8 Chars"
              value={password}
              secureTextEntry={!passwordVisible}
              onChangeText={setPassword}
              rightIcon={<Icon name={passwordVisible ? "viewTrue" : "viewFalse"} size={26} color="#475569" />}
              onRightIconPress={togglePasswordVisibility}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <Input
              icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
              placeholder="Re-Enter Your Password"
              value={confirmPassword}
              secureTextEntry={!passwordVisible}
              onChangeText={setConfirmPassword}
              rightIcon={<Icon name={passwordVisible ? "viewTrue" : "viewFalse"} size={26} color="#475569" />}
              onRightIconPress={togglePasswordVisibility}
            />

            <Text style={styles.label}>Date of Birth</Text>
            <Pressable onPress={openDatePicker}>
              <Input
                icon={<Icon name="calendar" size={26} strokeWidth={1.6} />}
                placeholder='Select a Date'
                value={displayDate}
                editable={false}
                onPressIn={() => {}}
              />
            </Pressable>
            {renderDatePicker()}

            <Text style={styles.label}>Phone Number</Text>
            <Input
              icon={<Icon name="contact" size={26} strokeWidth={1.6} />}
              placeholder="Enter Your Phone Number"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              picker={<CountryCodePicker 
                selectedValue={countryCode}
                onValueChange={setCountryCode}
              />}
              selectedValue={countryCode}
            />
            {!isPhoneValid && phoneNumber.length > 0 && (
              <Text style={styles.errorText}>Invalid phone number</Text>
            )}

            <Text style={styles.label}>Emergency Contact Number</Text>
            <Input
              icon={<Icon name="contact" size={26} strokeWidth={1.6} />}
              placeholder="Emergency Contact"
              keyboardType="phone-pad"
              value={emergencyPhoneNumber}
              onChangeText={handleEmergencyPhoneChange}
              picker={<CountryCodePicker 
                selectedValue={emergencyCountryCode}
                onValueChange={setEmergencyCountryCode}
              />}
              selectedValue={emergencyCountryCode}
            />
            {!isEmergencyPhoneValid && emergencyPhoneNumber.length > 0 && (
              <Text style={styles.errorText}>Invalid emergency contact number</Text>
            )}

            <Text style={styles.label}>Select your language spoken</Text>
            <TouchableOpacity 
              onPress={() => setShowLanguageModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.inputStyle}>
                <Icon name="language" size={26} strokeWidth={1.6} color="#475569" />
                <Text style={[
                  styles.placeholderText,
                  selectedLanguage && styles.selectedValueText
                ]}>
                  {LANGUAGES.find(lang => lang.value === selectedLanguage)?.label || 'Select language'}
                </Text>
                <Icon name="arrowRight" size={20} strokeWidth={1.6} color="#475569" />
              </View>
            </TouchableOpacity>

            <LanguageModal />

            <Text style={styles.label}>Select your country</Text>
            <TouchableOpacity 
              onPress={() => setShowCountryModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.inputStyle}>
                <Icon name="globalSearch" size={26} strokeWidth={1.6} color="#475569" />
                {selectedCountry && (
                  <Flag
                    code={selectedCountry}
                    size={24}
                    type="flat"
                    style={styles.selectedFlag}
                  />
                )}
                <Text style={[
                  styles.placeholderText,
                  selectedCountry && styles.selectedValueText
                ]}>
                  {COUNTRIES.find(country => country.value === selectedCountry)?.label || 'Select country'}
                </Text>
                <Icon name="arrowRight" size={20} strokeWidth={1.6} color="#475569" />
              </View>
            </TouchableOpacity>
            
            <CountryModal />
          </View>

          <View style={styles.createButtonContainer}>
            <Button 
              title={'CREATE ACCOUNT'} 
              loading={loading} 
              onPress={onSubmit} 
            />
          </View>

          <Text style={styles.footerText}>
            BY CONTINUING, YOU AGREE TO TRIP CEYLON'S{' '}
            <Pressable>
              <Text style={styles.linkText}>TERMS OF SERVICE</Text>
            </Pressable>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: hp(1),
  },
  welcomeText: {
    fontSize: hp(3.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textWhite,
    textAlign: 'center',
    marginBottom: hp(4),
  },
  iconImage: {
    height: hp(13),
    alignSelf: 'center',
    marginBottom: hp(4)
  },
  form: {
    gap: 12,
    paddingBottom: hp(2),
  },
  label: {
    fontSize: hp(1.5),
    color: theme.colors.textWhite,
  },
  errorText: {
    color: '#FF4444',
    fontSize: hp(1.4),
    marginTop: -8,
    marginBottom: 4,
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.textWhite,
    fontSize: hp(1.6),
    marginTop: hp(3),
  },
  linkText: {
    color: theme.colors.forgotpasswordlink,
    textDecorationLine: 'underline',
    marginTop: hp(1)
  },
  createButtonContainer: {
    marginTop: hp(4)
  },
  inputStyle: {
    flexDirection: 'row',
    height: hp(6.5),
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
    borderRadius: theme.radius.xxl,
    paddingHorizontal: 18,
    gap: 12
  },
  placeholderText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: hp(1.8)
  },
  selectedValueText: {
    color: '#000'
  },
  selectedFlag: {
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    textAlign: 'center'
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginVertical: 4
  },
  selectedLanguageOption: {
    backgroundColor: theme.colors.shadowcolor,
  },
  languageOptionText: {
    fontSize: hp(1.8),
    color: '#000'
  },
  selectedLanguageOptionText: {
    color: theme.colors.themebg,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectedCountryOption: {
    backgroundColor: '#f3f4f6',
  },
  countryOptionText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  selectedCountryOptionText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  iosDatePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iosDatePickerButton: {
    padding: 5,
    paddingHorizontal: 15,
  },
  iosDatePickerButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  iosDatePicker: {
    width: '100%',
    height: 200,
  }
});

export default Signup;