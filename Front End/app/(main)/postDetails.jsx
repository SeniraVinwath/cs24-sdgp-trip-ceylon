import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { createComment, fetchPostDetails, removeComment } from '../../services/postService';
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

const PostDetails = () => {
    const {postId} = useLocalSearchParams();
    const {user} = useAuth();
    const router = useRouter();
    const [startLoading, setStartLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(false);
    const [post, setPost] = useState(null);

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
            //send notification
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

    if(startLoading) {
        return (
            <View style={styles.center}>
                <Loading/>
            </View>
        )
    }

    if(!post){
        return (
            <View style={[styles.center, {justifyContent: 'flex-start', paddingTop: 100}]}>
                <Text style={styles.notFound}>Requested post was not found !</Text>
            </View>
        )
    }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <PostCard item={{...post, commentCount: post?.comments?.length }} currentUser={user} router={router} showMoreIcon={false}/>

        {/* comment input */}
        <View style={styles.inputContainer}>
            <Input
                value={commentText}
                placeholder="Type your comment.."
                onChangeText={value => setCommentText(value)}
                placeholderTextColor={theme.colors.textDark2}
                style={{ color: 'white' }}
                containerStyle={{flex:1, height: hp(6.2), borderRadius: theme.radius.xl, backgroundColor: 'black', borderColor: theme.colors.darkLight}}
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
        <View style={{marginVertical: 15, gap: 17}}>
            {
                post?.comments?.map(comment=>
                    <CommentItem key={comment?.id?.toString()} item={comment} onDelete={onDeleteComment} canDelete = {user.id == comment.userId || user.id == post.userId}/>
                )
            }

            {
                post?.comments?.length==0 && (
                    <Text style={{color: theme.colors.textDark2, paddingLeft: 5}}>
                        Be first to comment here!
                    </Text>
                )
            }
        </View>
      </ScrollView>
    </View>
  )
}

export default PostDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#252525',
        paddingVertical: wp(7),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    list: {
        paddingHorizontal: wp(4),
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
        backgroundColor: 'black',
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
    }
})