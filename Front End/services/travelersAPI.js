import { supabase } from '../lib/supabase';

// Fetch Nearby Travelers using RPC
export const getNearbyTravelers = async (userLocation, userId) => {
  if (!userLocation || !userId) return [];
  const { latitude, longitude } = userLocation;

  const { data, error } = await supabase.rpc('find_nearby_travelers', {
    current_user_id: userId,
    user_lat: latitude,
    user_lon: longitude,
    search_radius: 20000,
  });

  if (error) {
    console.error("RPC Error:", error.message);
    return [];
  }

  return data;
};

// Send or re-send connection request
export const sendConnectionRequest = async (requesterId, requestedId) => {
  const { data, error } = await supabase
    .from('connection_requests')
    .upsert(
      [{
        requester_id: requesterId,
        requested_id: requestedId,
        status: 'pending',
      }],
      { onConflict: ['requester_id', 'requested_id'] }
    );

  if (error) {
    console.error("Insert Error:", error.message);
    return { success: false, message: error.message };
  }

  return { success: true, data };
};

// Get sent requests with statuses
export const getSentRequests = async (userId) => {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('requested_id, status')
    .eq('requester_id', userId);

  if (error) {
    console.error("Fetch Error:", error.message);
    return [];
  }

  return data;
};
