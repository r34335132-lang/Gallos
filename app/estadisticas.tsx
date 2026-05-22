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
import { BENEFICIARIES, STATS } from "@/data/mock";
import { useColors } from "@/hooks/useColors";

function BarChart({ data, colors }: { data: { label: string; value: number; max: number }[]; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={barStyles.container}>
      {data.map((item) => (
        <View key={item.label} style={barStyles.row}>
          <Text style={[barStyles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={[barStyles.track, { backgroundColor: colors.muted }]}>
            <View
              style={[
                barStyles.fill,
                {
                  width: `${(item.value / item.max) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[barStyles.value, { color: colors.foreground }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { width: 90, fontSize: 12, fontFamily: "Inter_400Regular" },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  value: { width: 24, fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" },
});

export default function EstadisticasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const byMunicipality = [
    { label: "Querétaro", value: BENEFICIARIES.filter((b) => b.municipality === "Querétaro").length, max: 10 },
    { label: "El Marqués", value: BENEFICIARIES.filter((b) => b.municipality === "El Marqués").length, max: 10 },
    { label: "Corregidora", value: BENEFICIARIES.filter((b) => b.municipality === "Corregidora").length, max: 10 },
    { label: "Huimilpan", value: BENEFICIARIES.filter((b) => b.municipality === "Huimilpan").length, max: 10 },
    { label: "P. Escobedo", value: BENEFICIARIES.filter((b) => b.municipality === "Pedro Escobedo").length, max: 10 },
  ];

  const byDisability = [
    { label: "Motriz", value: BENEFICIARIES.filter((b) => b.disabilityType === "Motriz").length, max: 10 },
    { label: "Auditiva", value: BENEFICIARIES.filter((b) => b.disabilityType === "Auditiva").length, max: 10 },
    { label: "Visual", value: BENEFICIARIES.filter((b) => b.disabilityType === "Visual").length, max: 10 },
    { label: "Intelectual", value: BENEFICIARIES.filter((b) => b.disabilityType === "Intelectual").length, max: 10 },
    { label: "Comunicación", value: BENEFICIARIES.filter((b) => b.disabilityType === "Comunicación").length, max: 10 },
  ];

  const byStatus = [
    { label: "Activo", value: BENEFICIARIES.filter((b) => b.status === "activo").length, max: 10 },
    { label: "Aprobado", value: BENEFICIARIES.filter((b) => b.status === "aprobado").length, max: 10 },
    { label: "En revisión", value: BENEFICIARIES.filter((b) => b.status === "en_revision").length, max: 10 },
    { label: "Pendiente", value: BENEFICIARIES.filter((b) => b.status === "pendiente").length, max: 10 },
    { label: "Rechazado", value: BENEFICIARIES.filter((b) => b.status === "rechazado").length, max: 10 },
  ];

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
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Key metrics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Métricas generales</Text>
          <View style={styles.grid}>
            <StatsCard label="Total beneficiarios" value={STATS.totalBeneficiaries} icon="users" color={colors.primary} />
            <StatsCard label="Expedientes activos" value={STATS.activeRecords} icon="folder" color="#059669" />
          </View>
          <View style={styles.grid}>
            <StatsCard label="Apoyos entregados" value={STATS.supportDelivered} icon="gift" color="#7C3AED" />
            <StatsCard label="Familias apoyadas" value={STATS.familiesHelped} icon="heart" color="#DC2626" />
          </View>
          <View style={styles.grid}>
            <StatsCard label="Patrocinadores activos" value={STATS.activeSponsors} icon="award" color="#D97706" />
            <StatsCard label="Docs pendientes" value={STATS.pendingDocuments} icon="paperclip" color="#0891B2" />
          </View>
        </View>

        {/* By municipality */}
        <View style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.foreground }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Beneficiarios por municipio</Text>
          <BarChart data={byMunicipality} colors={colors} />
        </View>

        {/* By disability */}
        <View style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.foreground }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Por tipo de discapacidad</Text>
          <BarChart data={byDisability} colors={colors} />
        </View>

        {/* By status */}
        <View style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.foreground }]}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>Por estado del expediente</Text>
          <BarChart data={byStatus} colors={colors} />
        </View>

        {/* Request to export */}
        <Pressable
          style={[styles.exportButton, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
        >
          <Feather name="download" size={18} color={colors.primary} />
          <Text style={[styles.exportText, { color: colors.primary }]}>Exportar reporte</Text>
        </Pressable>
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
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  grid: { flexDirection: "row", gap: 12 },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
  },
  exportText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
