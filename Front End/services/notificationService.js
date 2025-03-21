import { supabase } from "../lib/supabase"

export const createNotification = async (notification) => {
    try{
        const {data, error} = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

        if(error){
            console.log('notification error: ', error);
            return {success: false, msg: 'Something went wrong!'};
        }

        return {success: true, data: data}
    }catch(error){
        console.log('notification error: ', error);
        return {success: false, msg: 'Something went wrong!'};
    }
}

export const fetchNotifications = async (recieverId) => {
    try {
        const {data,error} = await supabase
        .from('notifications')
        .select(`
            *,
            sender: senderId(id, user_name, image)
            `)
            .eq('recieverId', recieverId)
            .order('created_at', {ascending: false});

            if(error){
                console.log('fetchNotifications error: ', error);
                return {success: false, msg: 'Could not fetch notifications'};
            }

            return {success: true, data: data};

    }catch(error){
        console.log('fetchNotifications error: ', error);
        return {success: false, msg: 'Could not fetch notifications'}

    }
}