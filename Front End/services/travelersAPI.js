import { supabase } from '../lib/supabase'; // Supabase-native import

/** Fetch Nearby Travelers directly via Supabase RPC */
export const getNearbyTravelers = async (userLocation, userId) => {
  if (!userLocation || !userId) {
    console.error("Missing latitude, longitude, or user ID");
    return [];
  }

  const { latitude, longitude } = userLocation;

  const { data, error } = await supabase.rpc('find_nearby_travelers', {
    current_user_id: userId,
    user_lat: latitude,
    user_lon: longitude,
    search_radius: 20000 // 20 km radius
  });

  if (error) {
    console.error("RPC Error:", error.message);
    return [];
  }

  return data;
};

/** Send a connection request using Supabase */
export const sendConnectionRequest = async (requesterId, requestedId) => {
  const { data, error } = await supabase
    .from('connection_requests')
    .insert([{ requester_id: requesterId, requested_id: requestedId }]);

  if (error) {
    console.error("Insert Error:", error.message);
    return { success: false, message: error.message };
  }

  return { success: true, data };
};

/** Get previously sent requests using Supabase */
export const getSentRequests = async (userId) => {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('requested_id')
    .eq('requester_id', userId);

  if (error) {
    console.error('Error fetching sent requests:', error.message);
    return [];
  }

  return data.map(entry => entry.requested_id);
};
