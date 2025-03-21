import { StyleSheet, Text, View, Animated, Pressable } from 'react-native';
import React, { useRef, useEffect } from 'react';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import Avatar from './Avatar';
import moment from 'moment';

const NotificationItem = ({ item, router }) => {
  const translateXValue = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    Animated.timing(translateXValue, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClick = () => {
    let { postId, commentId } = JSON.parse(item?.data);
    router.push({ pathname: 'postDetails', params: { postId, commentId } });
  };

  const createdAt = moment(item?.created_at).format('MMM d');

  return (
    <Pressable onPress={handleClick} style={({ pressed }) => [ styles.container,pressed && { opacity: 0.7 },]} android_ripple={{ color: 'transparent' }}>
        <Animated.View style={{ transform: [{ translateX: translateXValue }] }}>
            <View style={styles.innerContainer}>
                <Avatar uri={item?.sender?.image} size={hp(5)} />
                <View style={styles.nameTitle}>
                    <Text style={[styles.text, { fontWeight: 'bold' }]}>
                        {item?.sender?.user_name}
                    </Text>
                    <Text style={[styles.text, { color: theme.colors.textWhite }]}>
                        {item?.title}
                    </Text>
                </View>
                <Text style={[styles.text, { color: theme.colors.darkLight }]}>
                    {createdAt}
                </Text>
            </View>
        </Animated.View>
    </Pressable>
  );
};

export default NotificationItem;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: theme.radius.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nameTitle: {
    flex: 1,
    gap: 2,
  },
  text: {
    fontSize: hp(1.6),
    color: theme.colors.textDark2,
  },
});