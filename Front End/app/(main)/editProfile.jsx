import { Alert, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Head from '../../components/Head'
import { Image } from 'expo-image'
import { useAuth } from '../../contexts/AuthContext'
import { getUserImageSrc, uploadFile } from '../../services/imageService'
import Icon from '../../assets/icons'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { updateUser } from '../../services/userService'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const EditProfile = () => {
    const { user: currentUser, setUserData } = useAuth()
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const insets = useSafeAreaInsets()

    const [user, setUser] = useState({
        user_name: '',
        full_name: '',
        image: null,
        bio: '',
        address: ''
    })

    const horizontalPadding = wp(5)

    const platformSpacing = {
        paddingBottom: Platform.select({
            ios: Math.max(insets.bottom, hp(2)),
            android: Math.max(insets.bottom, hp(2)),
        }),
    }

    useEffect(() => {
        if (currentUser) {
            setUser({
                user_name: currentUser.user_name || '',
                full_name: currentUser.full_name || '',
                image: currentUser.image || null,
                address: currentUser.address || '',
                bio: currentUser.bio || '',
            })
        }
    }, [currentUser])

    const onPickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        })

        if (!result.canceled) {
            setUser({ ...user, image: result.assets[0] })
        }
    }

    const onSubmit = async () => {
        let userData = { ...user }
        let { user_name, full_name, address, image, bio } = userData
        if (!user_name || !full_name) {
            Alert.alert('Profile', 'You must have a user name and a full name')
            return
        }
        setLoading(true)

        if (typeof image == 'object') {
            console.log('Uploading image:', image)
            let imageRes = await uploadFile('profiles', image?.uri, true)
            if (imageRes.success) {
                userData.image = imageRes.data
            }
            else {
                Alert.alert('Upload Error', imageRes.msg || 'Failed to upload image')
                userData.image = null
            }
        }

        const res = await updateUser(currentUser?.id, userData)
        setLoading(false)

        if (res.success) {
            setUserData({ ...currentUser, ...userData })
            router.back()
        } else {
            Alert.alert('Update Error', res.msg || 'Failed to update profile')
        }
    }

    let imageSource = user.image && typeof user.image == 'object' ? user.image.uri : getUserImageSrc(user.image)
    
    return (
        <ScreenWrapper bg="#303030">
            <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
                <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollViewContent,
                        { paddingBottom: hp(12) }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <Head title='Edit Profile' />

                    {/* form */}
                    <View style={styles.form}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={imageSource}
                                style={styles.avatar}
                                contentFit="cover"
                            />
                            <Pressable 
                                style={styles.cameraIcon} 
                                onPress={onPickImage}
                                hitSlop={{ top: hp(1), bottom: hp(1), left: wp(1), right: wp(1) }}
                            >
                                <Icon name='camera' size={hp(2.5)} strokeWidth={2.5} />
                            </Pressable>
                        </View>
                        
                        <View style={styles.formInputs}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>User Name</Text>
                                <Input
                                    icon={<Icon name='user' size={hp(2.2)} />}
                                    placeholder='Enter your new user name'
                                    value={user.user_name}
                                    onChangeText={(value) => setUser({ ...user, user_name: value })}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <Input
                                    icon={<Icon name='conName' size={hp(2.2)} />}
                                    placeholder='Enter your full name'
                                    value={user.full_name}
                                    onChangeText={(value) => setUser({ ...user, full_name: value })}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Address</Text>
                                <Input
                                    icon={<Icon name='location' size={hp(2.2)} />}
                                    placeholder='Enter your current Address'
                                    value={user.address}
                                    onChangeText={(value) => setUser({ ...user, address: value })}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Bio</Text>
                                <Input
                                    placeholder='Enter your Bio'
                                    value={user.bio}
                                    multiline={true}
                                    containerStyle={styles.bio}
                                    onChangeText={(value) => setUser({ ...user, bio: value })}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
                
                {/* button at bottom */}
                <View style={[
                    styles.buttonContainer, 
                    platformSpacing,
                    { paddingHorizontal: horizontalPadding }
                ]}>
                    <Button title='Update' loading={loading} onPress={onSubmit} />
                </View>
            </View>
        </ScreenWrapper>
    )
}

export default EditProfile

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    avatarContainer: {
        height: hp(14),
        width: hp(14),
        alignSelf: 'center',
        marginVertical: hp(2.5),
    },
    label: {
        fontSize: hp(1.8),
        color: theme.colors.textWhite,
        marginBottom: hp(0.75),
        fontWeight: '500',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: hp(7),
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.colors.darkLight,
        backgroundColor: '#424242',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: -wp(2),
        padding: hp(1),
        borderRadius: hp(2.5),
        backgroundColor: '#424242',
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7,
    },
    form: {
        marginTop: hp(1),
        marginBottom: hp(2),
    },
    formInputs: {
        gap: hp(1.5),
    },
    inputContainer: {
        marginBottom: hp(1.5),
    },
    bio: {
        flexDirection: 'row',
        height: hp(15),
        alignItems: 'flex-start',
        paddingVertical: hp(1.5),
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#303030',
        paddingTop: hp(1.5),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 8,
    }
})