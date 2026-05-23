import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export type UserRole =
  | "admin"
  | "capturista"
  | "validador"
  | "comunicacion"
  | "tutor"
  | "patrocinador"
  | "visitante";

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
  isGuest: boolean; // NUEVO: Saber si está como invitado
  loading: boolean;
  signInAsGuest: () => Promise<void>; // NUEVO: Función para entrar sin cuenta
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  isGuest: false,
  loading: true,
  signInAsGuest: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

// Perfil temporal falso para que la app sepa que es un visitante
const GUEST_PROFILE: UserProfile = {
  id: "guest-id",
  name: "Visitante",
  email: "invitado@gallossmiling.com",
  role: "visitante",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
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
      // 1. Revisar si la persona estaba navegando como invitado previamente
      const guestStatus = await AsyncStorage.getItem("isGuest");
      if (guestStatus === "true") {
        setIsGuest(true);
        setProfile(GUEST_PROFILE);
      }

      // 2. Revisar sesión real de Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          setIsGuest(false);
          AsyncStorage.removeItem("isGuest"); // Limpiamos rastro de invitado si inicia sesión real
          fetchProfile(session.user.id).then(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });
    };

    initAuth();

    // 3. Escuchar cambios (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession?.user) {
          setIsGuest(false);
          await AsyncStorage.removeItem("isGuest");
          await fetchProfile(currentSession.user.id);
        } else {
          // Si cierra sesión pero NO es invitado, limpiamos el perfil
          const guestStatus = await AsyncStorage.getItem("isGuest");
          if (guestStatus !== "true") {
            setProfile(null);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInAsGuest = async () => {
    setLoading(true);
    await AsyncStorage.setItem("isGuest", "true");
    setIsGuest(true);
    setProfile(GUEST_PROFILE); // Le asignamos el rol "visitante" globalmente
    setLoading(false);
    
    // Lo mandamos directo a la galería (o a donde prefieras)
    router.replace("/galeria"); 
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("isGuest"); // Quitamos el estado de invitado
    setIsGuest(false);
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
    <AuthContext.Provider value={{ session, profile, isGuest, loading, signInAsGuest, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);