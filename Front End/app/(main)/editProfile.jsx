import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
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
import * as ImagePicker from 'expo-image-picker';

const EditProfile = () => {

    const {user: currentUser, setUserData} = useAuth();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [user, setUser] = useState({
        user_name: '',
        full_name: '',
        image: null,
        bio: '',
        address: ''
    });

    useEffect(()=>{
        if(currentUser){
            setUser({
                user_name: currentUser.user_name || '',
                full_name: currentUser.full_name || '',
                image: currentUser.image || null,
                address: currentUser.address || '',
                bio: currentUser.bio || '',
            });
        }
    },[currentUser])

    const onPickImage = async ()=>{
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setUser({...user, image: result.assets[0]});
        }

    }

    const onSubmit = async () => {
        let userData = {...user};
        let {user_name, full_name, address, image, bio} = userData;
        if(!user_name || !full_name) {
            Alert.alert('Profile','You must have a user name and a full name');
            return;
        }
        setLoading(true);
    
        if(typeof image == 'object'){
            console.log('Uploading image:', image);
            let imageRes = await uploadFile('profiles', image?.uri, true);
            console.log('Image upload result:', imageRes);
            if(imageRes.success) {
                userData.image = imageRes.data;
                console.log('Image path saved:', imageRes.data);
            }
            else {
                Alert.alert('Upload Error', imageRes.msg || 'Failed to upload image');
                userData.image = null;
            }
        }
        
        console.log('Updating user with data:', userData);
        const res = await updateUser(currentUser?.id, userData)
        setLoading(false);
    
        if(res.success){
            setUserData({...currentUser, ...userData});
            router.back();
        } else {
            Alert.alert('Update Error', res.msg || 'Failed to update profile');
        }
    }

    let imageSource = user.image && typeof user.image == 'object'? user.image.uri : getUserImageSrc(user.image);
  return (
    <ScreenWrapper bg="#303030">
      <View style={styles.container}>
        <ScrollView style={{flex: 1}}>
            <Head title='Edit Profile'/>

            {/* form */}
            <View style={styles.form}>
                <View style={styles.avatarContainer}>
                    <Image source={imageSource} style={styles.avatar}/>
                    <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                        <Icon name='camera' size={20} strokeWidth={2.5}/>
                    </Pressable>
                </View>
                <View style={styles.formInputs}>
                    <View>
                        <Text style={styles.label}>User Name</Text>
                        <Input icon={<Icon name='user'/>} placeholder='Enter your new user name' value={user.user_name} onChangeText={(value)=> setUser({...user, user_name: value})}/>
                    </View>

                    <View>
                        <Text style={styles.label}>Full Name</Text>
                        <Input icon={<Icon name='conName'/>} placeholder='Enter your full name' value={user.full_name} onChangeText={(value)=> setUser({...user, full_name: value})}/>
                    </View>

                    <View>
                        <Text style={styles.label}>Address</Text>
                        <Input icon={<Icon name='location'/>} placeholder='Enter your current Address' value={user.address} onChangeText={(value)=> setUser({...user, address: value})}/>
                    </View>

                    <View>
                        <Text style={styles.label}>Bio</Text>
                        <Input placeholder='Enter your Bio' value={user.bio} multiline={true} containerStyle={styles.bio} onChangeText={(value)=> setUser({...user, bio: value})}/>
                    </View>
                </View>

                <Button title='Update' loading={loading} onPress={onSubmit} />
            </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default EditProfile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    avatarContainer: {
        height: hp(14),
        width: hp(14),
        alignSelf: 'center',
    },
    label: {
        fontSize: hp(1.5),
        color: theme.colors.textWhite,
        marginBottom: hp(0.75)
      },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: theme.radius.xxxl,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.colors.darkLight,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: -10,
        padding: 8,
        borderRadius: 50,
        backgroundColor: '#424242',
        shadowColor: 'black',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7,
    },
    form: {
        gap: 18,
        marginTop: 20,
    },
    input: {
        flexDirection: 'row',
        borderWidth: 0.4,
        borderColor: theme.colors.textWhite,
        borderRadius: theme.radius.xxl,
        borderCurve: 'continuous',
        padding: 17,
        paddingHorizontal: 20,
        gap: 15,
    },
    bio: {
        flexDirection: 'row',
        height: hp(15),
        alignItems: 'flex-start',
        paddingVertical: 15,
    },
    formInputs: {
        gap: 15,
    }
})