import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { isAdminRole, type UserRole } from "@/lib/appData";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  user: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  user: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // FIX: Cambiado a maybeSingle() para que no explote por el RLS

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error("Error al obtener perfil de base de datos:", err);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id).then(() => setLoading(false));
        } else {
          setProfile(null);
          setLoading(false);
        }
      });
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setLoading(false);
    router.replace("/login");
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, user: profile, isAdmin: isAdminRole(profile?.role), loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
