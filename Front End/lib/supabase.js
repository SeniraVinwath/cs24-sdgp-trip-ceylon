import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://djllbgnbqimkomaorqpd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbGxiZ25icWlta29tYW9ycXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MzU1NjgsImV4cCI6MjA1NzAxMTU2OH0.zK6LFnlqK2EHAFwc_dO5O7MyMQyGuz86wHKs8oNYA9I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Handle session refresh when app comes back to foreground
if (Platform.OS !== 'web') {
  const { AppState } = require('react-native');
  
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}