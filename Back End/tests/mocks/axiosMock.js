const MockAdapter = require('axios-mock-adapter');
const axios = require('axios');

// Create a new instance of the mock adapter
const mock = new MockAdapter(axios);

// Helper function to reset all mocks
const resetMocks = () => {
  mock.reset();
};

// Helper function to mock CityTrack API authorization endpoint
const mockAuthorizationAPI = (success = true, accessToken = 'test-access-token') => {
  if (success) {
    mock.onGet('http://api.citytrack.lk/api/authorization').reply(200, {
      code: 0,
      message: 'success',
      record: {
        access_token: accessToken
      }
    });
  } else {
    mock.onGet('http://api.citytrack.lk/api/authorization').reply(401, {
      code: 1,
      message: 'Invalid credentials'
    });
  }
};

// Helper function to mock CityTrack API track endpoint
const mockTrackAPI = (success = true, deviceData = null) => {
  const defaultDeviceData = {
    imei: '123456789012345',
    longitude: 79.8612,
    latitude: 6.9271,
    battery: 85
  };
  
  const responseData = deviceData || defaultDeviceData;
  
  if (success) {
    mock.onGet('http://api.citytrack.lk/api/track').reply(200, {
      code: 0,
      message: 'success',
      record: [responseData]
    });
  } else {
    mock.onGet('http://api.citytrack.lk/api/track').reply(400, {
      code: 1,
      message: 'Invalid tracking request'
    });
  }
};

module.exports = {
  mock,
  resetMocks,
  mockAuthorizationAPI,
  mockTrackAPI
};