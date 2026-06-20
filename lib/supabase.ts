import 'react-native-url-polyfill/auto';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Reemplaza esto con tus credenciales de tu proyecto de Supabase
export const supabaseUrl = "https://jfutdmtjcunkvefojlgm.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdXRkbXRqY3Vua3ZlZm9qbGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MzgzOTMsImV4cCI6MjA5NTExNDM5M30.-qOYJGiHvhMzppSYi8yLS4s983q5Uqg267uiBK8Mcv8";

const serverSafeStorage = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

const authStorage = typeof window === "undefined" ? serverSafeStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== "undefined",
  },
});
