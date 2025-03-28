import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';

export const getUserImageSrc = imagePath => {
    if(imagePath) {
        return getSupabaseFileUrl(imagePath);
    }else{
        return require('../assets/images/defaultUserIMG.jpg')
    }
}

export const getSupabaseFileUrl = filePath => {
    if(filePath){
        return { uri: `${supabaseUrl}/storage/v1/object/public/trip_cey_traveler_uploads/${filePath}` }
    }
    return null;
}

export const downloadFile = async (url) => {
    try {
        console.log("Downloading from URL:", url);
        
        const fileUri = getLocalFilePath(url);
        console.log("Saving to:", fileUri);
        
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (fileInfo.exists) {
            return fileUri;
        }
        
        const dirPath = FileSystem.documentDirectory;
        const dirInfo = await FileSystem.getInfoAsync(dirPath);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
        }
        
        const result = await FileSystem.downloadAsync(url, fileUri);
        
        const downloadedFileInfo = await FileSystem.getInfoAsync(fileUri);
        if (downloadedFileInfo.exists && downloadedFileInfo.size > 0) {
            return fileUri;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Download failed:", error);
        return null;
    }
}

export const getLocalFilePath = filePath => {

    let fileName = filePath.split('/').pop();
    if (!fileName.includes('.')) {
        if (filePath.includes('postImages')) {
            fileName += '.jpg';
        } else if (filePath.includes('postVideos')) {
            fileName += '.mp4';  
        }
    }
    return `${FileSystem.documentDirectory}${fileName}`;
}

export const uploadFile =  async (folderName, fileUri, isImage=true)=>{
    try{
        let fileName = getFilePath(folderName, isImage);
        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64
        });
        let imageData = decode(fileBase64);
        let {data, error} = await supabase
        .storage
        .from('trip_cey_traveler_uploads')
        .upload(fileName, imageData, {
            cacheControl: '3600',
            upsert: false,
            contentType: isImage? 'image/*': 'video/*'
        });
        if(error){
            console.log('file upload error: ', error);
            return {success: false, msg: 'Could not upload media'};
        }

        return {success: true, data: data.path}

    }catch(error){
        console.log('file upload error: ', error);
        return {success: false, msg: 'Could not upload media'};
    }
}

export const getFilePath = (folderName, isImage) => {
    return `/${folderName}/${(new Date()).getTime()}${isImage ? '.png' : '.mp4'}`;
}