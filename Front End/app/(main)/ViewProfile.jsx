import { Alert, FlatList, StyleSheet, Text, View, Platform, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Head from '../../components/Head';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/Avatar';
import { COUNTRIES } from '../../constants/info';
import { fetchUserPosts } from '../../services/postService';
import PostCard from '../../components/PostCard';
import Loading from '../../components/Loading';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

var limit = 0;

const ViewProfile = () => {
  const router = useRouter();
  const { requesterId, transition } = useLocalSearchParams();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Set loading state immediately when component mounts
  // This ensures we show a loading state right away
  useEffect(() => {
    setIsLoading(true);
  }, []);

  // Using useFocusEffect to ensure we reload when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const fetchUserProfile = async () => {
        try {
          if (!requesterId) {
            console.error("No requesterId found in query params");
            return;
          }

          console.log("Fetching profile for requesterId:", requesterId);

          // Keep isLoading true while fetching

          const { data, error } = await supabase
            .from('travelers')
            .select('*')
            .eq('id', requesterId)
            .single();

          if (error) {
            console.error("Supabase error:", error);
            throw error;
          }

          if (!data) {
            console.warn("No user found for requesterId:", requesterId);
            return;
          }

          setUser(data);
        } catch (error) {
          Alert.alert('Error', 'Failed to load user profile');
        } finally {
          // Small delay to ensure smoother transition
          setTimeout(() => {
            setIsLoading(false);
          }, 100);
        }
      };

      fetchUserProfile();
      limit = 0;
      getPosts();

      return () => {
        // Clean up if needed when screen loses focus
      };
    }, [requesterId])
  );

  const getPosts = async () => {
    if (!hasMore || !requesterId) return;
    limit += 4;

    try {
      const res = await fetchUserPosts(requesterId, limit);
      if (res.success) {
        setPosts(res.data);
        setHasMore(res.data.length >= limit);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load posts');
    }
  };

  const refreshPosts = async () => {
    try {
      setRefreshing(true);
      limit = 4;
      const res = await fetchUserPosts(requesterId, limit);
      if (res.success) {
        setPosts(res.data);
        setHasMore(res.data.length >= limit);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh posts');
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced loading screen with the same background color
  if (isLoading) {
    return (
      <ScreenWrapper bg="#303030">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.themeGreen} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Error screen with the same background color
  if (!user) {
    return (
      <ScreenWrapper bg="#303030">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User profile not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg="#303030">
      <FlatList
        ListHeaderComponent={<UserHeader user={user} />}
        ListHeaderComponentStyle={{ marginBottom: hp(5) }}
        data={posts}
        refreshing={Boolean(refreshing)}
        onRefresh={refreshPosts}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listStyle,
          platformSpacing,
          { paddingHorizontal: wp(4) },
        ]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
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
          <View style={{ marginVertical: posts.length === 0 ? hp(10) : hp(3) }}>
            <Loading />
          </View>
        ) : (
          <View style={{ marginVertical: hp(3) }} />
        )}
      />
    </ScreenWrapper>
  );
};

const UserHeader = ({ user }) => {
  const getFullCountryName = (countryCode) => {
    const country = COUNTRIES.find((c) => c.value === countryCode);
    return country ? country.label : countryCode;
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.headContainer}>
        <Head title="Profile" mb={hp(3)} showBackButton={true} />
      </View>

      <View style={styles.container}>
        <View style={styles.profileContentWrapper}>
          <View style={styles.avatarContainer}>
            <Avatar uri={user?.image} size={hp(20)} rounded={theme.radius.xxxl} />
          </View>

          {/* User Details */}
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{user?.user_name}</Text>
            <Text style={styles.infoText}>{getFullCountryName(user.country)}</Text>
          </View>

          {/* Bio Section */}
          {user?.bio && <Text style={styles.infoText3}>{user.bio}</Text>}

          {/* User Information Section */}
          <View style={styles.infoContainer}>
            <View style={styles.info}>
              <Icon name="gender" size={wp(5)} color="#d1d1d1" />
              <Text style={styles.infoText2}>{user?.gender}</Text>
            </View>
            <View style={styles.info}>
              <Icon name="cake" size={wp(5)} color="#d1d1d1" />
              <Text style={styles.infoText2}>{user?.date_of_birth}</Text>
            </View>
            <View style={styles.info}>
              <Icon name="conName" size={wp(5)} color="#d1d1d1" />
              <Text style={styles.infoText2}>{user?.full_name}</Text>
            </View>
            <View style={styles.info}>
              <Icon name="mail" size={wp(5)} color="#d1d1d1" />
              <Text style={styles.infoText2} numberOfLines={1} ellipsizeMode="tail">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#303030',
  },
  loadingText: {
    color: '#E0E0E0',
    fontSize: hp(2),
    marginTop: hp(2),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#303030',
  },
  errorText: {
    color: '#E0E0E0',
    fontSize: hp(2),
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

export default ViewProfile;