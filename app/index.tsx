import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { isAdminRole } from "@/lib/appData";

export default function Index() {
  const { user, loading } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (loading) return;
    async function route() {
      const seen = await AsyncStorage.getItem("hasSeenOnboarding");
      if (!seen) {
        router.replace("/onboarding");
      } else if (!user) {
        router.replace("/login");
      } else if (isAdminRole(user.role)) {
        router.replace("/admin");
      } else {
        router.replace("/(tabs)");
      }
    }
    route();
  }, [loading, user]);

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
