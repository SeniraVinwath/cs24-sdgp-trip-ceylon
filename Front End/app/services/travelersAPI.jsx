import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_CONNECTIONS = 'tripceylon_my_connections';
const STORAGE_KEY_REQUESTS = 'tripceylon_pending_requests';

// Mock travelers data
const travelers = [
  { id: '1', name: 'Sarah Chen', location: 'Colombo', country: 'USA' },
  { id: '2', name: 'Mario Silva', location: 'Kandy', country: 'AUS' },
  { id: '3', name: 'Emily Brown', location: 'Galle', country: 'UK' },
  { id: '4', name: 'John Doe', location: 'Negombo', country: 'Canada' },
];

// Mock requests data
const mockRequests = [
  { id: '5', name: 'Alice Johnson', location: 'Ella', country: 'Germany' },
  { id: '6', name: 'David Smith', location: 'Jaffna', country: 'France' },
];

// Simulated API delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Get nearby travelers (excluding existing connections) */
export const getNearbyTravelers = async () => {
  await delay(1000);
  const myConnections = await getMyConnections();
  return travelers.filter(t => !myConnections.some(c => c.id === t.id));
};

/** Get saved connections */
export const getMyConnections = async () => {
  try {
    const storedConnections = await AsyncStorage.getItem(STORAGE_KEY_CONNECTIONS);
    return storedConnections ? JSON.parse(storedConnections) : [travelers[0]]; // Ensure Sarah Chen appears
  } catch (error) {
    console.error('Error retrieving connections:', error);
    return [travelers[0]]; // Default to mock connection
  }
};

/** Get pending requests (Repopulates mock if empty) */
export const getPendingRequests = async () => {
  try {
    const storedRequests = await AsyncStorage.getItem(STORAGE_KEY_REQUESTS);
    let requests = storedRequests ? JSON.parse(storedRequests) : [];

    // ✅ **Fix: Repopulate mock requests if storage is empty**
    if (requests.length === 0) {
      requests = mockRequests;
      await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(mockRequests));
    }

    return requests;
  } catch (error) {
    console.error('Error retrieving pending requests:', error);
    return mockRequests; // Ensure mock data returns if an error occurs
  }
};


/** Add a connection request */
export const sendConnectionRequest = async (travelerId) => {
  try {
    const traveler = travelers.find(t => t.id === travelerId);
    if (!traveler) return false;

    const currentRequests = await getPendingRequests();
    if (currentRequests.some(r => r.id === travelerId)) return true;

    const newRequests = [...currentRequests, traveler];
    await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(newRequests));

    return true;
  } catch (error) {
    console.error('Error sending request:', error);
    return false;
  }
};

/** Accept a connection request */
export const acceptRequest = async (travelerId) => {
  try {
    const pendingRequests = await getPendingRequests();
    const traveler = pendingRequests.find(r => r.id === travelerId);
    if (!traveler) return false;

    // ✅ Remove traveler from pending requests
    const updatedRequests = pendingRequests.filter(r => r.id !== travelerId);
    await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updatedRequests));

    // ✅ Get current connections
    const currentConnections = await getMyConnections();

    // ✅ Prevent duplicate connections
    if (!currentConnections.some(c => c.id === travelerId)) {
      const newConnections = [...currentConnections, traveler];
      await AsyncStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(newConnections));
    }

    return true;
  } catch (error) {
    console.error('Error accepting request:', error);
    return false;
  }
};



/** Decline a connection request */
export const declineRequest = async (travelerId) => {
  try {
    const pendingRequests = await getPendingRequests();
    const updatedRequests = pendingRequests.filter(r => r.id !== travelerId);
    await AsyncStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updatedRequests));

    return true;
  } catch (error) {
    console.error('Error declining request:', error);
    return false;
  }
};

/** Add traveler to my connections */
export const addConnection = async (travelerId) => {
  try {
    const traveler = travelers.find(t => t.id === travelerId);
    if (!traveler) return false;

    const currentConnections = await getMyConnections();
    if (currentConnections.some(c => c.id === travelerId)) return true;

    const newConnections = [...currentConnections, traveler];
    await AsyncStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(newConnections));

    return true;
  } catch (error) {
    console.error('Error adding connection:', error);
    return false;
  }
};

/** Remove a connection */
export const removeConnection = async (travelerId) => {
  try {
    // ✅ Get current connections
    const currentConnections = await getMyConnections();
    
    // ✅ Remove the selected traveler
    const newConnections = currentConnections.filter(c => c.id !== travelerId);
    
    // ✅ Update AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(newConnections));

    return true;
  } catch (error) {
    console.error('Error removing connection:', error);
    return false;
  }
};
