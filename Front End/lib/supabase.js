import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const supabaseUrl = 'https://dgutsdkqqsbfcfgzxsuc.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRndXRzZGtxcXNiZmNmZ3p4c3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjI1NTgsImV4cCI6MjA1NTk5ODU1OH0.IXX2IZWJs6o7-Ep4Ii6TB_L3iireXD6hcBwbeSsZktE'

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