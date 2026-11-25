import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { goBack } from "@/lib/navigation";
import { IS_PUBLIC_APP } from "@/lib/appVariant";

export default function PrivacidadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <Pressable onPress={() => goBack("/")} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacidad</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}>
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + "12" }]}>
            <Feather name="shield" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Privacidad</Text>
          <Text style={[styles.body, { color: colors.foreground }]}>
            {IS_PUBLIC_APP
              ? "Esta aplicación es informativa: muestra noticias, eventos, galería, campañas, patrocinadores y formas de apoyar a Gallos Smiling. No requiere crear una cuenta. Solo recopilamos los datos que escribes voluntariamente en el formulario de contacto (nombre, teléfono, correo y mensaje), y únicamente para responderte. Si aceptas las notificaciones, guardamos un identificador anónimo del dispositivo, sin vincularlo a ninguna persona, solo para avisarte de nuevas noticias y eventos."
              : "Gallos Smiling utiliza esta aplicación para comunicación institucional, noticias, eventos, actividades, patrocinadores y seguimiento básico de documentación. La aplicación no muestra diagnósticos médicos, historiales clínicos ni expedientes médicos a los tutores."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
  scroll: { padding: 20 },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  body: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
});
