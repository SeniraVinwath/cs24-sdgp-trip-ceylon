import { Alert, Platform, Share, StyleSheet, Text, View, ToastAndroid } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { theme } from '../constants/theme'
import { hp, stripHtmlTags, wp } from '../helpers/common'
import Avatar from '../components/Avatar'
import moment from 'moment'
import { TouchableOpacity } from 'react-native'
import Icon from '../assets/icons'
import RenderHTML from 'react-native-render-html'
import { Image } from 'expo-image'
import { downloadFile, getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av'
import { LOCATIONS } from '../constants/info'
import { supabase } from '../lib/supabase'
import { createPostLike, removePostLike } from '../services/postService'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Loading from './Loading'
import NetInfo from '@react-native-community/netinfo'; // You'll need to install this package

const textStyle = {
    color: theme.colors.textDark2,
    fontSize: hp(1.75)
};
const tagsStyles = {
    div: textStyle,
    p: textStyle,
    ol: textStyle,
    h2: {
        color: theme.colors.textWhite
    },
    h4: {
        color: theme.colors.textWhite
    }
}

const PostCard = ({
    item,
    currentUser,
    router,
    onWishlistUpdate,
    refreshPosts,
    showMoreIcon = true,
    showDelete = false,
    onDelete=()=>{},
    onEdit=()=>{}
}) => {

    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [likes, setLikes] = useState([]);
    const [likeLoading, setLikeLoading] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);
    const [videoError, setVideoError] = useState(null);
    const [isConnected, setIsConnected] = useState(true);
    const videoRef = useRef(null);

    useEffect(() => {
        checkWishlistStatus();
        
        // Subscribe to network connectivity changes
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });
        
        return () => {
            unsubscribe();
            // Unload video when component unmounts
            if (videoRef.current) {
                videoRef.current.unloadAsync();
            }
        };
    }, [item?.locationId, currentUser?.location_wishlist]);

    useEffect(() => {
        setLikes(item?.postLikes || []);
    }, [item?.postLikes]);

    const checkWishlistStatus = () => {
        if (!item?.locationId || !currentUser?.location_wishlist) {
            setIsInWishlist(false);
            return;
        }

        const locationIdString = item.locationId.toString();
        const wishlistArray = currentUser.location_wishlist.split(',').filter(id => id.trim() !== '');
        
        setIsInWishlist(wishlistArray.includes(locationIdString));
    };

    const openPostDetails = () => {
        if(!showMoreIcon) return null;
        router.push({pathname: 'postDetails', params: {postId: item?.id}})
    }

    const onLike = async () => {
        if(!currentUser?.id) return;
        
        try {
            setLikeLoading(true);
            if(item?.userLiked) {
                await removePostLike(item?.id, currentUser?.id);
            } else {
                await createPostLike({ 
                    userId: currentUser?.id, 
                    postId: item?.id 
                });
            }
        } catch (error) {
            Alert.alert('Error', 'Could not update like');
        } finally {
            setLikeLoading(false);
            refreshPosts();
        }
    }

    const onShare = async () => {
        try {
            const message = stripHtmlTags(item?.body);

            setShareLoading(true);
            if (!item?.file) {
                await Share.share({ message });
                setShareLoading(false);
                return;
            }

            const fileUrl = getSupabaseFileUrl(item?.file).uri;
            const localUrl = await downloadFile(fileUrl);
            
            if (!localUrl || !(await FileSystem.getInfoAsync(localUrl)).exists) {
                await Share.share({ message });
                setShareLoading(false);
                return;
            }

            setShareLoading(false);

            // Determine file type for proper MIME type
            const isVideo = checkIfVideo(item?.file);
            const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
            const uti = isVideo ? 'public.movie' : 'public.image';

            if (Platform.OS === 'android') {
                await Clipboard.setStringAsync(message);
                
                ToastAndroid.show('Text copied to clipboard! Paste after selecting app.', ToastAndroid.LONG);
                
                await Sharing.shareAsync(localUrl, {
                    mimeType: mimeType,
                    UTI: uti,
                });
            } else {
                await Sharing.shareAsync(localUrl, {
                    mimeType: mimeType,
                    UTI: uti,
                    dialogTitle: message
                });
            }
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Share Error', 'Could not share this post. Please try again.');
            setShareLoading(false);
        }
    };

    const getLocationName = (locationId) => {
        const location = LOCATIONS.find(loc => loc.id === parseInt(locationId));
        return location ? location.name : locationId;
    }

    const updateWishlist = async (newWishlistString) => {
        if (!currentUser?.id) return false;
        
        try {
            const { error } = await supabase
                .from('travelers')
                .update({ location_wishlist: newWishlistString })
                .eq('id', currentUser.id);
                
            if (error) throw error;
            return true;
        } catch (error) {
            return false;
        }
    };

    const handlePostDelete = () => {
        Alert.alert('Confirm', "Are you sure you want to delete this post?", [
            {
                text: 'Cancel',
                onPress: () => console.log('modal cancelled'),
                style: 'cancel'
            },
            {
                text: 'Delete',
                onPress: () => onDelete(item),
                style: 'destructive'
            }
        ])
    }

    const handleWishlistToggle = async () => {
        if (!item?.locationId || !currentUser || isUpdating) return;

        try {
            setIsUpdating(true);
            
            const currentWishlist = currentUser.location_wishlist ? 
                currentUser.location_wishlist.split(',').filter(id => id.trim() !== '') : [];
            
            const locationIdString = item.locationId.toString();
            
            let newWishlist;
            if (isInWishlist) {
                newWishlist = currentWishlist.filter(id => id !== locationIdString);
                console.log('Removing from wishlist:', locationIdString);
            } else {
                if (!currentWishlist.includes(locationIdString)) {
                    newWishlist = [...currentWishlist, locationIdString];
                } else {
                    newWishlist = [...currentWishlist];
                }
            }
            
            const newWishlistString = newWishlist.join(',');
            
            const success = await updateWishlist(newWishlistString);
            
            if (success) {
                setIsInWishlist(!isInWishlist);
                
                if (currentUser) {
                    currentUser.location_wishlist = newWishlistString;
                }
                
                if (onWishlistUpdate) {
                    onWishlistUpdate({
                        userId: currentUser.id,
                        newWishlist: newWishlistString
                    });
                }
            }
        } finally {
            setIsUpdating(false);
        }
    };

    // Check if file is a video based on path or extension
    const checkIfVideo = (filePath) => {
        if (!filePath) return false;
        
        // Check by folder path
        if (filePath.includes('postVideos')) return true;
        
        // Check by extension
        const lowerFilePath = filePath.toLowerCase();
        return lowerFilePath.endsWith('.mp4') || 
               lowerFilePath.endsWith('.mov') || 
               lowerFilePath.endsWith('.avi') || 
               lowerFilePath.endsWith('.webm');
    };

    // Handle video error
    const handleVideoError = (error) => {
        console.error('Video playback error:', error);
        setVideoError(error);
    };

    // Retry loading video
    const retryVideoLoad = async () => {
        setVideoError(null);
        if (videoRef.current) {
            try {
                await videoRef.current.unloadAsync();
                await videoRef.current.loadAsync(getSupabaseFileUrl(item.file));
            } catch (error) {
                console.error('Error reloading video:', error);
                setVideoError(error);
            }
        }
    };

    const createdAt = moment(item?.created_at).format('MMM D');
    const liked = likes?.filter(like => like.userId === currentUser?.id)[0]? true: false;
    const isVideo = checkIfVideo(item?.file);
    
    return (
        <View style={[styles.container]}>
            <View style={styles.header}>
                {/* user info, location and post time */}
                <View style={styles.userInfo}>
                    <Avatar size={hp(4.5)} uri={item?.traveler?.image} rounded={theme.radius.md} />
                    <View style={{gap: 2}}>
                        <Text style={styles.userName}>{item?.traveler?.user_name}</Text>
                        <View style={styles.locationContainer}>
                            <Text style={styles.postTime}>{createdAt}</Text>
                            {item?.locationId && (
                                <>
                                    <View style={{width: 8}} />
                                    <TouchableOpacity onPress={() => router.push("location")} style={styles.locationContainer2}>
                                        <Icon name='globe' size={hp(1.8)} color={theme.colors.shadowcolor} />
                                        <Text style={styles.locationText}>{getLocationName(item.locationId)}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {
                    showMoreIcon && (
                        <TouchableOpacity onPress={openPostDetails}>
                            <Icon name='more' size={hp(3.4)} />
                        </TouchableOpacity>
                    )
                }

                {
                    showDelete && currentUser.id == item?.userId && (
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => onEdit(item)}>
                                <Icon name='edit' size={hp(2)} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handlePostDelete}>
                                <Icon name='delete' size={hp(2.2)} color={theme.colors.roseLight} />
                            </TouchableOpacity>
                        </View>
                    )
                }
            </View>

            {/* post body & media */}
            <View style={styles.content}>
                <View style={styles.postBody}>
                    {
                        item?.body && (
                            <RenderHTML contentWidth={wp(100)} source={{html: item?.body}} tagsStyles={tagsStyles} />
                        )
                    }
                </View>

                {/* Media Image */}
                {
                    item?.file && !isVideo && (
                        <View style={styles.mediaContainer}>
                            <View style={styles.mediaWrapper}>
                                <Image 
                                    source={getSupabaseFileUrl(item?.file)} 
                                    transition={100} 
                                    style={styles.postMedia} 
                                    contentFit='cover'
                                />
                            </View>
                        </View>
                    )
                }

                {/* post video */}
                {
                    item?.file && isVideo && (
                        <View style={styles.mediaContainer}>
                            <View style={styles.mediaWrapper}>
                                {!isConnected ? (
                                    <View style={[styles.postMedia, styles.videoErrorContainer]}>
                                        <Text style={styles.videoErrorText}>
                                            Video unavailable offline
                                        </Text>
                                    </View>
                                ) : videoError ? (
                                    <TouchableOpacity 
                                        style={[styles.postMedia, styles.videoErrorContainer]} 
                                        onPress={retryVideoLoad}
                                    >
                                        <Text style={styles.videoErrorText}>
                                            Video failed to load. Tap to retry.
                                        </Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Video 
                                        ref={videoRef}
                                        style={[styles.postMedia, {height: hp(30)}]} 
                                        source={getSupabaseFileUrl(item.file)} 
                                        useNativeControls 
                                        resizeMode='cover' 
                                        isLooping
                                        shouldPlay={false}
                                        onError={handleVideoError}
                                        progressUpdateIntervalMillis={500}
                                        // Higher quality on iOS, lower on Android for better compatibility
                                        rate={1.0}
                                        volume={1.0}
                                    />
                                )}
                            </View>
                        </View>
                    )
                }
            </View>

            {/* Like,comment & share */}
            <View style={styles.footer}>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={onLike} disabled={likeLoading}>
                        {likeLoading ? (
                            <Loading size="small" />
                        ) : (
                            <Icon name='heart' size={24} 
                                fill={item?.userLiked ? "red" : 'transparent'} 
                                color={item?.userLiked ? "red" : theme.colors.textDark}/>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.count}>{item?.likeCount || 0}</Text>
                </View>
                
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={openPostDetails}>
                        <Icon name='comment' size={24} color={theme.colors.textDark}/>
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            item?.commentCount
                        }
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    {
                        shareLoading ? (
                            <Loading size="small" />
                        ) : (
                            <TouchableOpacity onPress={onShare}>
                                <Icon name='share4' size={25} color={theme.colors.textDark}/>
                            </TouchableOpacity>
                        )
                    }
                </View>
                
                {/* Location Wishlist Button - Only shown if post has a location */}
                {item?.locationId && (
                    <View style={[styles.footerButton, styles.wishlistButton]}>
                        <TouchableOpacity onPress={handleWishlistToggle} disabled={isUpdating}>
                            <Icon 
                                name="bookmark"
                                size={25} 
                                color='white'
                                fill={isInWishlist ? 'white' : 'transparent'}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    )
}

export default PostCard

const styles = StyleSheet.create({
    container: {
        gap: 12,
        marginBottom: 25,
        padding: 15,
        paddingVertical: 20,
        backgroundColor: '#2A2A2A',
        borderRadius: theme.radius.xxl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    userName: {
        color: theme.colors.textWhite,
        fontWeight: theme.fonts.semibold,
        fontSize: hp(2),
        letterSpacing: 0.3,
    },
    postTime: {
        fontSize: hp(1.5),
        color: theme.colors.shadowcolor,
        fontWeight: theme.fonts.medium,
    },
    content: {
        gap: 12,
    },
    mediaContainer: {
        marginHorizontal: -15,
        width: wp(100),
        alignSelf: 'center',
        paddingHorizontal: wp(4),
    },
    mediaWrapper: {
        borderRadius: theme.radius.xxl,
        borderCurve: 'continuous',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    postMedia: {
        height: hp(40),
        width: '100%',
        backgroundColor: '#1A1A1A',
    },
    videoErrorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: hp(30),
    },
    videoErrorText: {
        color: theme.colors.textWhite,
        textAlign: 'center',
        padding: 20,
        fontSize: hp(1.8),
    },
    postBody: {
        marginLeft: 5,
        paddingVertical: 5,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    wishlistButton: {
        marginLeft: 'auto',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    count: {
        color: theme.colors.textWhite,
        fontSize: hp(1.9),
        fontWeight: theme.fonts.medium,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: hp(1.5),
        color: theme.colors.shadowcolor,
        fontWeight: theme.fonts.semibold,
    },
    locationContainer2: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: theme.radius.sm,
    },
    moreButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.radius.sm,
    },
    actionButton: {
        padding: 5,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.radius.sm,
    },
    iconButton: {
        padding: 5,
        borderRadius: theme.radius.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
});