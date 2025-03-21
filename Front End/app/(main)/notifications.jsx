import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { fetchNotifications } from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useRouter } from 'expo-router';
import NotificationItem from '../../components/NotificationItem';
import Head from '../../components/Head';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const {user} = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
      getNotifications();
    }, []);

    const getNotifications = async () => {
      let res = await fetchNotifications(user.id);
      if(res.success) setNotifications(res.data);
    }

    const platformSpacing = {
      paddingBottom: Platform.select({
        ios: Math.max(insets.bottom, hp(2)),
        android: Math.max(insets.bottom, hp(2)),
      }),
    };

    return (
      <ScreenWrapper bg="#303030">
        <View style={styles.container}>
          <Head title='Notifications'/>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={[
              styles.listStyle,
              platformSpacing
            ]}
          >
            {
              notifications.length > 0 ? (
                notifications.map(item => (
                  <NotificationItem item={item} key={item?.id} router={router}/>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.noData}>You don't have any notifications</Text>
                </View>
              )
            }
          </ScrollView>
        </View>
      </ScreenWrapper>
    )
}

export default Notifications

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  listStyle: {
    paddingTop: hp(2),
    paddingBottom: hp(2),
    gap: hp(1.2),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: hp(30),
  },
  noData: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.textWhite,
    textAlign: 'center',
    paddingHorizontal: wp(4),
  }
})