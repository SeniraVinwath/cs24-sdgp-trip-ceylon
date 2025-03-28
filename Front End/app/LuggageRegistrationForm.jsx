import React, { useState } from "react";
import { StyleSheet, View, Text, Alert, ScrollView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "../components/Input";
import Icon from '../assets/icons';
import Button from '../components/Button';
import { wp, hp } from '../helpers/common';
import ScreenWrapper from "../components/ScreenWrapper";
import Head from "../components/Head";
import baseApiUrl from "../constants/baseApiUrl";
import { useAuth } from '../contexts/AuthContext';

const LuggageRegistrationForm = ({ onLuggageRegistered = null }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [luggageName, setLuggageName] = useState("");
  const [account, setAccount] = useState("");
  const [imei, setImei] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const platformSpacing = { 
    paddingBottom: Platform.select({ 
      ios: Math.max(insets.bottom, hp(2)), 
      android: Math.max(insets.bottom, hp(2)), 
    }),
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const onRegister = async () => {
    if (!luggageName || !account || !imei || !password) {
      Alert.alert('Register', 'Please fill all fields!');
      return;
    }

    const userId = user?.id;
    
    if (!userId) {
      Alert.alert('Error', 'User ID is missing. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        userId: userId,
        luggageName,
        account,
        imei,
        password
      };

      console.log('Sending luggage data:', data);

      const response = await fetch(`${baseApiUrl}/api/register-luggage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data),
      });

      const responseText = await response.text();
      
      const responseData = responseText ? JSON.parse(responseText) : {};
      setLoading(false);

      if (response.ok) {
        const luggageData = {
          id: responseData.id || responseData.luggageId || Date.now().toString(),
          userId,
          luggageName,
          account,
          imei,
          password
        };
        
        if (typeof onLuggageRegistered === 'function') {
          onLuggageRegistered(luggageData);
        }
        
        setLuggageName("");
        setAccount("");
        setImei("");
        setPassword("");
        
        navigation.navigate('LuggageDashboard');
      } else {
        const errorMessage = responseData.error?.message || 
                            responseData.message || 
                            `Registration failed (${response.status})`;
        Alert.alert('Error', errorMessage);
        console.error("API Error:", errorMessage);
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'An error occurred. Please try again.');
      console.error("Registration error:", error);
    }
  };

  return (
    <ScreenWrapper bg="#303030">
      <View style={styles.container}>
        <Head title="Register New Luggage" />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollViewContent,
            platformSpacing
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <View style={styles.formInputs}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Luggage Name</Text>
                  <Input
                    icon={<Icon name="luggage" size={hp(2.2)} />}
                    placeholder="Name your luggage"
                    value={luggageName}
                    onChangeText={setLuggageName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Account</Text>
                  <Input
                    icon={<Icon name="user" size={hp(2.2)} />}
                    placeholder="Enter account name"
                    value={account}
                    onChangeText={setAccount}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>IMEI Number</Text>
                  <Input
                    icon={<Icon name="anon" size={hp(2.2)} />}
                    placeholder="Enter IMEI number"
                    value={imei}
                    onChangeText={setImei}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <Input
                    icon={<Icon name="lock" size={hp(2.2)} strokeWidth={1.6} />}
                    placeholder="Enter password"
                    secureTextEntry={!passwordVisible}
                    value={password}
                    onChangeText={setPassword}
                    rightIcon={<Icon name={passwordVisible ? "viewTrue" : "viewFalse"} size={hp(2.2)} color="#475569" />}
                    onRightIconPress={togglePasswordVisibility}
                  />
                </View>
              </View>
              <View style={styles.registerButtonContainer}>
                <Button 
                  title={'REGISTER'} 
                  loading={loading} 
                  onPress={onRegister}
                  disabled={loading}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#303030",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: hp(2),
    paddingBottom: Platform.OS === 'ios' ? hp(4) : hp(2),
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: hp(2),
    width: '100%',
  },
  form: {
    backgroundColor: "#424242",
    borderRadius: wp(4),
    paddingVertical: hp(3),
    paddingHorizontal: wp(5),
    shadowColor: "#000",
    shadowOffset: { 
      width: 0, 
      height: Platform.OS === 'ios' ? hp(0.5) : hp(0.3) 
    },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.25,
    shadowRadius: Platform.OS === 'ios' ? hp(1) : hp(0.5),
    elevation: 5,
    marginVertical: hp(2),
    width: '100%',
  },
  formInputs: {
    marginBottom: hp(2.5),
    width: '100%',
  },
  inputContainer: {
    marginBottom: hp(2.5),
    width: '100%',
  },
  label: {
    color: "#E0E0E0",
    fontSize: hp(1.8),
    marginBottom: hp(1),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  registerButtonContainer: {
    marginTop: hp(2),
    width: '100%',
  },
});

export default LuggageRegistrationForm;