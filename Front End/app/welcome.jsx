import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import React from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { wp, hp } from '../helpers/common';
import { theme } from '../constants/theme';
import Button from '../components/Button';
import { useRouter } from 'expo-router';

const Welcome = () => {
    const router = useRouter();
  return (
    <ScreenWrapper bg="#303030">
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* logo image */}
        <Image
          style={styles.logoImage}
          resizeMode="contain"
          source={require('../assets/images/LOGO/whiteLOGO.png')}
        />

        {/* welcome image */}
        <Image
          style={styles.welcomeImage}
          resizeMode="contain"
          source={require('../assets/images/LANDING IMAGE.png')}
        />

        {/* title */}
        <View>
          <Text style={styles.title}>
            Your Journey, Your Way..!{'\n'}Discover Sri Lanka with Ease
          </Text>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Button
            title='GET STARTED'
            buttonStyle={{ marginHorizontal: wp(3), marginBottom: hp(2) }} // Added bottom margin
            onPress={() => router.push('tut1')}
          />
          <Pressable onPress={() => router.push('tut4')}>
            <Text style={[styles.skipTut, { color: theme.colors.linkGreen, fontWeight: theme.fonts.semibold }]}>
              Skip Tutorial
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.themebg,
    paddingHorizontal: wp(3),
  },

  logoImage: {
    height: hp(30),
    width: wp(60),
    alignSelf: 'center',
    marginTop: -hp(13)
  },

  welcomeImage: {
    height: hp(40),
    alignSelf: 'center',
    marginTop: -hp(20)
  },

  title: {
    color: 'white',
    textAlign: 'center',
    fontSize: hp(2.5),
    fontWeight: theme.fonts.extraBold,
    marginTop: -hp(5)
  },

  footer: {
    width: '60%',
    marginTop: -hp(5),
  },

  skipTut: {
    textAlign: 'center',
    color: theme.colors.linkGreen,
    marginTop: hp(1),
    fontSize: hp(2.5),
    textDecorationLine: 'underline',
  },
});
