import { StyleSheet, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'
import Avatar from '../components/Avatar'
import moment from 'moment'
import { TouchableOpacity } from 'react-native'
import Icon from '../assets/icons'
import RenderHTML from 'react-native-render-html'
import { Image } from 'expo-image'
import { getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av'
import { LOCATIONS } from '../constants/info'
import { supabase } from '../lib/supabase'

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
}) => {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        checkWishlistStatus();
    }, [item?.locationId, currentUser?.location_wishlist]);

    const checkWishlistStatus = () => {
        if (!item?.locationId || !currentUser?.location_wishlist) {
            setIsInWishlist(false);
            return;
        }

        const locationIdString = item.locationId.toString();
        const wishlistArray = currentUser.location_wishlist.split(',').filter(id => id.trim() !== '');
        
        console.log('Location ID:', locationIdString);
        console.log('Wishlist array:', wishlistArray);
        console.log('Is in wishlist?', wishlistArray.includes(locationIdString));
        
        setIsInWishlist(wishlistArray.includes(locationIdString));
    };

    const openPostDetails = () => {
        //Dummy
    }

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
            console.error("Failed to update wishlist:", error);
            return false;
        }
    };

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
                    console.log('Adding to wishlist:', locationIdString);
                } else {
                    newWishlist = [...currentWishlist];
                }
            }
            
           
            const newWishlistString = newWishlist.join(',');
            console.log('New wishlist string:', newWishlistString);
            
            const success = await updateWishlist(newWishlistString);
            
            if (success) {
                
                setIsInWishlist(!isInWishlist);
                console.log('Updated isInWishlist to:', !isInWishlist);
                
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
        } catch (error) {
            console.error("Error toggling wishlist:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const createdAt = moment(item?.created_at).format('MMM D');
    const likes = [];
    const liked = false;
    
    const wishlistIconColor = 'white';
    
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

                <TouchableOpacity onPress={openPostDetails}>
                    <Icon name='more' size={hp(3.4)} />
                </TouchableOpacity>
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
                    item?.file && item?.file?.includes('postImages') && (
                        <View style={styles.mediaContainer}>
                            <View style={styles.mediaWrapper}>
                                <Image source={getSupabaseFileUrl(item?.file)} transition={100} style={styles.postMedia} contentFit='cover'/>
                            </View>
                        </View>
                    )
                }

                {/* post video */}
                {
                    item?.file && item?.file?.includes('postVideos') && (
                        <View style={styles.mediaContainer}>
                            <View style={styles.mediaWrapper}>
                                <Video style={[styles.postMedia, {height: hp(30)}]} source={getSupabaseFileUrl(item.file)} useNativeControls resizeMode='cover' isLooping />
                            </View>
                        </View>
                    )
                }
            </View>

            {/* Like,comment & share */}
            <View style={styles.footer}>
                <View style={styles.footerButton}>
                    <TouchableOpacity>
                        <Icon name='heart' size={24} fill={liked? "red" : 'transparent'} color={liked? "red" : theme.colors.textDark}/>
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            likes?.length
                        }
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity>
                        <Icon name='comment' size={24} color={theme.colors.textDark}/>
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            0
                        }
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity>
                        <Icon name='share4' size={25} color={theme.colors.textDark}/>
                    </TouchableOpacity>
                </View>
                
                {/* Location Wishlist Button - Only shown if post has a location */}
                {item?.locationId && (
                    <View style={[styles.footerButton, styles.wishlistButton]}>
                        <TouchableOpacity onPress={handleWishlistToggle} disabled={isUpdating}>
                            <Icon 
                                name="bookmark"
                                size={25} 
                                color={wishlistIconColor}
                                fill={isInWishlist ? wishlistIconColor : 'transparent'}
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
        gap: 10,
        marginBottom: 25,
        padding: 10,
        paddingVertical: 2,
        paddingBottom: 20,
        paddingTop: 20,
        backgroundColor: '#353535',
        borderRadius: theme.radius.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    userName: {
        color: theme.colors.textWhite,
        fontWeight: theme.fonts.medium,
    },
    postTime: {
        fontSize: hp(1.4),
        color: theme.colors.shadowcolor,
        fontWeight: theme.fonts.medium,
    },
    content: {
        gap: 10,
    },
    mediaContainer: {
        marginHorizontal: -10,
        width: wp(100),
        alignSelf: 'center',
        paddingHorizontal: wp(4),
    },
    mediaWrapper: {
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        overflow: 'hidden',
    },
    postMedia: {
        height: hp(40),
        width: '100%',
    },
    postBody: {
        marginLeft: 5,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    footerButton: {
        marginLeft: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    wishlistButton: {
        marginLeft: 'auto',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
    },
    count: {
        color: theme.colors.textWhite,
        fontSize: hp(1.8)
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: hp(1.4),
        color: theme.colors.shadowcolor,
        fontWeight: theme.fonts.medium,
    },
    locationContainer2: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
    }
})