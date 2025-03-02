import { supabase } from "../lib/supabase";

export const getUserData = async (userId) => {
    try {
        const {data, error} = await supabase
        .from('travelers')
        .select()
        .eq('id', userId)
        .single();
        
        if(error) {
            return {success: false, msg: error?.message}
        }
        return {success: true, data}
    } catch (error) {
        console.log('got error: ',error);
        return {success: false, msg: error.message};
    }
}