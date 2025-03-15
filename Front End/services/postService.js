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
        
        console.log('Sending to Supabase:', formattedPost);
        
        const {data, error} = await supabase
            .from('posts')
            .upsert(formattedPost)
            .select()
            .single();
        
        if (error) {
            console.log('create post error details:', error);
            return {success: false, msg: `Could not create your post: ${error.message}`};
        }
        
        return {success: true, data: data};
    } catch (error) {
        console.log('create post exception:', error);
        return {success: false, msg: `Exception: ${error.message}`};
    }
}