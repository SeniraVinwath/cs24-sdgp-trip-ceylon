import { StyleSheet, Text, View, TouchableOpacity, Image, Pressable, Alert, Platform } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase'

const Login = () => {
    const router = useRouter();
    const emailRef = useRef();
    const passwordRef = useRef("");
    const [loading, setLoading] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const insets = useSafeAreaInsets();

    const platformSpacing = {
        paddingBottom: Platform.select({
            ios: Math.max(insets.bottom, hp(2)),
            android: Math.max(insets.bottom, hp(2)),
        }),
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const onSubmit = async () => {
        if (!emailRef.current || !passwordRef.current) {
            Alert.alert('Login', 'Please fill all the fields!');
            return;
        }

        let email = emailRef.current.trim();
        let password = passwordRef.current.trim();

        setLoading(true);

        const {error} = await supabase.auth.signInWithPassword({
            email,
            password
        });

        setLoading(false);

        console.log('error: ', error);
        if(error){
            Alert.alert('Login', error.message);
        }
    };

    const handleGoogleLogin = () => {
        Alert.alert('Google Login', 'Redirecting to Google authentication...');
    };

    return (
        <ScreenWrapper bg="#303030">
            <StatusBar style="dark" />
            <View style={[styles.container, platformSpacing]}>
                <BackButton router={router} />

                {/* Logo Icon */}
                <Image
                    style={styles.iconImage}
                    resizeMode='contain'
                    source={require('../assets/images/WHITE ICON.png')}
                />

                {/* Welcome Text */}
                <View>
                    <Text style={styles.welcomeText}>WELCOME BACK TO TRIP CEYLON</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>E-mail</Text>
                    <Input
                        icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                        placeholder='Enter your email'
                        onChangeText={value => emailRef.current = value}
                    />
                    <Text style={styles.label}>Password</Text>
                    <Input
                        icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                        placeholder="Enter your password"
                        secureTextEntry={!passwordVisible}
                        onChangeText={value => passwordRef.current = value}
                        rightIcon={<Icon name={passwordVisible ? "viewTrue" : "viewFalse"} size={26} color="#475569" />}
                        onRightIconPress={togglePasswordVisibility}
                    />
                    <Text style={styles.forgotPassword}>Forgot Password?</Text>
                    
                    <View style={styles.loginButtonContainer}>
                        <Button title={'LOG IN'} loading={loading} onPress={onSubmit} />
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerTextOne}>OR LOGIN WITH</Text>
                    <View style={styles.googleButtonContainer}>
                        <TouchableOpacity style={[styles.googleButton, styles.loginButtonContainer]} onPress={handleGoogleLogin}>
                            <Image source={require('../assets/images/Google Icon.png')} style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Login with Google</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.signupContainer}>
                        <Text style={styles.signupText}>OR</Text>
                        <Pressable onPress={()=> router.push('signUp')}>
                            <Text style={styles.signupText2}>REGISTER NOW!</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 45,
        paddingHorizontal: wp(5),
    },
    welcomeText: {
        fontSize: hp(3.8),
        fontWeight: theme.fonts.bold,
        color: theme.colors.textWhite,
        textAlign: 'center',
    },
    iconImage: {
        height: hp(13),
        alignSelf: 'center',
        marginTop: -hp(7),
    },
    form: {
        gap: 8,
    },
    label: {
        fontSize: hp(1.5),
        color: theme.colors.textWhite,
    },
    loginButtonContainer: {
        marginTop: hp(4),
    },
    forgotPassword: {
        textAlign: 'right',
        fontWeight: theme.fonts.semibold,
        color: theme.colors.forgotpasswordlink,
        textDecorationLine: 'underline',
        fontSize: hp(1.8),
        marginTop: hp(0.5),
    },
    footer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: hp(-1),
    },
    footerTextOne: {
        textAlign: 'center',
        color: theme.colors.textWhite,
        fontSize: hp(1.6),
    },
    googleButtonContainer: {
        marginTop: hp(-4),
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        height: hp(6.2),
        borderRadius: theme.radius.xl,
        elevation: 4,
        paddingHorizontal: wp(22),
        alignSelf: 'center',
    },
    googleIcon: {
        width: hp(4),
        height: hp(4),
        marginRight: wp(3),
    },
    googleButtonText: {
        fontSize: hp(2),
        color: '#645E5A',
        fontWeight: theme.fonts.medium,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: hp(1.5),
    },
    signupText: {
        textAlign: 'center',
        color: theme.colors.linkGreen,
        fontWeight: theme.fonts.semibold,
        fontSize: hp(1.6),
    },
    signupText2: {
        textAlign: 'center',
        color: theme.colors.linkGreen,
        fontWeight: theme.fonts.semibold,
        textDecorationLine: 'underline',
        fontSize: hp(1.6),
    },
});