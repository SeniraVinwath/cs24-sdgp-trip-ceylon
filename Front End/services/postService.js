import { supabase } from "../lib/supabase";
import { uploadFile } from "./imageService";

export const createOrUpdatePost = async (post) => {
    try {
        const formattedPost = {};
        
        if (post.body !== undefined) formattedPost.body = post.body;
        if (post.userid !== undefined) formattedPost.userId = post.userid;
        if (post.locationid !== undefined) formattedPost.locationId = post.locationid;
        
        if (post.file && typeof post.file == 'object') {
            let isImage = post?.file?.type == 'image';
            let folderName = isImage ? 'postImages' : 'postVideos';
            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
            if (fileResult.success) formattedPost.file = fileResult.data;
            else {
                return fileResult;
            }
        } else if (post.file) {
            formattedPost.file = post.file;
        }
        
        const {data, error} = await supabase
            .from('posts')
            .upsert(formattedPost)
            .select()
            .single();
        
        if (error) return {success: false, msg: `Could not create post: ${error.message}`};
        return {success: true, data: data};
    } catch (error) {
        return {success: false, msg: `Exception: ${error.message}`};
    }
}

export const fetchPosts = async (currentUserId, limit=10) => {
    try{
        const {data, error} = await supabase
        .from('posts')
        .select(`
            *,
            traveler: travelers(id,user_name,image),
            postLikes (*),
            comment_count:comments(count)
        `)
        .order('created_at', {ascending: false})
        .limit(limit);

        if(error) {
            return {success: false, msg: 'Could not fetch posts'};
        }

        const transformed = data.map(post => ({
            ...post,
            likeCount: post.postLikes?.length || 0,
            userLiked: post.postLikes?.some(like => like.userId === currentUserId) || false,
            commentCount: post.comment_count?.[0]?.count || 0
        }));

        return {success: true, data: transformed};
    }catch(error){
        return {success: false, msg: 'Could not fetch posts'};
    }
}

export const createPostLike = async (postLike) => {
    try{
        const {data, error} = await supabase
        .from('postLikes')
        .insert(postLike)
        .select()
        .single();

        if(error) return {success: false, msg: 'Could not like post'};
        return {success: true, data: data};
    }catch(error){
        return {success: false, msg: 'Could not like post'};
    }
}

export const removePostLike = async (postId, userId) => {
    try {
        const { error } = await supabase
        .from('postLikes')
        .delete()
        .eq('userId', userId)
        .eq('postId', postId)

        if (error) return { success: false, msg: 'Could not remove like' };
        return { success: true };
    } catch (error) {
        return { success: false, msg: 'Could not remove like' };
    }
}

export const fetchPostDetails = async (postId, currentUserId) => {
    try {
        const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            traveler: travelers(id,user_name,image),
            postLikes (*),
            comments(*, traveler: travelers(id,user_name,image))
        `)
        .eq('id', postId)
        .order('created_at', {ascending: false, foreignTable: 'comments'})
        .single();
        
        if(error) {
            return {success: false, msg: 'Could not fetch post details'}
        }
        
        const transformedData = {
            ...data,
            likeCount: data.postLikes?.length || 0,
            userLiked: data.postLikes?.some(like => like.userId === currentUserId) || false
        };
        
        return {success: true, data: transformedData};
    } catch(error) {
        return {success: false, msg: 'Could not fetch post details'};
    }
}

export const createComment = async (comment) => {
    try{
        const {data, error} = await supabase
        .from('comments')
        .insert(comment)
        .select()
        .single();

        if(error) return {success: false, msg: 'Could not comment on the post'};
        return {success: true, data: data};
    }catch(error){
        return {success: false, msg: 'Could not comment on the post'};
    }
}

export const removeComment = async (commentId) => {
    try {
        const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

        if (error) return { success: false, msg: 'Could not remove your comment' };
        return { success: true, data: {commentId}};
    } catch (error) {
        return { success: false, msg: 'Could not remove your comment' };
    }
}