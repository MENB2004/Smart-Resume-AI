import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxdmajvtpcgswgqhtecr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZG1hanZ0cGNnc3dncWh0ZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjg1MzQsImV4cCI6MjA5NDcwNDUzNH0.zV1GIKFAEId3kfcFYBSi3IH9te5SSdvvV-muNg6ZK1s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
