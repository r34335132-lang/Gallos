import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardRoute() {
  const colors = useColors();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (isAdmin) router.replace("/admin");
    else router.replace("/(tabs)");
  }, [loading, user, isAdmin]);

  return (
    <PublicScaffold title="Dashboard" subtitle="Acceso seguro por rol para tutores, administracion y comunicacion.">
      <View style={styles.center}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        <Text style={[styles.text, { color: colors.mutedForeground }]}>Redirigiendo a tu panel...</Text>
        {!loading && !user ? (
          <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => router.replace("/login")}>
            <Text style={styles.btnText}>Iniciar sesion</Text>
          </Pressable>
        ) : null}
      </View>
    </PublicScaffold>
  );
}

const styles = StyleSheet.create({
  center: { minHeight: 260, alignItems: "center", justifyContent: "center", gap: 14 },
  text: { fontFamily: "Inter_500Medium" },
  btn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 12 },
  btnText: { color: "#fff", fontFamily: "Inter_700Bold" },
});
