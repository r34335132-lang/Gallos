import 'react-native-url-polyfill/auto';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Reemplaza esto con tus credenciales de tu proyecto de Supabase
const supabaseUrl = "https://jfutdmtjcunkvefojlgm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdXRkbXRqY3Vua3ZlZm9qbGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzgzOTMsImV4cCI6MjA5NTExNDM5M30.-qOYJGiHvhMzppSYi8yLS4s983q5Uqg267uiBK8Mcv8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});