import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole =
  | "admin"
  | "capturista"
  | "validador"
  | "comunicacion"
  | "tutor"
  | "patrocinador"
  | "visitante";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isCapturista: boolean;
  isTutor: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USERS: Record<string, User & { password: string }> = {
  "admin@gallos.mx": {
    id: "u1",
    name: "Carlos Mendoza",
    email: "admin@gallos.mx",
    password: "123456",
    role: "admin",
    phone: "442-555-0001",
  },
  "tutor@gallos.mx": {
    id: "u2",
    name: "María González",
    email: "tutor@gallos.mx",
    password: "123456",
    role: "tutor",
    phone: "442-555-0002",
  },
  "capturista@gallos.mx": {
    id: "u3",
    name: "Roberto Sánchez",
    email: "capturista@gallos.mx",
    password: "123456",
    role: "capturista",
    phone: "442-555-0003",
  },
  "patrocinador@gallos.mx": {
    id: "u4",
    name: "Grupo Industrial del Norte",
    email: "patrocinador@gallos.mx",
    password: "123456",
    role: "patrocinador",
    phone: "442-555-0004",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("user")
      .then((stored) => {
        if (stored) setUser(JSON.parse(stored));
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, _password: string): Promise<boolean> => {
    const found = MOCK_USERS[email.toLowerCase()];
    if (!found) return false;
    const { password: _pw, ...userData } = found;
    setUser(userData);
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    return true;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === "admin",
        isCapturista:
          user?.role === "capturista" || user?.role === "admin",
        isTutor: user?.role === "tutor",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
