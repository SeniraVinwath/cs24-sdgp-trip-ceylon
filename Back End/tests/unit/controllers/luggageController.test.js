const { registerLuggage, getRegisteredLuggage, deleteLuggage } = require('../../../controllers/luggageController');
const { supabase, resetMocks } = require('../../mocks/supabaseMock');

// Mock the entire supabase client module
jest.mock('../../../config/supabaseClient', () => require('../../mocks/supabaseMock'));

describe('Luggage Controller Tests', () => {
  beforeEach(() => {
    // Reset all Supabase mocks before each test
    resetMocks();
  });

  describe('registerLuggage', () => {
    it('should successfully register luggage with valid data', async () => {
      // Setup test data
      const userId = 'user123';
      const luggageName = 'My Suitcase';
      const account = 'testaccount';
      const imei = '123456789012345';
      const password = 'testpassword';
      
      const mockLuggageData = {
        luggage_id: 1,
        user_id: userId,
        imei: imei,
        luggage_name: luggageName,
        account: account,
        password: password,
        created_at: new Date().toISOString()
      };
      
      // Configure Supabase mock to return successful response
      supabase.from.mockReturnThis();
      supabase.insert.mockReturnThis();
      supabase.select.mockResolvedValue({
        data: [mockLuggageData],
        error: null
      });
      
      // Call the function
      const result = await registerLuggage(userId, luggageName, account, imei, password);
      
      // Verify results
      expect(supabase.from).toHaveBeenCalledWith('luggages');
      expect(supabase.insert).toHaveBeenCalledWith([{
        user_id: userId,
        imei: imei,
        luggage_name: luggageName,
        account: account,
        password: password
      }]);
      expect(result).toEqual(mockLuggageData);
    });

    it('should throw an error when Supabase returns an error', async () => {
      // Setup test data
      const userId = 'user123';
      const luggageName = 'My Suitcase';
      const account = 'testaccount';
      const imei = '123456789012345';
      const password = 'testpassword';
      
      // Configure Supabase mock to return an error
      supabase.from.mockReturnThis();
      supabase.insert.mockReturnThis();
      supabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      // Call the function and expect it to throw
      await expect(
        registerLuggage(userId, luggageName, account, imei, password)
      ).rejects.toThrow('Failed to register luggage: Database error');
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('luggages');
    });
  });

  describe('getRegisteredLuggage', () => {
    it('should retrieve registered luggage for a user', async () => {
      // Setup test data
      const userId = 'user123';
      const mockLuggageData = [
        {
          luggage_id: 1,
          user_id: userId,
          imei: '123456789012345',
          luggage_name: 'Suitcase 1',
          account: 'account1',
          password: 'password1',
          created_at: new Date().toISOString()
        },
        {
          luggage_id: 2,
          user_id: userId,
          imei: '987654321098765',
          luggage_name: 'Suitcase 2',
          account: 'account2',
          password: 'password2',
          created_at: new Date().toISOString()
        }
      ];
      
      // Configure Supabase mock to return successful response
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockResolvedValue({
        data: mockLuggageData,
        error: null
      });
      
      // Call the function
      const result = await getRegisteredLuggage(userId);
      
      // Verify results
      expect(supabase.from).toHaveBeenCalledWith('luggages');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result).toEqual(mockLuggageData);
    });

    it('should throw an error when Supabase returns an error', async () => {
      // Setup test data
      const userId = 'user123';
      
      // Configure Supabase mock to return an error
      supabase.from.mockReturnThis();
      supabase.select.mockReturnThis();
      supabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      // Call the function and expect it to throw
      await expect(
        getRegisteredLuggage(userId)
      ).rejects.toThrow('Failed to fetch luggage');
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('luggages');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('user_id', userId);
    });
  });

  describe('deleteLuggage', () => {
    it('should successfully delete luggage with valid ID', async () => {
      // Setup test data
      const luggageId = BigInt(1);
      
      // Configure Supabase mock to return successful response
      supabase.from.mockReturnThis();
      supabase.delete.mockReturnThis();
      supabase.eq.mockResolvedValue({
        error: null
      });
      
      // Call the function
      const result = await deleteLuggage(luggageId);
      
      // Verify results
      expect(supabase.from).toHaveBeenCalledWith('luggages');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('luggage_id', luggageId);
      expect(result).toBe(true);
    });

    it('should throw an error when Supabase returns an error', async () => {
      // Setup test data
      const luggageId = BigInt(1);
      
      // Configure Supabase mock to return an error
      supabase.from.mockReturnThis();
      supabase.delete.mockReturnThis();
      supabase.eq.mockResolvedValue({
        error: { message: 'Database error' }
      });
      
      // Call the function and expect it to throw
      await expect(
        deleteLuggage(luggageId)
      ).rejects.toThrow('Failed to delete luggage: Database error');
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('luggages');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('luggage_id', luggageId);
    });
  });
});