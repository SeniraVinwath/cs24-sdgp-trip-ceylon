import { Alert, Button, Pressable, StyleSheet, Text, View, Animated, FlatList, Platform, Dimensions } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { useAuth } from '../../contexts/AuthContext'
import { wp, hp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Icon from '../../assets/icons'
import { useRouter } from 'expo-router'
import Avatar from '../../components/Avatar'
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'
import { supabase } from '../../lib/supabase'
import { getUserData } from '../../services/userService'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

var limit = 0;

const Home = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    const platformSpacing = { 
      paddingBottom: Platform.select({ 
        ios: Math.max(insets.bottom, hp(2)), 
        android: Math.max(insets.bottom, hp(2)), 
      }),
    };

    const handlePostEvent = async (payload) => {
      if(payload.eventType === 'INSERT' && payload?.new?.id){
        let newPost = {...payload.new};
        let res = await getUserData(newPost.userId);
        newPost.traveler = res.success ? res.data : {};
        newPost.likeCount = 0;
        newPost.userLiked = false;
        setPosts(prevPosts => [newPost, ...prevPosts]);
      }

      if(payload.eventType=='DELETE' && payload.old.id){
        setPosts(prevPosts=>{
          let updatedPosts = prevPosts.filter(post=> post.id!=payload.old.id);
          return updatedPosts;
        })
      }

      if(payload.eventType === 'UPDATE' && payload?.new?.id){
        setPosts(prevPosts=>{
          let updatedPosts = prevPosts.map(post=>{
            if(post.id==payload.new.id){
              post.body = payload.new.body;
              post.file = payload.new.file;
              post.locationId = payload.new.locationId;
            }
            return post;
          });

          return updatedPosts;

        })
      }
    }

    const handleNewNotification = async (payload) =>{
      console.log('got new notification: ', payload);
      if(payload.eventType=='INSERT' && payload.new.id){
        setNotificationCount(prev=> prev+1);
      }
    }

    useEffect(() => {
      const postChannel = supabase
        .channel('posts')
        .on('postgres_changes', {event: '*', schema: 'public', table: 'posts'}, handlePostEvent)
        .subscribe();

      const likeChannel = supabase
        .channel('likes')
        .on('postgres_changes', 
          {event: '*', schema: 'public', table: 'postLikes'}, 
          () => refreshPosts() 
        )
        .subscribe();
      
        const notificationChannel = supabase
        .channel('notifications')
        .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'notifications', filter: `recieverId=eq.${user.id}`}, handleNewNotification)
        .subscribe()

      return () => {
        supabase.removeChannel(postChannel);
        supabase.removeChannel(likeChannel);
        supabase.removeChannel(notificationChannel);
      }
    }, []);

    const getPosts = async () => {
      if(!hasMore || !user?.id) return;
      limit += 4;

      try {
        const res = await fetchPosts(user.id, limit);
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
        const res = await fetchPosts(user?.id, limit);
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

    
    const dropdownAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (showDropdown) {
        Animated.timing(dropdownAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(dropdownAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [showDropdown]);

    const toggleDropdown = () => {
      setShowDropdown(!showDropdown);
    }

    const handleDropdownOption = (route) => {
      setShowDropdown(false);
      router.push(route);
    }

  return (
    <ScreenWrapper bg="#303030">
      <View style={[styles.container, { paddingLeft: wp(4) + insets.left, paddingRight: wp(4) + insets.right }]}>
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>Trip Ceylon</Text>
          <View style={styles.icons}>
            <Pressable 
              onPress={()=> {
                setNotificationCount(0);
                router.push('notifications');
              }}
              hitSlop={{top: hp(1), bottom: hp(1), left: wp(1), right: wp(1)}}
            >
              <Icon name="notification" size={hp(3.2)} strokeWidth={2}/>
              {
                notificationCount>0 && (
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{notificationCount}</Text>
                  </View>
                )
              }
            </Pressable>
            <Pressable 
              onPress={()=> router.push('newPost')}
              hitSlop={{top: hp(1), bottom: hp(1), left: wp(1), right: wp(1)}}
            >
              <Icon name="addNew" size={hp(3.2)} strokeWidth={2}/>
            </Pressable>
            <Pressable 
              onPress={toggleDropdown}
              hitSlop={{top: hp(1), bottom: hp(1), left: wp(1), right: wp(1)}}
            >
              <Icon name={showDropdown ? "arrowUp" : "arrowDown"} size={hp(3.2)} strokeWidth={2}/>
            </Pressable>
          </View>
        </View>

        {/* Dropdown Menu*/}
        {showDropdown && (
          <Animated.View 
            style={[
              styles.dropdownContainer, 
              {
                opacity: dropdownAnim,
                transform: [
                  { translateY: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0]
                    })
                  },
                  { scaleY: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1]
                    })
                  }
                ],
                right: wp(4) + (Platform.OS === 'ios' ? insets.right : 0)
              }
            ]}
          >
            <View style={styles.dropdownContent}>
              <Pressable 
                style={styles.dropdownItem} 
                onPress={() => handleDropdownOption('profile')}
                hitSlop={{top: hp(0.5), bottom: hp(0.5), left: wp(0.5), right: wp(0.5)}}
              >
                <Avatar
                  uri={user?.image}
                  size={hp(4.3)}
                  rounded={theme.radius.sm}
                  style={{borderWidth: 2}}
                />
              </Pressable>
              
              <Pressable 
                style={styles.dropdownItem} 
                onPress={() => handleDropdownOption('luggage')}
                hitSlop={{top: hp(0.5), bottom: hp(0.5), left: wp(0.5), right: wp(0.5)}}
              >
                <Icon name="luggage" size={hp(3.2)} strokeWidth={2}/>
              </Pressable>
              
              <Pressable 
                style={styles.dropdownItem} 
                onPress={() => handleDropdownOption('connections')}
                hitSlop={{top: hp(0.5), bottom: hp(0.5), left: wp(0.5), right: wp(0.5)}}
              >
                <Icon name="connect2" size={hp(3.2)} strokeWidth={2}/>
              </Pressable>
              
              <Pressable 
                style={[styles.dropdownItem, styles.lastDropdownItem]} 
                onPress={() => handleDropdownOption('itinerary')}
                hitSlop={{top: hp(0.5), bottom: hp(0.5), left: wp(0.5), right: wp(0.5)}}
              >
                <Icon name="itinerary" size={hp(3.2)} strokeWidth={2}/>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* posts */}
        <FlatList
          data={posts}
          refreshing={refreshing}
          onRefresh={refreshPosts}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listStyle, platformSpacing]}
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
            <View style={{marginVertical: posts.length === 0 ? hp(20) : hp(3)}}>
              <Loading/>
            </View>
          ) : (
            <View style={{marginVertical: hp(3)}}>
              <Text style={styles.noPosts}>You're all caught up for now from TRIP CEYLON</Text>
            </View>
          )}
        />
      </View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: hp(1),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1),
    marginHorizontal: wp(2),
    paddingVertical: hp(0.5),
  },
  title: {
    color: theme.colors.textWhite,
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold
  },
  avatarImage: {
    height: hp(4.3),
    width: hp(4.3),
    borderRadius: theme.radius.sm,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
    borderWidth: 3
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Platform.OS === 'ios' ? wp(4.5) : wp(4),
  },
  listStyle: {
    paddingTop: hp(2),
    paddingHorizontal: wp(0.5),
  },
  noPosts: {
    fontSize: hp(1.65),
    fontWeight: '300',
    textAlign: 'center',
    color: theme.colors.textDark2,
  },
  pill: {
    position: 'absolute',
    right: -wp(2.5),
    top: -hp(0.4),
    height: hp(2.2),
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: hp(2.2) / 2,
    backgroundColor: 'red'
  },
  pillText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold
  },
  dropdownContainer: {
    position: 'absolute',
    top: hp(6),
    zIndex: 999,
    transformOrigin: 'top', 
  },
  dropdownContent: {
    backgroundColor: '#424242',
    borderRadius: theme.radius.xxxl,
    paddingH: hp(1),
    width: 'auto',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.95,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(50, 205, 50, 0.2)'
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2.2),
    paddingHorizontal: wp(3),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lastDropdownItem: {
    borderBottomWidth: 0
  }
})