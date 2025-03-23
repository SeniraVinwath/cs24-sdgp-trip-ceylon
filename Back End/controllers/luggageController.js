const {supabase} = require('../config/supabaseClient');

async function registerLuggage(imei,luggageDetails) {
    const{user_id,luggage_type,luggage_name,size,weight,additional_info} = luggageDetails;

    const{data,error} = await supabase
    .from('luggage')
    .insert([
        {
            imei: imei,
            user_id: user_id,
            luggage_type: luggage_type,
            luggage_name: luggage_name,
            size: size,
            weight: weight,
            additional_info: additional_info,
        },
    ]);

    if (error){
        console.error('error registering luggage:',error);
        throw new error('error registering luggage');
    }

    return data;
}
module.exports = {registerLuggage};