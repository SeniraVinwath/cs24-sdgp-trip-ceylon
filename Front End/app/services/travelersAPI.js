import { supabase } from '../../lib/supabase';

/** Get saved connections */
export const getMyConnections = async () => {
  try {
    // Fetch connections for the given user
    const { data: connections, error } = await supabase
      .from('connections')
      .select('id, connected_user_id')
      .eq('user_id', userId);

    if (error) throw error;

    // Fetch user details for each connection
    const connectedUsers = await Promise.all(
      connections.map(async (c) => {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', c.connected_user_id)
          .single();

        if (userError) throw userError;
        return { ...user, connection_id: c.id }; // Include connection ID for removal
      })
    );

    return connectedUsers;
  } catch (error) {
    console.error('Error retrieving connections:', error);
    return [];
  }
};

/** Get pending requests */
export const getPendingRequests = async (userId) => {
  try {
    // Fetch pending requests for the given user
    const { data: requests, error } = await supabase
      .from('connection_requests')
      .select('id, requester_id, status, created_at')
      .eq('requested_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    // Fetch requester details for each request
    const requestDetails = await Promise.all(
      requests.map(async (r) => {
        const { data: requester, error: requesterError } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', r.requester_id)
          .single();

        if (requesterError) throw requesterError;
        return { ...r, requester }; // Include requester details
      })
    );

    return requestDetails;
  } catch (error) {
    console.error('Error retrieving pending requests:', error);
    return [];
  }
};

/** Send a connection request */
export const sendConnectionRequest = async (requesterId, travelerId) => {
  try {
    // Insert a new connection request
    const { error } = await supabase
      .from('connection_requests')
      .insert([{ requester_id: requesterId, requested_id: travelerId, status: 'pending' }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error sending request:', error);
    return false;
  }
};

/** Accept a connection request */
export const acceptRequest = async (userId, requestId) => {
  try {
    // Fetch the request
    const { data: request, error: requestError } = await supabase
      .from('connection_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) throw new Error('Request not found');

    // Add the connection
    const { error: connectionError } = await supabase
      .from('connections')
      .insert([
        { user_id: userId, connected_user_id: request.requester_id },
        { user_id: request.requester_id, connected_user_id: userId }, // Bi-directional connection
      ]);

    if (connectionError) throw connectionError;

    // Update the request status to 'accepted'
    const { error: updateError } = await supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error accepting request:', error);
    return false;
  }
};

/** Decline a connection request */
export const declineRequest = async (requestId) => {
  try {
    // Update the request status to 'declined'
    const { error } = await supabase
      .from('connection_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error declining request:', error);
    return false;
  }
};

/** Remove a connection */
export const removeConnection = async (connectionId) => {
  try {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing connection:', error);
    return false;
  }
};
