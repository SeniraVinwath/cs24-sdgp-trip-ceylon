const { getAccessToken } = require('../../../controllers/authController');
const axiosMock = require('../../mocks/axiosMock');
const md5 = require('md5');
const jwt = require('jsonwebtoken');

// Jest automatically mocks modules when they are required in test files
jest.mock('md5');
jest.mock('jsonwebtoken');

describe('Auth Controller Tests', () => {
  beforeEach(() => {
    // Reset axios mocks before each test
    axiosMock.resetMocks();
    
    // Reset MD5 mock implementation
    md5.mockReset();
    // Set up a simple mock implementation for md5
    md5.mockImplementation(str => `hashed_${str}`);
    
    // Reset JWT mock
    jwt.sign.mockReset();
    jwt.sign.mockImplementation(() => 'mock-jwt-token');
    
    // Mock process.env
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
  });

  describe('getAccessToken', () => {
    it('should successfully get an access token with valid credentials', async () => {
      const account = 'testaccount';
      const password = 'testpassword';
      const imei = '123456789012345';
      
      // Configure axios mock to respond successfully
      axiosMock.mockAuthorizationAPI(true, 'test-access-token');
      
      const result = await getAccessToken(account, password, imei);
      
      expect(result).toBe('test-access-token');
      
      // Verify JWT was signed with correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        { account, accessToken: 'test-access-token', imei },
        'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should return null when credentials are invalid', async () => {
      const account = 'wrongaccount';
      const password = 'wrongpassword';
      
      // Configure axios mock to respond with an error
      axiosMock.mockAuthorizationAPI(false);
      
      const result = await getAccessToken(account, password);
      
      expect(result).toBeNull();
    });

    it('should return null when API request fails', async () => {
      const account = 'testaccount';
      const password = 'testpassword';
      
      // Configure axios mock to throw an error
      axiosMock.mock.onGet('http://api.citytrack.lk/api/authorization').networkError();
      
      const result = await getAccessToken(account, password);
      
      expect(result).toBeNull();
    });

    it('should generate the correct signature', async () => {
      const account = 'testaccount';
      const password = 'testpassword';
      
      // Configure axios mock to respond successfully
      axiosMock.mockAuthorizationAPI();
      
      // Spy on Date.now to return a consistent timestamp
      const now = 1609459200000; // 2021-01-01 00:00:00 UTC
      jest.spyOn(Date, 'now').mockImplementation(() => now);
      
      await getAccessToken(account, password);
      
      // Check if md5 was called with the expected values
      // First call: md5(password)
      expect(md5).toHaveBeenCalledWith(password);
      
      // Second call: md5(md5(password) + time)
      // Math.floor(now / 1000) = 1609459200
      expect(md5).toHaveBeenCalledWith(`hashed_${password}` + Math.floor(now / 1000));
    });

    it('should not generate JWT when imei is not provided', async () => {
      const account = 'testaccount';
      const password = 'testpassword';
      
      // Configure axios mock to respond successfully
      axiosMock.mockAuthorizationAPI(true, 'test-access-token');
      
      const result = await getAccessToken(account, password);
      
      expect(result).toBe('test-access-token');
      // Verify JWT was not called
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should not generate JWT when JWT_SECRET is not available', async () => {
      const account = 'testaccount';
      const password = 'testpassword';
      const imei = '123456789012345';
      
      // Remove JWT_SECRET from env
      delete process.env.JWT_SECRET;
      
      // Configure axios mock to respond successfully
      axiosMock.mockAuthorizationAPI(true, 'test-access-token');
      
      const result = await getAccessToken(account, password, imei);
      
      expect(result).toBe('test-access-token');
      // Verify JWT was not called
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const account = 'testaccount';
      const password = 'testpassword';
      
      // Configure axios mock to respond with an error code
      axiosMock.mock.onGet('http://api.citytrack.lk/api/authorization').reply(200, {
        code: 1,
        message: 'Invalid credentials'
      });
      
      const result = await getAccessToken(account, password);
      
      expect(result).toBeNull();
    });

    it('should handle unexpected response format', async () => {
      const account = 'testaccount';
      const password = 'testpassword';
      
      // Configure axios mock to respond with unexpected format
      axiosMock.mock.onGet('http://api.citytrack.lk/api/authorization').reply(200, {
        code: 0,
        // Missing record property
      });
      
      const result = await getAccessToken(account, password);
      
      // Test will pass as long as it doesn't throw an exception
      expect(result).toBeFalsy();
    });
  });
});