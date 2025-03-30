// Mock dependencies first, before any imports
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Create mock functions before using them in the mock setup
const mockTextFn = jest.fn().mockReturnValue('{"title":"Test Trip","trip_summary":{"trip_duration":7}}');
const mockGenerateContentFn = jest.fn().mockResolvedValue({
  response: {
    text: mockTextFn
  }
});
const mockGetGenerativeModelFn = jest.fn().mockReturnValue({
  generateContent: mockGenerateContentFn
});
const mockGoogleGenerativeAIFn = jest.fn().mockReturnValue({
  getGenerativeModel: mockGetGenerativeModelFn
});

// Now use the mock functions in the mock setup
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: mockGoogleGenerativeAIFn
}));

// Set environment variables
process.env.GEMINI_API_KEY = 'test-api-key';

// Import modules only after all mocks are set up
const { generateTravelPlan } = require('../../../controllers/travelController');
const { EventEmitter } = require('events');
const { spawn } = require('child_process');

describe('Travel Controller Tests', () => {
  
  // Helper function to mock child process events
  function mockSpawnProcess(success = true, output = '{"day1": "Test day"}') {
    // Create mock event emitters
    const stdoutEmitter = new EventEmitter();
    const stderrEmitter = new EventEmitter();
    const processEmitter = new EventEmitter();
    
    // Create mock spawn process
    const mockProcess = {
      stdout: stdoutEmitter,
      stderr: stderrEmitter,
      on: processEmitter.on.bind(processEmitter),
      emit: processEmitter.emit.bind(processEmitter)
    };
    
    // Configure child_process.spawn mock
    spawn.mockImplementation(() => mockProcess);
    
    // Return a function to trigger the events in correct order
    return () => {
      // In case of success
      if (success) {
        // Emit stdout data
        stdoutEmitter.emit('data', Buffer.from(output));
        // Emit close event with success code 0
        processEmitter.emit('close', 0);
      } else {
        // Emit stderr data in case of error
        stderrEmitter.emit('data', Buffer.from('Python script error'));
        // Emit close event with error code 1
        processEmitter.emit('close', 1);
      }
    };
  }
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('generateTravelPlan', () => {
    it('should successfully generate a travel plan', async () => {
      // Setup test data
      const travelData = {
        start_date: '2023-01-01',
        end_date: '2023-01-07',
        preferences: 'Beach, Adventure',
        pace: 'Balanced',
        mandatory_locations: ['Colombo', 'Kandy'],
        excluded_locations: [],
        specific_interests: ['Beach', 'Wildlife'],
        num_travelers: 2
      };
      
      const pythonOutput = JSON.stringify({
        days: 7,
        locations: ['Colombo', 'Kandy', 'Nuwara Eliya']
      });
      
      // Mock successful Python process
      const triggerProcessEvents = mockSpawnProcess(true, pythonOutput);
      
      // Create a promise that resolves when the process is done
      const resultPromise = generateTravelPlan(travelData);
      
      // Trigger the process events
      triggerProcessEvents();
      
      // Wait for the promise to resolve
      const result = await resultPromise;
      
      // Verify spawn was called with correct arguments
      expect(spawn).toHaveBeenCalledWith('python3', expect.any(Array));
      
      // Verify the result
      expect(result).toHaveProperty('title', 'Test Trip');
    });

    it('should throw an error when required fields are missing', async () => {
      // Setup incomplete data
      const incompleteData = {
        start_date: '2023-01-01',
        // Missing other required fields
      };
      
      // Call the function and expect it to throw
      await expect(
        generateTravelPlan(incompleteData)
      ).rejects.toThrow('Missing required fields in request');
    });

    it('should throw an error when Python script fails', async () => {
      // Setup test data
      const travelData = {
        start_date: '2023-01-01',
        end_date: '2023-01-07',
        preferences: 'Beach, Adventure',
        pace: 'Balanced',
        mandatory_locations: ['Colombo', 'Kandy'],
        excluded_locations: [],
        specific_interests: ['Beach', 'Wildlife'],
        num_travelers: 2
      };
      
      // Mock Python process that fails
      const triggerProcessEvents = mockSpawnProcess(false);
      
      // Create a promise that should reject
      const resultPromise = generateTravelPlan(travelData);
      
      // Trigger the process events
      triggerProcessEvents();
      
      // Wait for the promise to reject
      await expect(resultPromise).rejects.toThrow('Python script error');
    });

    it('should throw an error when Python output is not valid JSON', async () => {
      // Setup test data
      const travelData = {
        start_date: '2023-01-01',
        end_date: '2023-01-07',
        preferences: 'Beach, Adventure',
        pace: 'Balanced',
        mandatory_locations: ['Colombo', 'Kandy'],
        excluded_locations: [],
        specific_interests: ['Beach', 'Wildlife'],
        num_travelers: 2
      };
      
      // Mock successful Python process but with invalid JSON output
      const triggerProcessEvents = mockSpawnProcess(true, 'Not JSON data');
      
      // Create a promise that should reject
      const resultPromise = generateTravelPlan(travelData);
      
      // Trigger the process events
      triggerProcessEvents();
      
      // Wait for the promise to reject
      await expect(resultPromise).rejects.toThrow('Error parsing Python output');
    });

    it('should throw an error when Gemini response is not valid JSON', async () => {
      // Setup test data
      const travelData = {
        start_date: '2023-01-01',
        end_date: '2023-01-07',
        preferences: 'Beach, Adventure',
        pace: 'Balanced',
        mandatory_locations: ['Colombo', 'Kandy'],
        excluded_locations: [],
        specific_interests: ['Beach', 'Wildlife'],
        num_travelers: 2
      };
      
      const pythonOutput = JSON.stringify({
        days: 7,
        locations: ['Colombo', 'Kandy', 'Nuwara Eliya']
      });
      
      // Mock successful Python process
      const triggerProcessEvents = mockSpawnProcess(true, pythonOutput);
      
      // Mock Gemini API to return invalid JSON
      mockTextFn.mockReturnValueOnce('Not JSON data');
      
      // Create a promise that should reject
      const resultPromise = generateTravelPlan(travelData);
      
      // Trigger the process events
      triggerProcessEvents();
      
      // Wait for the promise to reject
      await expect(resultPromise).rejects.toThrow('Error parsing Gemini response');
    });
    
    it('should handle properly formatted JSON from Gemini with markdown', async () => {
      // Setup test data
      const travelData = {
        start_date: '2023-01-01',
        end_date: '2023-01-07',
        preferences: 'Beach, Adventure',
        pace: 'Balanced',
        mandatory_locations: ['Colombo', 'Kandy'],
        excluded_locations: [],
        specific_interests: ['Beach', 'Wildlife'],
        num_travelers: 2
      };
      
      const pythonOutput = JSON.stringify({
        days: 7,
        locations: ['Colombo', 'Kandy', 'Nuwara Eliya']
      });
      
      // Mock successful Python process
      const triggerProcessEvents = mockSpawnProcess(true, pythonOutput);
      
      // Mock Gemini API to return JSON with markdown formatting
      mockTextFn.mockReturnValueOnce('```json\n{"title":"Test Trip","trip_summary":{"trip_duration":7}}\n```');
      
      // Create a promise
      const resultPromise = generateTravelPlan(travelData);
      
      // Trigger the process events
      triggerProcessEvents();
      
      // Wait for the promise to resolve
      const result = await resultPromise;
      
      // Verify the result
      expect(result).toHaveProperty('title', 'Test Trip');
    });
    
    it('should verify the correct prompt is sent to Gemini', async () => {
      // Setup test data
      const travelData = {
        start_date: '2023-01-01',
        end_date: '2023-01-07',
        preferences: 'Beach, Adventure',
        pace: 'Balanced',
        mandatory_locations: ['Colombo', 'Kandy'],
        excluded_locations: [],
        specific_interests: ['Beach', 'Wildlife'],
        num_travelers: 2
      };
      
      const pythonOutput = JSON.stringify({
        days: 7,
        locations: ['Colombo', 'Kandy', 'Nuwara Eliya']
      });
      
      // Mock successful Python process
      const triggerProcessEvents = mockSpawnProcess(true, pythonOutput);
      
      // Reset generate content mock to track calls
      mockGenerateContentFn.mockClear();
      
      // Create a promise
      const resultPromise = generateTravelPlan(travelData);
      
      // Trigger the process events
      triggerProcessEvents();
      
      // Wait for the promise to resolve
      await resultPromise;
      
      // Verify the prompt contains the Python output
      expect(mockGenerateContentFn).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(JSON.parse(pythonOutput), null, 2))
      );
    });
  });
});