const request = require('supertest');
const express = require('express');
const router = require('../../../routes/apiRoutes');

// Mock controllers
jest.mock('../../../controllers/authController', () => ({
  getAccessToken: jest.fn()
}));

jest.mock('../../../controllers/trackController', () => ({
  trackDevice: jest.fn()
}));

jest.mock('../../../controllers/luggageController', () => ({
  registerLuggage: jest.fn(),
  getRegisteredLuggage: jest.fn(),
  deleteLuggage: jest.fn()
}));

jest.mock('../../../controllers/travelController', () => ({
  generateTravelPlan: jest.fn()
}));

// Import mocked controllers
const { getAccessToken } = require('../../../controllers/authController');
const { trackDevice } = require('../../../controllers/trackController');
const { registerLuggage, getRegisteredLuggage, deleteLuggage } = require('../../../controllers/luggageController');
const { generateTravelPlan } = require('../../../controllers/travelController');

describe('API Routes Tests', () => {
  let app;

  beforeEach(() => {
    // Create a new Express app and use the router for each test
    app = express();
    app.use(express.json());
    app.use('/', router);
    
    // Reset all controller mocks
    jest.clearAllMocks();
  });

  describe('POST /data', () => {
    it('should track a device successfully', async () => {
      // Mock successful controller responses
      getAccessToken.mockResolvedValue('test-access-token');
      trackDevice.mockResolvedValue({
        imei: '123456789012345',
        longitude: 79.8612,
        latitude: 6.9271,
        battery: 85
      });
      
      // Make the request
      const response = await request(app)
        .post('/data')
        .send({
          account: 'testaccount',
          imei: '123456789012345',
          password: 'testpassword'
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Device tracked successfully!');
      expect(response.body).toHaveProperty('trackingData');
      expect(response.body.trackingData).toHaveProperty('longitude');
      expect(response.body.trackingData).toHaveProperty('latitude');
      
      // Verify controller calls
      expect(getAccessToken).toHaveBeenCalledWith('testaccount', 'testpassword');
      expect(trackDevice).toHaveBeenCalledWith('test-access-token', '123456789012345');
    });

    it('should return 400 when required fields are missing', async () => {
      // Make the request with missing fields
      const response = await request(app)
        .post('/data')
        .send({
          account: 'testaccount',
          // Missing imei and password
        });
      
      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'account, imei, and password are required');
      
      // Verify no controller calls were made
      expect(getAccessToken).not.toHaveBeenCalled();
      expect(trackDevice).not.toHaveBeenCalled();
    });

    it('should return 500 when access token retrieval fails', async () => {
      // Mock failed access token retrieval
      getAccessToken.mockResolvedValue(null);
      
      // Make the request
      const response = await request(app)
        .post('/data')
        .send({
          account: 'testaccount',
          imei: '123456789012345',
          password: 'testpassword'
        });
      
      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to get access token');
      
      // Verify controller calls
      expect(getAccessToken).toHaveBeenCalled();
      expect(trackDevice).not.toHaveBeenCalled();
    });

    it('should return 500 when an error occurs', async () => {
      // Mock an error in controller
      getAccessToken.mockRejectedValue(new Error('Test error'));
      
      // Make the request
      const response = await request(app)
        .post('/data')
        .send({
          account: 'testaccount',
          imei: '123456789012345',
          password: 'testpassword'
        });
      
      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('POST /register-luggage', () => {
    it('should register luggage successfully', async () => {
      // Mock successful luggage registration
      const mockLuggageData = {
        luggage_id: 1,
        user_id: 'user123',
        imei: '123456789012345',
        luggage_name: 'My Suitcase',
        account: 'testaccount',
        password: 'testpassword',
        created_at: new Date().toISOString()
      };
      
      registerLuggage.mockResolvedValue(mockLuggageData);
      
      // Make the request
      const response = await request(app)
        .post('/register-luggage')
        .send({
          userId: 'user123',
          luggageName: 'My Suitcase',
          account: 'testaccount',
          imei: '123456789012345',
          password: 'testpassword'
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Luggage registered successfully');
      expect(response.body).toHaveProperty('data', mockLuggageData);
      
      // Verify controller call
      expect(registerLuggage).toHaveBeenCalledWith(
        'user123', 'My Suitcase', 'testaccount', '123456789012345', 'testpassword'
      );
    });

    it('should return 400 when required fields are missing', async () => {
      // Make the request with missing fields
      const response = await request(app)
        .post('/register-luggage')
        .send({
          userId: 'user123',
          // Missing other required fields
        });
      
      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'All details are required');
      
      // Verify no controller call was made
      expect(registerLuggage).not.toHaveBeenCalled();
    });

    it('should return 500 when registration fails', async () => {
      // Mock an error in controller
      registerLuggage.mockRejectedValue(new Error('Database error'));
      
      // Make the request
      const response = await request(app)
        .post('/register-luggage')
        .send({
          userId: 'user123',
          luggageName: 'My Suitcase',
          account: 'testaccount',
          imei: '123456789012345',
          password: 'testpassword'
        });
      
      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error registering luggage');
    });
  });

  describe('GET /registered-luggage', () => {
    it('should fetch registered luggage successfully', async () => {
      // Mock successful luggage retrieval
      const mockLuggageData = [
        {
          luggage_id: 1,
          user_id: 'user123',
          imei: '123456789012345',
          luggage_name: 'Suitcase 1',
          account: 'account1',
          password: 'password1'
        },
        {
          luggage_id: 2,
          user_id: 'user123',
          imei: '987654321098765',
          luggage_name: 'Suitcase 2',
          account: 'account2',
          password: 'password2'
        }
      ];
      
      getRegisteredLuggage.mockResolvedValue(mockLuggageData);
      
      // Make the request
      const response = await request(app)
        .get('/registered-luggage')
        .query({ userId: 'user123' });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('luggage', mockLuggageData);
      
      // Verify controller call
      expect(getRegisteredLuggage).toHaveBeenCalledWith('user123');
    });

    it('should return 400 when userId is missing', async () => {
      // Make the request without userId
      const response = await request(app)
        .get('/registered-luggage');
      
      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'userId is required');
      
      // Verify no controller call was made
      expect(getRegisteredLuggage).not.toHaveBeenCalled();
    });

    it('should return 500 when fetch fails', async () => {
      // Mock an error in controller
      getRegisteredLuggage.mockRejectedValue(new Error('Database error'));
      
      // Make the request
      const response = await request(app)
        .get('/registered-luggage')
        .query({ userId: 'user123' });
      
      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error fetching registered luggage');
    });
  });

  describe('DELETE /registered-luggage/:luggageId', () => {
    it('should delete luggage successfully', async () => {
      // Mock successful luggage deletion
      deleteLuggage.mockResolvedValue(true);
      
      // Make the request
      const response = await request(app)
        .delete('/registered-luggage/1');
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Luggage deleted successfully');
      
      // Verify controller call with BigInt conversion
      expect(deleteLuggage).toHaveBeenCalledWith(BigInt(1));
    });

    it('should return 404 when luggage is not found', async () => {
      // Mock luggage not found
      deleteLuggage.mockResolvedValue(false);
      
      // Make the request
      const response = await request(app)
        .delete('/registered-luggage/999');
      
      // Verify response
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Luggage not found');
    });

    it('should return 500 when deletion fails', async () => {
      // Mock an error in controller
      deleteLuggage.mockRejectedValue(new Error('Database error'));
      
      // Make the request
      const response = await request(app)
        .delete('/registered-luggage/1');
      
      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error deleting luggage');
    });
    
    it('should handle invalid luggageId format', async () => {
      // Make the request with invalid ID
      const response = await request(app)
        .delete('/registered-luggage/invalid-id');
      
      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error deleting luggage');
    });
  });

  describe('POST /travelPlanGenerator', () => {
    it('should generate a travel plan successfully', async () => {
      // Mock successful travel plan generation
      const mockTravelPlan = {
        title: 'Sri Lanka Adventure',
        trip_summary: {
          trip_duration: 7,
          pace: 'Balanced',
          num_travelers: 2
        },
        daily_itineraries: []
      };
      
      generateTravelPlan.mockResolvedValue(mockTravelPlan);
      
      // Make the request
      const response = await request(app)
        .post('/travelPlanGenerator')
        .send({
          start_date: '2023-01-01',
          end_date: '2023-01-07',
          preferences: 'Beach, Adventure',
          pace: 'Balanced',
          mandatory_locations: ['Colombo', 'Kandy'],
          excluded_locations: ['Jaffna'],
          specific_interests: ['Photography', 'Hiking'],
          num_travelers: 2
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Travel plan generated successfully');
      expect(response.body).toHaveProperty('data', mockTravelPlan);
      
      // Verify controller call
      expect(generateTravelPlan).toHaveBeenCalledWith(expect.objectContaining({
        start_date: '2023-01-01',
        end_date: '2023-01-07'
      }));
    });

    it('should return 400 when required fields are missing', async () => {
      // Make the request with missing fields
      const response = await request(app)
        .post('/travelPlanGenerator')
        .send({
          start_date: '2023-01-01',
          // Missing other required fields
        });
      
      // Verify response
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Missing required fields in request');
      
      // Verify no controller call was made
      expect(generateTravelPlan).not.toHaveBeenCalled();
    });
    
    it('should accept request with no excluded_locations', async () => {
      // Mock successful travel plan generation
      const mockTravelPlan = {
        title: 'Sri Lanka Adventure',
        trip_summary: {
          trip_duration: 7,
          pace: 'Balanced',
          num_travelers: 2
        },
        daily_itineraries: []
      };
      
      generateTravelPlan.mockResolvedValue(mockTravelPlan);
      
      // Make the request without excluded_locations
      const response = await request(app)
        .post('/travelPlanGenerator')
        .send({
          start_date: '2023-01-01',
          end_date: '2023-01-07',
          preferences: 'Beach, Adventure',
          pace: 'Balanced',
          mandatory_locations: ['Colombo', 'Kandy'],
          num_travelers: 2
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Travel plan generated successfully');
      
      // Verify controller call with default empty array for excluded_locations
      expect(generateTravelPlan).toHaveBeenCalledWith(expect.objectContaining({
        excluded_locations: []
      }));
    });
    
    it('should accept request with no specific_interests', async () => {
      // Mock successful travel plan generation
      const mockTravelPlan = {
        title: 'Sri Lanka Adventure',
        trip_summary: {
          trip_duration: 7,
          pace: 'Balanced',
          num_travelers: 2
        },
        daily_itineraries: []
      };
      
      generateTravelPlan.mockResolvedValue(mockTravelPlan);
      
      // Make the request without specific_interests
      const response = await request(app)
        .post('/travelPlanGenerator')
        .send({
          start_date: '2023-01-01',
          end_date: '2023-01-07',
          preferences: 'Beach, Adventure',
          pace: 'Balanced',
          mandatory_locations: ['Colombo', 'Kandy'],
          excluded_locations: ['Jaffna'],
          num_travelers: 2
        });
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Travel plan generated successfully');
      
      // Verify controller call with default empty array for specific_interests
      expect(generateTravelPlan).toHaveBeenCalledWith(expect.objectContaining({
        specific_interests: []
      }));
    });

    it('should return 500 when travel plan generation fails', async () => {
      // Mock an error in controller
      generateTravelPlan.mockRejectedValue(new Error('Generation error'));
      
      // Make the request
      const response = await request(app)
        .post('/travelPlanGenerator')
        .send({
          start_date: '2023-01-01',
          end_date: '2023-01-07',
          preferences: 'Beach, Adventure',
          pace: 'Balanced',
          mandatory_locations: ['Colombo', 'Kandy'],
          num_travelers: 2
        });
      
      // Verify response
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Error generating travel plan');
    });
  });
});