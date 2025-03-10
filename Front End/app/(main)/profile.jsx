import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'expo-router'
import Head from '../../components/Head'
import { hp, wp } from '../../helpers/common'
import Icon from '../../assets/icons'
import { theme } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/Avatar'
import { COUNTRIES } from '../../constants/info';

const Profile = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();

    const onLogout = async () => {
      const {error} = await supabase.auth.signOut();
      if(error){
        Alert.alert('Sign out', "Error signing out!")
      }
    }

    const handleLogout = async ()=> {
      Alert.alert('Confirm', "Are you sure you want to log out?", [
        {
          text: 'Cancel',
          onPress: ()=> console.log('modal cancelled'),
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: ()=> onLogout(),
          style: 'destructive'
        }
      ])
    }
  return (
    <ScreenWrapper bg="#303030">
      <UserHeader user={user} router={router} handleLogout={handleLogout}/>
    </ScreenWrapper>
  )
}

const UserHeader = ({user, router, handleLogout}) => {
  const getFullCountryName = (countryCode) => {
    const country = COUNTRIES.find(c => c.value === countryCode);
    return country ? country.label : countryCode;
  }

  return (
    <View style={{flex: 1, backgroundColor: '#303030', paddingHorizontal: wp(4)}}>
      <View>
        <Head title="Profile" mb={30}/>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name='logout2'/>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={{gap: 15}}>
          <View style={styles.avatarContainer}>
            <Avatar uri={user?.image} size={hp(12)} rounded={theme.radius.xxxl}/>
            <Pressable style={styles.editIcon} onPress={()=> router.push('editProfile')}>
              <Icon name='edit' strokeWidth={2.5} size={20}/>
            </Pressable>
          </View>

          {/* User Details */}
          <View style={{alignItems: 'center', gap: 4}}>
            <Text style={styles.userName}>{user && user.user_name}</Text>
            <Text style={styles.infoText}>
              {user && getFullCountryName(user.country)}
            </Text>
          </View>

          {/* Other User Details */}
          <View style={{gap: 10, marginTop:hp(2)}}>
            <View style={styles.info}>
              <Icon name='gender' size={20} color='#d1d1d1'/>
              <Text style={styles.infoText2}>
                {user && user.gender}
              </Text>
            </View>
            <View style={styles.info}>
              <Icon name='cake' size={20} color='#d1d1d1'/>
              <Text style={styles.infoText2}>
                {user && user.date_of_birth}
              </Text>
            </View>
            <View style={styles.info}>
              <Icon name='conName' size={20} color='#d1d1d1'/>
              <Text style={styles.infoText2}>
                {user && user.full_name}
              </Text>
            </View>
            <View style={styles.info}>
              <Icon name='mail' size={20} color='#d1d1d1'/>
              <Text style={styles.infoText2}>
                {user && user.email}
              </Text>
            </View>

            {
              user && user.bio && (
                <Text style={styles.infoText2}>{user.bio}</Text>
              )
            }
          </View>
        </View>
      </View>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: 20,
  },
  headerShape: {
    width: wp(100),
    height: hp(20),
  },
  avatarContainer: {
    height: hp(12),
    width: hp(12),
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: -12,
    padding: 7,
    borderRadius: 50,
    backgroundColor: '#424242',
    shadowColor: 'black',
    shadowOffset: {width:0, height:4},
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textWhite,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: theme.colors.textWhite,
  },
  infoText2: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: '#d1d1d1',
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: '#424242',
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.textWhite,
  }
})