import { Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
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

var limit = 0;

const Profile = () => {
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
      <FlatList
        ListHeaderComponent={<UserHeader user={user} router={router} handleLogout={handleLogout}/>}
        ListHeaderComponentStyle={{marginBottom: 50}}
        data={posts}
        refreshing={refreshing}
        onRefresh={refreshPosts}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
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
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasMore ? (
          <View style={{marginVertical: posts.length === 0 ? 100 : 30}}>
            <Loading/>
          </View>
        ) : (
          <View style={{marginVertical: 30}}>
            <Text style={styles.noPosts}>YOU ARE ALL CAUGHT UP FOR NOW</Text>
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

            {
              user && user.bio && (
                <Text style={styles.infoText3}>{user.bio}</Text>
              )
            }

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
    backgroundColor: '#2A2A2A',
    paddingVertical: 60,
    paddingHorizontal: 25,
    borderRadius: theme.radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(50, 205, 50, 0.2)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContainer: {
    marginHorizontal: wp(4),
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerShape: {
    width: wp(100),
    height: hp(22),
    backgroundColor: '#303030',
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  },
  avatarContainer: {
    height: hp(14),
    width: hp(14),
    alignSelf: 'center',
    borderRadius: theme.radius.xxxl,
    padding: 4,
    marginBottom: hp(2),
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: -10,
    padding: 10,
    borderRadius: 50,
    backgroundColor: theme.colors.linkGreen,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  userName: {
    fontSize: hp(3.2),
    fontWeight: '600',
    color: theme.colors.textWhite,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.radius.md,
    marginVertical: 2,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    marginTop: 10,
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(66, 66, 66, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 40,
    backgroundColor: '#303030',
  },
  noPosts: {
    fontSize: hp(1.5),
    fontWeight: '300',
    textAlign: 'center',
    color: theme.colors.textDark2,
    paddingBottom: 25,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(50, 205, 50, 0.2)',
  },
});