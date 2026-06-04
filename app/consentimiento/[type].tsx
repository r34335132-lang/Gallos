import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function ConsentimientoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Documentos</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "12" }]}>
          <Feather name="download" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Formato no disponible en esta vista</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Descarga los formatos desde la sección Documentos y envíalos directamente a la asociación para su revisión.
        </Text>
        <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => router.replace("/documentos" as any)}>
          <Text style={styles.buttonText}>Ir a Documentos</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "center" },
  button: { marginTop: 8, height: 48, borderRadius: 12, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_700Bold" },
});
