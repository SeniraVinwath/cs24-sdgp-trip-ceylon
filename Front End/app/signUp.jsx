import { StyleSheet, Text, View, Image, Alert, ScrollView, KeyboardAvoidingView, Platform, Pressable} from 'react-native';
import React, { useRef, useState } from 'react';
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
import isValidPhoneNumber from 'libphonenumber-js';

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const Signup = () => {
  const router = useRouter();
  const userNameRef = useRef();
  const fullNameRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const onSubmit = async () => {
    if (!userNameRef.current || !fullNameRef.current || !email || !passwordRef.current || !confirmPasswordRef.current || !selectedDate || !phoneNumber) {
      Alert.alert('Signup', 'Please fill all the fields!');
      return;
    }
  
    if (!isValidEmail(email)) {
      Alert.alert('Signup', 'Please enter a valid email address!');
      return;
    }
  
    if (!isValidPhoneNumber(phoneNumber)) { 
      Alert.alert('Signup', 'Please enter a valid phone number!');
      return;
    }
  };

  const handleConfirmDate = (event, date) => {
    if (date) {
      setSelectedDate(date.toLocaleDateString()); 
    }
    setShowDatePicker(false);
  };

  const handlePhoneChange = (value) => {
    setPhoneNumber(value);
    setIsPhoneValid(isValidPhoneNumber(value));
  };

  return (
      <ScreenWrapper bg="#303030">
          <StatusBar style="dark" />
          <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={hp(-5)}
              style={styles.container}
          >
              <BackButton router={router} />

              <ScrollView 
                  contentContainerStyle={styles.scrollContent} 
                  showsVerticalScrollIndicator={false}
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
                          onChangeText={value => userNameRef.current = value}
                      />

                      <Text style={styles.label}>Full Name</Text>
                      <Input
                          icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                          placeholder='Enter your Full Name'
                          onChangeText={value => fullNameRef.current = value}
                      />

                      <Text style={styles.label}>Email</Text>
                      <Input
                      icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                      placeholder="Enter your Email"
                      onChangeText={(value) => setEmail(value)}
                      />

                      <Text style={styles.label}>Password</Text>
                      <Input
                        icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                        placeholder="Password Must Contain 8 Chars"
                        secureTextEntry={!passwordVisible}
                        onChangeText={value => passwordRef.current = value}
                        rightIcon={<Icon name={passwordVisible ? "viewTrue" : "viewFalse"} size={26} color="#475569" />}
                        onRightIconPress={togglePasswordVisibility}
                      />

                      <Text style={styles.label}>Confirm Password</Text>
                      <Input
                          icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                          placeholder="Re-Enter Your Password"
                          secureTextEntry={!passwordVisible}
                          onChangeText={value => confirmPasswordRef.current = value}
                          rightIcon={<Icon name={passwordVisible ? "viewTrue" : "viewFalse"} size={26} color="#475569" />}
                          onRightIconPress={togglePasswordVisibility}
                      />

                      <Text style={styles.label}>Phone Number</Text>
                      <Input
                          icon={<Icon name="contact" size={26} strokeWidth={1.6} />}
                          placeholder='Enter Your Phone Number'
                          keyboardType="phone-pad"
                          value={phoneNumber}
                          onChangeText={handlePhoneChange}
                      />
                      {!isPhoneValid && <Text style={{ color: 'red' }}>Invalid phone number</Text>}

                      <Text style={styles.label}>Date of Birth</Text>
                      <Input
                        icon={<Icon name="calendar" size={26} strokeWidth={1.6} />}
                        placeholder='Select a Date'
                        value={selectedDate}
                        onFocus={() => setShowDatePicker(true)}
                      />

                      {showDatePicker && (
                        <DateTimePicker
                          value={new Date()}
                          mode="date"
                          display="default"
                          onChange={handleConfirmDate}
                        />
                      )}
                  </View>

                  <View style={styles.createButtonContainer}>
                    <Button title={'CREATE ACCOUNT'} loading={loading} onPress={onSubmit} />
                  </View>

                  <Text style={styles.footerText}>
                    BY CONTINUING, YOU AGREE TO TRIP CEYLON'S{''}
                    <Pressable>
                      <Text style={[styles.linkText]}>TERMS OF SERVICE</Text>
                    </Pressable>
                  </Text>
              </ScrollView>
          </KeyboardAvoidingView>
      </ScreenWrapper>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
      flex: 1,
      paddingHorizontal: wp(5),
  },

  scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: hp(5),
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
});
