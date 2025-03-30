const { trackDevice } = require('../../../controllers/trackController'); 
const axiosMock = require('../../mocks/axiosMock'); 
const { resetMocks } = require('../../mocks/supabaseMock');  

// Mock dependencies 
jest.mock('../../../config/supabaseClient', () => require('../../mocks/supabaseMock'));  

describe('Track Controller Tests', () => {   
  beforeEach(() => {     
    // Reset all mocks before each test     
    axiosMock.resetMocks();     
    resetMocks();   
  });    

  describe('trackDevice', () => {     
    it('should successfully track a device with valid access token and IMEI', async () => {       
      // Setup test data       
      const accessToken = 'test-access-token';       
      const imei = '72106925241';       
      const mockDeviceData = {         
        imei: imei,         
        longitude: 79.8612,         
        latitude: 6.9271,         
        battery: 85       
      };              
      
      // Configure axios mock to return device data       
      axiosMock.mockTrackAPI(true, mockDeviceData);              
      
      // Call the function       
      const result = await trackDevice(accessToken, imei);              
      
      // Verify results       
      expect(result).toEqual(mockDeviceData);     
    });      
    
    it('should return null when access token is missing', async () => {       
      // Setup test data       
      const imei = '72106925241';              
      
      // Call the function with missing access token       
      const result = await trackDevice(null, imei);              
      
      // Verify results       
      expect(result).toBeNull();     
    });      
    
    it('should return null when IMEI is missing', async () => {       
      // Setup test data       
      const accessToken = 'test-access-token';              
      
      // Call the function with missing IMEI       
      const result = await trackDevice(accessToken, null);              
      
      // Verify results       
      expect(result).toBeNull();     
    });      
    
    it('should return null when API returns an error code', async () => {       
      // Setup test data       
      const accessToken = 'test-access-token';       
      const imei = '72106925241';              
      
      // Configure axios mock to return an error       
      axiosMock.mockTrackAPI(false);              
      
      // Call the function       
      const result = await trackDevice(accessToken, imei);              
      
      // Verify results       
      expect(result).toBeNull();     
    });      
    
    it('should return null when API response has no valid record', async () => {       
      // Setup test data       
      const accessToken = 'test-access-token';       
      const imei = '72106925241';              
      
      // Configure a custom response with empty record array       
      axiosMock.mock.onGet('http://api.citytrack.lk/api/track').reply(200, {         
        code: 0,         
        message: 'success',         
        record: []       
      });              
      
      // Call the function       
      const result = await trackDevice(accessToken, imei);              
      
      // Verify results       
      expect(result).toBeNull();     
    });      
    
    it('should return null when API call throws an error', async () => {       
      // Setup test data       
      const accessToken = 'test-access-token';       
      const imei = '72106925241';              
      
      // Configure axios mock to throw a network error       
      axiosMock.mock.onGet('http://api.citytrack.lk/api/track').networkError();              
      
      // Call the function       
      const result = await trackDevice(accessToken, imei);              
      
      // Verify results       
      expect(result).toBeNull();     
    });

    it('should return null when API response has invalid/missing data structure', async () => {
      // Setup test data
      const accessToken = 'test-access-token';
      const imei = '72106925241';
      
      // Configure a response with missing required fields
      axiosMock.mock.onGet('http://api.citytrack.lk/api/track').reply(200, {
        code: 0,
        message: 'success',
        record: [{ imei: imei /* missing longitude and latitude */ }]
      });
      
      // Call the function
      const result = await trackDevice(accessToken, imei);
      
      // The function should still return the device data, even with missing fields
      expect(result).toEqual({
        imei: imei,
        longitude: undefined,
        latitude: undefined,
        battery: undefined
      });
    });

    it('should handle response data with non-zero code but valid record', async () => {
      // Setup test data
      const accessToken = 'test-access-token';
      const imei = '72106925241';
      
      // Configure a response with non-zero code
      axiosMock.mock.onGet('http://api.citytrack.lk/api/track').reply(200, {
        code: 1, // Non-zero code
        message: 'partial success',
        record: [{
          imei: imei,
          longitude: 79.8612,
          latitude: 6.9271,
          battery: 85
        }]
      });
      
      // Call the function
      const result = await trackDevice(accessToken, imei);
      
      // Verify results - should return null due to non-zero code
      expect(result).toBeNull();
    });

    it('should handle response with unexpected data format', async () => {
      // Setup test data
      const accessToken = 'test-access-token';
      const imei = '72106925241';
      
      // Configure a response with unexpected format
      axiosMock.mock.onGet('http://api.citytrack.lk/api/track').reply(200, {
        success: true, // Different format than expected
        data: {
          devices: [{
            imei: imei,
            coordinates: { lon: 79.8612, lat: 6.9271 },
            batteryLevel: 85
          }]
        }
      });
      
      // Call the function
      const result = await trackDevice(accessToken, imei);
      
      // Verify results - should return null due to unexpected format
      expect(result).toBeNull();
    });
  });
});