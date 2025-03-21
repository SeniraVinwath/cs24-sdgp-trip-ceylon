import { Alert, ScrollView, StyleSheet, Text, View, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { createComment, fetchPostDetails, removeComment, removePost } from '../../services/postService';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import PostCard from '../../components/PostCard';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/Loading';
import Input from '../../components/Input';
import { TouchableOpacity } from 'react-native';
import Icon from '../../assets/icons';
import CommentItem from '../../components/CommentItem';
import { getUserData } from '../../services/userService';
import { supabase } from '../../lib/supabase';
import { createNotification } from '../../services/notificationService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenWrapper from '../../components/ScreenWrapper';

const PostDetails = () => {
    const {postId, commentId} = useLocalSearchParams();
    const {user} = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [startLoading, setStartLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(false);
    const [post, setPost] = useState(null);

    const platformSpacing = { 
        paddingBottom: Platform.select({ 
            ios: Math.max(insets.bottom, hp(2)), 
            android: Math.max(insets.bottom, hp(2)), 
        }), 
    };

    const handleNewComment = async (payload) => {
        if (payload.new) {
          await getPostDetails();
        }
    }

    useEffect(() => {
        const commentChannel = supabase
        .channel('comments')
        .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}`}, handleNewComment)
        .subscribe();

        getPostDetails();
    
        return () => {
            supabase.removeChannel(commentChannel);
        }
    }, []);

    const getPostDetails = async () => {
        let res = await fetchPostDetails(postId, user?.id);
        if (res.success) setPost(res.data);
        setStartLoading(false);
    }

    const onNewComment = async ()=> {
        if(!commentText.trim()) return null;
        let data = {
            userId: user?.id,
            postId: post?.id,
            text: commentText
        }

        setLoading(true);
        let res = await createComment(data);
        setLoading(false);
        if(res.success){
            if(user.id!=post.userId){
                let notify = {
                    senderId: user.id,
                    recieverId: post.userId,
                    title: 'Commented on your post',
                    data: JSON.stringify({postId: post.id, commentId: res?.data?.id})
                }
                createNotification(notify);
            }
            setCommentText('');
        }else{
            Alert.alert('Comment', res.msg);
        }
    }

    const onDeleteComment = async (comment) =>{
        console.log('deleting comment: ', comment);
        let res = await removeComment(comment?.id)
        if(res.success){
                setPost(pervPost=>{
                    let updatedPost = {...pervPost};
                    updatedPost.comments = updatedPost.comments.filter(c=> c.id != comment.id);
                    return updatedPost;
                })
        }else{
            Alert.alert('Comment', res.msg)
        }
    }

    const onDeletePost = async (item)=>{
        let res = await removePost(post.id);
        if(res.success){
            router.back();
        } else {
            Alert.alert('Post', res.msg);
        }
    }

    const onEditPost = async (item)=>{
        router.back();
        router.push({pathname: 'newPost', params: {...item}})
    }

    if(startLoading) {
        return (
            <ScreenWrapper bg="#252525">
                <View style={styles.center}>
                    <Loading/>
                </View>
            </ScreenWrapper>
        )
    }

    if(!post){
        return (
            <ScreenWrapper bg="#252525">
                <View style={[styles.center, {justifyContent: 'flex-start', paddingTop: hp(10)}]}>
                    <Text style={styles.notFound}>Requested post was not found !</Text>
                </View>
            </ScreenWrapper>
        )
    }

  return (
    <ScreenWrapper bg="#252525">
      <View style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[
            styles.scrollContent,
            platformSpacing
          ]}
        >
          <PostCard 
            item={{...post, commentCount: post?.comments?.length }} 
            currentUser={user} 
            router={router} 
            showMoreIcon={false} 
            showDelete={true} 
            onDelete={onDeletePost} 
            onEdit={onEditPost}
          />

          {/* comment input */}
          <View style={styles.inputContainer}>
              <Input
                  value={commentText}
                  placeholder="Type your comment.."
                  onChangeText={value => setCommentText(value)}
                  placeholderTextColor={theme.colors.textDark2}
                  style={{ color: 'white' }}
                  containerStyle={styles.inputField}
              />

              {
                  loading? (
                      <View style={styles.loading}>
                          <Loading size='small'/>
                      </View>

                  ): (
                      <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
                          <Icon name='send'/>
                      </TouchableOpacity>

                  )
              }
          </View>

          {/* Comment List */}
          <View style={styles.commentList}>
              {
                  post?.comments?.map(comment=>
                      <CommentItem 
                        key={comment?.id?.toString()} 
                        item={comment} 
                        onDelete={onDeleteComment} 
                        canDelete={user.id == comment.userId || user.id == post.userId} 
                        highlight={comment.id == commentId}
                      />
                  )
              }

              {
                  post?.comments?.length==0 && (
                      <Text style={styles.noCommentsText}>
                          Be first to comment here!
                      </Text>
                  )
              }
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default PostDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#252525',
    },
    scrollContent: {
        paddingHorizontal: wp(4),
        paddingTop: hp(2),
        paddingBottom: hp(4),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2.5),
        marginTop: hp(2),
        marginBottom: hp(1),
    },
    inputField: {
        flex: 1, 
        height: hp(6.2), 
        borderRadius: theme.radius.xl, 
        backgroundColor: 'black', 
        borderColor: theme.colors.darkLight
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.textDark,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        height: hp(5.8),
        width: hp(5.8),
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#252525',
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.textWhite,
        fontWeight: '200',
    },
    loading: {
        height: hp(5.8),
        width: hp(5.8),
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{scale: 1.3}],
    },
    commentList: {
        marginTop: hp(1.5),
        marginBottom: hp(1),
        gap: hp(1.7),
    },
    noCommentsText: {
        color: theme.colors.textDark2, 
        paddingLeft: wp(1.2),
        fontSize: hp(1.8),
    }
})