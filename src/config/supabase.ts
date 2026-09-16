import { createClient } from "@supabase/supabase-js";
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MANUAL_CONFIG } from './manual-config';

// Get from .env file or app.json extra config
let supabaseURL = Constants.expoConfig?.extra?.supabaseUrl || 
                    process.env.EXPO_PUBLIC_SUPABASE_URL || 
                    '';

let supabaseApiKey = Constants.expoConfig?.extra?.supabaseApiKey || 
                       process.env.EXPO_PUBLIC_SUPABASE_API_KEY || 
                       '';

// Fallback to manual config if env vars not found
if (!supabaseURL && MANUAL_CONFIG.SUPABASE_URL) {
    console.log('📝 Using manual config for Supabase');
    supabaseURL = MANUAL_CONFIG.SUPABASE_URL;
    supabaseApiKey = MANUAL_CONFIG.SUPABASE_API_KEY;
}

// Warn if not configured
if (!supabaseURL || !supabaseApiKey) {
    console.warn("⚠️ Supabase not configured. Please add credentials to .env file");
    console.log("\n🔧 QUICK FIX:");
    console.log("1. Copy credentials from: ../FYP/.env");
    console.log("2. Paste into: react-native-app/src/config/manual-config.ts\n");
}

// Create client with AsyncStorage for session persistence (React Native requirement)
const supabaseClient = createClient(
    supabaseURL || 'https://placeholder.supabase.co',
    supabaseApiKey || 'placeholder-key',
    {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);

// Export flag to check if properly configured
export const isSupabaseConfigured = !!(supabaseURL && supabaseApiKey);

export { supabaseClient, supabaseURL, supabaseApiKey };

