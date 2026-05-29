import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useRootNavigationState } from "expo-router"; // <-- Importamos useRootNavigationState
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { isAdminRole } from "@/lib/appData";

export default function Index() {
  const { user, loading } = useAuth();
  const colors = useColors();
  
  // Obtenemos el estado interno del router de Expo
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 1. Si Supabase sigue cargando la sesión, esperamos.
    if (loading) return;
    
    // 2. Si el sistema de navegación de Expo AÚN NO ESTÁ LISTO, esperamos.
    if (!rootNavigationState?.key) return;

    async function route() {
      try {
        const seen = await AsyncStorage.getItem("hasSeenOnboarding");
        
        // 3. Usamos setTimeout para evitar colisiones en el ciclo de renderizado
        setTimeout(() => {
          if (!seen) {
            router.replace("/onboarding");
          } else if (!user) {
            router.replace("/login");
          } else if (isAdminRole(user.role)) {
            router.replace("/admin");
          } else {
            router.replace("/(tabs)");
          }
        }, 0);
      } catch (error) {
        console.error("Error validando el ruteo:", error);
        // Fallback de seguridad por si falla el AsyncStorage
        router.replace("/login");
      }
    }
    
    route();
  }, [loading, user, rootNavigationState?.key]); // <-- Dependencia clave agregada

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <ActivityIndicator color="#FFFFFF" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});