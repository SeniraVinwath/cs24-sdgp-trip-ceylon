import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Head from '../../components/Head'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import RichTextEditor from '../../components/RichTextEditor'
import { useRouter } from 'expo-router'
import Icon from '../../assets/icons'
import Button from '../../components/Button'
import * as ImagePicker from 'expo-image-picker'
import { getSupabaseFileUrl } from '../../services/imageService'
import { Video } from 'expo-av'
import { createOrUpdatePost } from '../../services/postService'
import { LOCATIONS } from '../../constants/info'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const NewPost = () => {
    const { user } = useAuth();
    const bodyref = useRef("");
    const editorRef = useRef(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [locationId, setLocationId] = useState(null);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const insets = useSafeAreaInsets();

    const platformSpacing = {
      paddingBottom: Platform.select({
        ios: Math.max(insets.bottom, hp(2)),
        android: Math.max(insets.bottom, hp(2)),
      }),
    };

    const onPick = async (isImage) => {
      let mediaConfig = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      }
      if(!isImage){
        mediaConfig = {
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
        }
      }

      let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

      if(!result.canceled){
        setFile(result.assets[0]);
      }
    }

    const isLocalFile = file => {
      if(!file) return null;
      if(typeof file == 'object') return true;

      return false;
    }

    const getFileType = file => {
      if(!file) return null;
      if(isLocalFile(file)){
        return file.type;
      }

      //check remote
      if(file.includes('postImages')){
        return 'image';
      }

      return 'video';
    }

    const getFileUri = file => {
      if(!file) return null;
      if(isLocalFile(file)){
        return file.uri;
      }

      return getSupabaseFileUrl(file)?.uri;
    }

    const toggleLocationPicker = () => {
      setShowLocationPicker(!showLocationPicker);
    }

    const getSelectedLocationName = () => {
      if (!locationId) return "Add Location";
      const location = LOCATIONS.find(loc => loc.id === locationId);
      return location ? location.name : "Add Location";
    }

    const selectLocation = (locId) => {
      setLocationId(locId);
      setShowLocationPicker(false);
    }

    const handleRemoveFile = () => {
      setFile(null);
    }

    const onSubmit = async () => {
      if(!bodyref.current && !file){
        Alert.alert('Post', "Please add a media file or a Message")
        return;
      }

      let data = {
        file,
        body: bodyref.current,
        userid: user?.id,
        locationid: locationId
      }

      //create post
      setLoading(true);
      let res = await createOrUpdatePost(data);
      setLoading(false);
      if(res.success){
        setFile(null);
        setLocationId(null);
        bodyref.current = '';
        editorRef.current?.setContentHTML('');
        router.back();
      }else{
        Alert.alert('Post', res.msg);
      }
    }

  return (
    <ScreenWrapper bg="#303030">
      <View style={[styles.container, platformSpacing]}>
        <Head title='Create Post'/>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
          overScrollMode={Platform.OS === 'android' ? 'never' : undefined}
        >
          {/* avatar */}
          <View style={styles.header}>
            <Avatar uri={user?.image} size={hp(6)} rounded={theme.radius.xl}/>
            <View style={styles.userInfoContainer}>
              <Text style={styles.username}>
                {user && user.user_name}
              </Text>
              <Text style={styles.publicText}>
                Public
              </Text>
            </View>
          </View>

          <View style={styles.textEditor}>
            <RichTextEditor editorRef={editorRef} onChange={body=> bodyref.current = body}/>
          </View>

          {/* Location selector button */}
          <TouchableOpacity 
            style={styles.locationSelector} 
            onPress={toggleLocationPicker}
            activeOpacity={0.7}
          >
            <Icon name="location" size={wp(5.5)} />
            <Text style={styles.locationText}>
              {getSelectedLocationName()}
            </Text>
            <Icon name="arrowDown" size={wp(4.5)} />
          </TouchableOpacity>

          {
            file && (
              <View style={styles.file}>
                {
                  getFileType(file) == 'video' ? (
                    <Video 
                      style={styles.mediaContent} 
                      source={{uri: getFileUri(file)}} 
                      useNativeControls 
                      resizeMode='cover' 
                      isLooping
                    />
                  ):(
                    <Image 
                      source={{uri: getFileUri(file)}} 
                      resizeMode='cover' 
                      style={styles.mediaContent}
                    />
                  )
                }

                <Pressable 
                  style={styles.closeIcon} 
                  onPress={handleRemoveFile}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Icon name='delete' size={wp(5.5)} />
                </Pressable>
              </View>
            )
          }

          {/* Only show media selector when no file is selected */}
          {!file && (
            <View style={styles.media}>
              <Text style={styles.addImageText}>Photo / Video</Text>
              <View style={styles.mediaIcons}>
                <TouchableOpacity 
                  onPress={()=> onPick(true)}
                  style={styles.mediaIconButton}
                  activeOpacity={0.7}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Icon name="image" size={wp(7.5)} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={()=> onPick(false)}
                  style={styles.mediaIconButton}
                  activeOpacity={0.7}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Icon name="video" size={wp(8)} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button 
            buttonStyle={styles.postButton} 
            title='Post' 
            loading={loading} 
            hasshadow={false} 
            onPress={onSubmit}
          />
        </View>
      </View>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationPicker(false)}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity 
                onPress={() => setShowLocationPicker(false)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Icon name="delete" size={wp(6)} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.locationList}
              showsVerticalScrollIndicator={false}
              bounces={Platform.OS === 'ios'}
              overScrollMode={Platform.OS === 'android' ? 'never' : undefined}
            >
              <TouchableOpacity 
                style={[
                  styles.locationItem,
                  locationId === null && styles.selectedLocation
                ]}
                onPress={() => selectLocation(null)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.locationItemText,
                  locationId === null && styles.selectedLocationText
                ]}>
                  No Location
                </Text>
              </TouchableOpacity>
              
              {LOCATIONS.map(location => (
                <TouchableOpacity 
                  key={location.id}
                  style={[
                    styles.locationItem,
                    locationId === location.id && styles.selectedLocation
                  ]}
                  onPress={() => selectLocation(location.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.locationItemText,
                    locationId === location.id && styles.selectedLocationText
                  ]}>
                    {location.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

export default NewPost

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    gap: hp(1.5),
  },
  scrollContent: {
    paddingTop: hp(1),
    paddingBottom: hp(2),
    gap: hp(2),
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textWhite,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  userInfoContainer: {
    gap: hp(0.5),
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textWhite,
  },
  publicText: {
    fontSize: hp(1.7),
    fontWeight: theme.fonts.medium,
    color: '#c3c2c2',
  },
  textEditor: {
    width: '100%',
  },
  media: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: hp(1.5),
    paddingHorizontal: wp(4.5),
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderColor: theme.colors.darkLight,
  },
  mediaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3.5),
  },
  mediaIconButton: {
    padding: wp(1),
  },
  addImageText: {
    fontSize: hp(1.9),
    color: theme.colors.textWhite,
  },
  file: {
    height: hp(30),
    width: '100%',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderCurve: 'continuous',
    position: 'relative',
  },
  mediaContent: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeIcon: {
    position: 'absolute',
    top: hp(1.2),
    right: wp(2.5),
    padding: wp(1.8),
    borderRadius: wp(10),
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.darkLight,
    borderRadius: theme.radius.xl,
    padding: hp(1.5),
    paddingHorizontal: wp(4.5),
    gap: wp(2.5),
  },
  locationText: {
    flex: 1,
    fontSize: hp(1.9),
    color: theme.colors.textWhite,
  },
  buttonContainer: {
    width: '100%',
    marginTop: hp(1),
    marginBottom: Platform.OS === 'ios' ? hp(1) : hp(2),
  },
  postButton: {
    height: hp(6.2),
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modalContent: {
    backgroundColor: '#252525',
    borderRadius: theme.radius.lg,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkLight,
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textWhite,
  },
  locationList: {
    maxHeight: hp(40),
  },
  locationItem: {
    padding: hp(1.8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  locationItemText: {
    fontSize: hp(1.8),
    color: theme.colors.textWhite,
  },
  selectedLocation: {
    backgroundColor: theme.colors.primary,
  },
  selectedLocationText: {
    fontWeight: theme.fonts.bold,
  }
});