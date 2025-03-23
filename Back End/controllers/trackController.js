const axios = require("axios");
const { supabase } = require("../config/supabaseClient");
const storeLocation = async (imei, deviceData) => {
  try{
    if(!imei || !deviceData){
      throw new error("Missing imei or device data");
    }
  
    const { longitude, latitude,battery } = deviceData;


    const { data, error } = await supabase.from("device_locations").upsert([
      {
        imei: imei,
        longitude: longitude,
        latitude: latitude,
        battery: battery, 
        timeStamp: new Date().toISOString(),
      },
    ], { onConflict: ['imei'] });

    if (error) {
      console.error("Error inserting data into the database:", error);
      throw error; 
    }

    return data;
  }catch(error){
    console.error("error in store location:",error);
  }
};

async function trackDevice(accessToken, imei) {
  try {
    if (!accessToken || !imei) {
      console.error("Missing access token or imei");
      return null;
    }
    console.log("Using access token:", accessToken);
    const response = await axios.get("http://api.citytrack.lk/api/track", {
      params: {
        access_token: accessToken,
        imeis: imei,
      },
      headers: {
        Accept: "application/json",
      },
    });

    console.log("API response:", response.data); 
    if (response.data.code === 0) {
      
      if (
        Array.isArray(response.data.record) &&
        response.data.record.length > 0
      ) {
        
        const device = response.data.record[0];
        const deviceData = {
          imei: device.imei,
          longitude: device.longitude,
          latitude: device.latitude,
          battery: device.battery,


        };
        console.log("Device data:", deviceData);

       

        return deviceData;
      } else {
        console.error(
          "No valid device data in response:",
          response.data.record
        );
        return null;
      }
    } else {
      console.error("Error tracking devices:", response.data.message);
      return null;
    }
  } catch (error) {
    console.error("Error while tracking device:", error);
    return null;
  }
}

module.exports = { trackDevice };
