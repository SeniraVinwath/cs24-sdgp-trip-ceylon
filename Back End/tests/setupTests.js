// This file contains setup code for Jest tests
const dotenv = require('dotenv');

// Load environment variables from .env.test file if it exists
dotenv.config({ path: '.env.test' });

// Mock environment variables if not present
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test-supabase-url.com';
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || 'test-supabase-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-gemini-api-key';

// Global setup
beforeAll(() => {
  // Any setup code that needs to run before all tests
});

// Global teardown
afterAll(() => {
  // Any cleanup code that needs to run after all tests
});