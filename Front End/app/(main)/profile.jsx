import { Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
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
import { fetchPosts, fetchUserPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

var limit = 0;

const Profile = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    const platformSpacing = { 
      paddingBottom: Platform.select({ 
        ios: Math.max(insets.bottom, hp(2)), 
        android: Math.max(insets.bottom, hp(2)),
      }),
    };

    useEffect(() => {
      limit = 0;
      getPosts();
    }, []);

    const onLogout = async () => {
      const {error} = await supabase.auth.signOut();
      if(error){
        Alert.alert('Sign out', "Error signing out!")
      }
    }

    const getPosts = async () => {
      if(!hasMore || !user?.id) return;
      limit += 4;
    
      try {
        const res = await fetchUserPosts(user.id, limit);
        if(res.success) {
          setPosts(res.data);
          setHasMore(res.data.length >= limit);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load posts');
      }
    }

    const refreshPosts = async () => {
      try {
        setRefreshing(true);
        limit = 4;
        const res = await fetchUserPosts(user?.id, limit);
        if(res.success) {
          setPosts(res.data);
          setHasMore(res.data.length >= limit);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to refresh posts');
      } finally {
        setRefreshing(false);
      }
    }

    const handleLogout = async () => {
      Alert.alert('Confirm', "Are you sure you want to log out?", [
        {
          text: 'Cancel',
          onPress: () => console.log('modal cancelled'),
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: () => onLogout(),
          style: 'destructive'
        }
      ])
    }

    return (
      <ScreenWrapper bg="#303030">
        <FlatList
          ListHeaderComponent={<UserHeader user={user} router={router} handleLogout={handleLogout} />}
          ListHeaderComponentStyle={{marginBottom: hp(5)}}
          data={posts}
          refreshing={refreshing}
          onRefresh={refreshPosts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listStyle, 
            platformSpacing,
            { paddingHorizontal: wp(4) }
          ]}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <PostCard
              item={item}
              currentUser={user}
              router={router}
              refreshPosts={refreshPosts}
            />
          )}
          onEndReached={getPosts}
          onEndReachedThreshold={0.3}
          ListFooterComponent={hasMore ? (
            <View style={{marginVertical: posts.length === 0 ? hp(10) : hp(3)}}>
              <Loading/>
            </View>
          ) : (
            <View style={{marginVertical: hp(3)}}>
            </View>
          )}
        />
      </ScreenWrapper>
    )
}

const UserHeader = ({user, router, handleLogout}) => {
  const getFullCountryName = (countryCode) => {
    const country = COUNTRIES.find(c => c.value === countryCode);
    return country ? country.label : countryCode;
  }

  return (
    <View style={styles.headerWrapper}>
      {/* Custom header with Head component that includes back button */}
      <View style={styles.headContainer}>
        {/* Use Head with showBackButton=true */}
        <Head title="Profile" mb={hp(3)} showBackButton={true} />
        
        {/* Add logout button to the right */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Icon name='logout2'/>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.profileContentWrapper}>
          <View style={styles.avatarContainer}>
            <Avatar 
              uri={user?.image} 
              size={hp(20)} 
              rounded={theme.radius.xxxl}
            />
            <Pressable 
              style={styles.editIcon} 
              onPress={() => router.push('editProfile')}
              hitSlop={{top: 5, bottom: 5, left: 5, right: 5}}
            >
              <Icon name='edit' strokeWidth={2.5} size={wp(5)}/>
            </Pressable>
          </View>

          {/* User Details */}
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{user && user.user_name}</Text>
            <Text style={styles.infoText}>
              {user && getFullCountryName(user.country)}
            </Text>
          </View>

          {/* Bio Section */}
          {user && user.bio && (
            <Text style={styles.infoText3}>{user.bio}</Text>
          )}

          {/* User Information Section */}
          <View style={styles.infoContainer}>
            <View style={styles.info}>
              <Icon name='gender' size={wp(5)} color='#d1d1d1'/>
              <Text style={styles.infoText2}>
                {user && user.gender}
              </Text>
            </View>
            <View style={styles.info}>
              <Icon name='cake' size={wp(5)} color='#d1d1d1'/>
              <Text style={styles.infoText2}>
                {user && user.date_of_birth}
              </Text>
            </View>
            <View style={styles.info}>
              <Icon name='conName' size={wp(5)} color='#d1d1d1'/>
              <Text style={styles.infoText2}>
                {user && user.full_name}
              </Text>
            </View>
            <View style={styles.info}>
              <Icon name='mail' size={wp(5)} color='#d1d1d1'/>
              <Text style={styles.infoText2} numberOfLines={1} ellipsizeMode="tail">
                {user && user.email}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default Profile

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
    backgroundColor: '#303030',
  },
  headContainer: {
    position: 'relative',
    paddingHorizontal: wp(1),
    marginBottom: hp(0.5),
    width: '100%',
  },
  container: {
    paddingVertical: hp(0),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.xxl,
    marginHorizontal: wp(1),
  },
  profileContentWrapper: {
    gap: hp(0.5),
  },
  avatarContainer: {
    height: hp(20),
    width: hp(20),
    alignSelf: 'center',
    borderRadius: theme.radius.xxxl,
    padding: 8,
    marginBottom: hp(3),
  },
  editIcon: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? hp(2) : hp(-1.5),
    right: Platform.OS === 'ios' ? wp(0) : wp(-5),
    padding: wp(3),
    borderRadius: theme.radius.xxl,
    backgroundColor: '#454545',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    zIndex: 1,
  },
  userNameContainer: {
    alignItems: 'center', 
    gap: hp(0.4),
    marginBottom: hp(0.5),
  },
  userName: {
    fontSize: hp(3.2),
    fontWeight: '600',
    color: theme.colors.textWhite,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  infoContainer: {
    gap: hp(1),
    marginTop: hp(2),
    paddingBottom: hp(3),
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.textDark2,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(0.2),
    paddingHorizontal: wp(0.5),
    borderRadius: theme.radius.md,
    marginVertical: hp(0.2),
  },
  infoText: {
    fontSize: hp(1.8),
    fontWeight: '500',
    color: '#E0E0E0',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  infoText2: {
    fontSize: hp(1.7),
    fontWeight: '400',
    color: '#B0B0B0',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  infoText3: {
    fontSize: hp(1.7),
    fontWeight: '400',
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: hp(2.4),
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.2),
    borderRadius: theme.radius.sm,
    marginTop: hp(0.2),
  },
  logoutButton: {
    position: 'absolute',
    right: wp(1),
    top: wp(1),
    padding: wp(2),
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(66, 66, 66, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  listStyle: {
    backgroundColor: '#303030',
  },
  noPosts: {
    fontSize: hp(1.5),
    fontWeight: '300',
    textAlign: 'center',
    color: theme.colors.textDark2,
  },
});