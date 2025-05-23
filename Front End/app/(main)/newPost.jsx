import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Head from '../../components/Head'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import RichTextEditor from '../../components/RichTextEditor'
import { useLocalSearchParams, useRouter } from 'expo-router'
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
    const [editorReady, setEditorReady] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const post = params || {};

    const platformSpacing = {
      paddingBottom: Platform.select({
        ios: Math.max(insets.bottom, hp(2)),
        android: Math.max(insets.bottom, hp(2)),
      }),
    };
    
    const horizontalPadding = wp(5);
    
    const touchableHitSlop = {
      top: hp(1.5),
      bottom: hp(1.5),
      left: wp(1.5),
      right: wp(1.5)
    };

    useEffect(() => {
      if (editorRef.current) {
        setEditorReady(true);
      }
    }, [editorRef]);

    useEffect(() => {
      if (post?.locationId) {
          const numericId = parseInt(post.locationId, 10);
          if (!isNaN(numericId)) {
              setLocationId(numericId);
          }
      }
    }, [post?.locationId]);

    useEffect(() => {
      if (!isInitialized && post?.id && editorReady) {
          bodyref.current = post.body || '';
          if (post.file) {
            setFile(post.file);
          }

          setTimeout(() => {
              if (editorRef.current?.setContentHTML) {
                  editorRef.current.setContentHTML(post.body || '');
              }
          }, 100);
          
          setIsInitialized(true);
      }
    }, [post, editorReady, isInitialized]);

    const onPick = async (isImage) => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Please allow media access to upload files.');
          return;
        }
        let mediaConfig = {
          mediaTypes: isImage ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        };
        
        let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
        if (!result.canceled) {
          console.log('Selected file:', result.assets[0]);
          setFile(result.assets[0]);
        }
      } catch (error) {
        console.error('Error picking media:', error);
        Alert.alert('Error', 'Failed to pick media. Please try again.');
      }
    };

    const isLocalFile = file => {
      if(!file) return null;
      if(typeof file === 'object') return true;
      return false;
    }

    const getFileType = file => {
      if(!file) return null;
      if(isLocalFile(file)){
        return file.type || (file.uri?.includes('.mp4') ? 'video' : 'image');
      }

      if(typeof file === 'string' && file.includes('postImages')){
        return 'image';
      }

      return 'video';
    }

    const getFileUri = file => {
      if(!file) return null;
      if(isLocalFile(file)){
        return file.uri;
      }

      const result = getSupabaseFileUrl(file);
      return result?.uri || '';
    }

    const toggleLocationPicker = () => {
      setShowLocationPicker(!showLocationPicker);
    }

    const getSelectedLocationName = () => {
      if (locationId === null) return "Add Location";
      const location = LOCATIONS.find(loc => loc.id === locationId);
      return location ? location.name : "Add Location";
    }

    const selectLocation = (locId) => {
      setLocationId(locId);
      setShowLocationPicker(false);
    }

    const handleRemoveFile = () => {
      console.log("Removing file");
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

      if(post && post.id) {
        data.id = parseInt(post.id, 10);
      }

      setLoading(true);
      try {
        let res = await createOrUpdatePost(data);
        if(res.success){
          setFile(null);
          setLocationId(null);
          bodyref.current = '';
          if(editorRef.current?.setContentHTML) {
            editorRef.current.setContentHTML('');
          }
          router.back();
        } else {
          Alert.alert('Post', res.msg || 'Failed to create post');
        }
      } catch (error) {
        console.error('Error submitting post:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
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
          {/* User Info Header */}
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

          {/* Rich Text Editor */}
          <View style={styles.textEditor}>
            <RichTextEditor 
              editorRef={editorRef} 
              onChange={body => bodyref.current = body}
            />
          </View>

          {/* Location selector button */}
          <TouchableOpacity 
            style={styles.locationSelector} 
            onPress={toggleLocationPicker}
            activeOpacity={0.7}
            hitSlop={touchableHitSlop}
          >
            <Icon name="location" size={wp(5.5)} />
            <Text style={styles.locationText}>
              {getSelectedLocationName()}
            </Text>
            <Icon name="arrowDown" size={wp(4.5)} />
          </TouchableOpacity>

          {/* Media Preview */}
          {file && (
            <View style={styles.file}>
              {getFileType(file) === 'video' ? (
                <Video 
                  style={styles.mediaContent} 
                  source={{uri: getFileUri(file)}} 
                  useNativeControls 
                  resizeMode='cover' 
                  isLooping
                />
              ) : (
                <Image 
                  source={{uri: getFileUri(file)}} 
                  resizeMode='cover' 
                  style={styles.mediaContent}
                />
              )}

              <Pressable 
                style={styles.closeIcon} 
                onPress={handleRemoveFile}
                hitSlop={touchableHitSlop}
              >
                <Icon name='delete' size={wp(5.5)} />
              </Pressable>
            </View>
          )}

          {/* Media Selector (Only shown when no file is selected) */}
          {!file && (
            <View style={styles.media}>
              <Text style={styles.addImageText}>Photo / Video</Text>
              <View style={styles.mediaIcons}>
                <TouchableOpacity 
                  onPress={() => onPick(true)}
                  style={styles.mediaIconButton}
                  activeOpacity={0.7}
                  hitSlop={touchableHitSlop}
                >
                  <Icon name="image" size={wp(7.5)} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => onPick(false)}
                  style={styles.mediaIconButton}
                  activeOpacity={0.7}
                  hitSlop={touchableHitSlop}
                >
                  <Icon name="video" size={wp(8)} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Post Button */}
        <View style={styles.buttonContainer}>
          <Button 
            buttonStyle={styles.postButton} 
            title={post && post.id ? 'Update' : 'Post'} 
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
                hitSlop={touchableHitSlop}
              >
                <Icon name="delete" size={wp(6)} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.locationList}
              showsVerticalScrollIndicator={false}
              bounces={Platform.OS === 'ios'}
              overScrollMode={Platform.OS === 'android' ? 'never' : undefined}
              contentContainerStyle={styles.locationListContent}
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
    paddingBottom: hp(3),
    gap: hp(2.5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingVertical: hp(1),
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
    minHeight: hp(10),
  },
  media: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: hp(1.8),
    paddingHorizontal: wp(4.5),
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderColor: theme.colors.darkLight,
  },
  mediaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(4),
  },
  mediaIconButton: {
    padding: wp(1.5),
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
    padding: hp(1.8),
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
    marginTop: hp(1.5),
    paddingHorizontal: wp(1),
  },
  postButton: {
    height: hp(6.2),
    width: '100%',
    borderRadius: theme.radius.xl,
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
    maxHeight: hp(70),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkLight,
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textWhite,
  },
  locationList: {
    maxHeight: hp(45),
  },
  locationListContent: {
    paddingBottom: hp(1),
  },
  locationItem: {
    padding: hp(1.8),
    paddingHorizontal: wp(4),
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
})