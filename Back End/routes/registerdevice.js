const express = require('express');
const supabase = require('../config/supabaseClient');
const { json } = require('body-parser');
const router = express.Router();

router.post('/register-device',async(req,res) => {
    try{
        const{deviceId,scanned} = req.body;

        if(!deviceId && !scanned) {
            return res.status(400).json({success: false, message:'You want to enter the deviceID or scan the QR on the device' });
        }
        let finalDeviceId;
        let deviceLocation = null;

        if(scanned){
            try{
                const parsedData = JSON.parse(scanned);
                finalDeviceId = parsedData.deviceId;
                deviceLocation = parsedData.location;
            }catch (error){
                return res.status(400).json({success:false,message:'Invalid qr format'});
            }
        }else{
                finalDeviceId = deviceId;
        }

        if(!finalDeviceId){
                return res.status(400).json({success:false,message:'want device id'})
        }

        const {data:existingDevice, error:checkError} = await supabase.from('devices').select('*').eq('device_id',finalDeviceId).single();

        if (existingDevice) {
            return res.status(409).json( {success:false,message:'Device already registered.'});
        }

        const {data,error} = await supabase.from('devices').insert([{
            deviceId:finalDeviceId,
            registed_date:new Date(),
            location:deviceLocation || null
        }]);

        if (error) throw error;
        
        


        res.status(201).json({success: true,message: 'Processing your request.....',navigateTo:'registerLuggage'});
    
    }catch(error){
        console.error('Error:',error);
        res.status(500).json({success:false,message:'server error'});
        
    }
    
});

module.exports = router;