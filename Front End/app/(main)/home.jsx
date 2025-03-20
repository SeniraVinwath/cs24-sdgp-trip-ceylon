import { Alert, Button, Pressable, StyleSheet, Text, View, Animated, FlatList } from 'react-native'
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

var limit = 0;

const Home = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const {user, setAuth} = useAuth();
    const router = useRouter();

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

      return () => {
        supabase.removeChannel(postChannel);
        supabase.removeChannel(likeChannel);
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
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>Trip Ceylon</Text>
          <View style={styles.icons}>
            <Pressable onPress={()=> router.push('notifications')}>
              <Icon name="notification" size={hp(3.2)} strokeWidth={2}/>
            </Pressable>
            <Pressable onPress={()=> router.push('newPost')}>
              <Icon name="addNew" size={hp(3.2)} strokeWidth={2}/>
            </Pressable>
            <Pressable onPress={toggleDropdown}>
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
              }
            ]}
          >
            <View style={styles.dropdownContent}>
              <Pressable 
                style={styles.dropdownItem} 
                onPress={() => handleDropdownOption('profile')}
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
              >
                <Icon name="luggage" size={hp(3.2)} strokeWidth={2}/>
              </Pressable>
              
              <Pressable 
                style={styles.dropdownItem} 
                onPress={() => handleDropdownOption('connections')}
              >
                <Icon name="connect2" size={hp(3.2)} strokeWidth={2}/>
              </Pressable>
              
              <Pressable 
                style={[styles.dropdownItem, styles.lastDropdownItem]} 
                onPress={() => handleDropdownOption('itinerary')}
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
            <View style={{marginVertical: posts.length === 0 ? 200 : 30}}>
              <Loading/>
            </View>
          ) : (
            <View style={{marginVertical: 30}}>
              <Text style={styles.noPosts}>You're all caught up for now from Trip Ceylon !</Text>
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
    paddingHorizontal: wp(4),
    marginTop: hp(1),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: wp(2)
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
    gap: 18
  },
  listStyle: {
    paddingTop: 20,
  },
  noPosts: {
    fontSize: hp(1.5),
    textAlign: 'center',
    color: theme.colors.textDark2,
  },
  pill: {
    position: 'absolute',
    right: -10,
    top : -4,
    height: hp(2.2),
    width: hp(2.2),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.roseLight
  },
  pillText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: theme.fonts.bold
  },
  dropdownContainer: {
    position: 'absolute',
    top: hp(6),
    right: wp(4),
    zIndex: 999,
    transformOrigin: 'top', 
  },
  dropdownContent: {
    backgroundColor: '#424242',
    borderRadius: theme.radius.xxxl,
    padding: hp(1),
    width: 'contentwidth',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.95,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: theme.colors.textDark2
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2.2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lastDropdownItem: {
    borderBottomWidth: 0
  }
})