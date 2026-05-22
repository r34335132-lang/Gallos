import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatsCard } from "@/components/StatsCard";
import { STATS } from "@/data/mock";
import { useColors } from "@/hooks/useColors";

const ADMIN_SECTIONS = [
  { icon: "folder" as const, label: "Expedientes", desc: "Gestionar expedientes y beneficiarios", route: "/(tabs)/expedientes", color: "#1A4FA8" },
  { icon: "file-text" as const, label: "Noticias", desc: "Publicar y editar noticias", route: "/(tabs)/noticias", color: "#059669" },
  { icon: "bell" as const, label: "Comunicados", desc: "Gestionar comunicados oficiales", route: "/notificaciones", color: "#DC2626" },
  { icon: "award" as const, label: "Patrocinadores", desc: "Administrar patrocinadores y donadores", route: "/patrocinadores", color: "#D97706" },
  { icon: "bar-chart-2" as const, label: "Estadísticas", desc: "Ver reportes y métricas", route: "/estadisticas", color: "#7C3AED" },
  { icon: "users" as const, label: "Usuarios", desc: "Gestión de cuentas y roles", route: "/perfil", color: "#0891B2" },
];

export default function AdminScreen() {
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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Panel administrador</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Resumen general
          </Text>
          <View style={styles.statsGrid}>
            <StatsCard label="Total beneficiarios" value={STATS.totalBeneficiaries} icon="users" color={colors.primary} />
            <StatsCard label="Solicitudes pendientes" value={STATS.pendingRequests} icon="clock" color="#D97706" />
          </View>
          <View style={styles.statsGrid}>
            <StatsCard label="Documentos pendientes" value={STATS.pendingDocuments} icon="paperclip" color="#DC2626" />
            <StatsCard label="Patrocinadores activos" value={STATS.activeSponsors} icon="award" color="#059669" />
          </View>
          <View style={styles.statsGrid}>
            <StatsCard label="Aprobados" value={STATS.approvedRequests} icon="check-circle" color="#059669" />
            <StatsCard label="Rechazados" value={STATS.rejectedRequests} icon="x-circle" color="#DC2626" />
          </View>
        </View>

        {/* Pending alerts */}
        <View style={[styles.alertCard, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}>
          <Feather name="alert-triangle" size={18} color="#92400E" />
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, { color: "#92400E" }]}>
              Atención requerida
            </Text>
            <Text style={[styles.alertText, { color: "#78350F" }]}>
              Hay {STATS.pendingRequests} solicitudes pendientes y {STATS.pendingDocuments} documentos sin validar. Revisa los expedientes para avanzar en el proceso.
            </Text>
          </View>
        </View>

        {/* Quick access sections */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Gestión
          </Text>
          {ADMIN_SECTIONS.map((item) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.sectionCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: colors.foreground,
                },
              ]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.sectionIcon, { backgroundColor: item.color + "15" }]}>
                <Feather name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.sectionInfo}>
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
                  {item.desc}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
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
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", gap: 12 },
  alertCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  alertContent: { flex: 1, gap: 4 },
  alertTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  alertText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  sectionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionInfo: { flex: 1, gap: 2 },
  sectionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sectionDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
