import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatsCard } from "@/components/StatsCard";
import { useColors } from "@/hooks/useColors";
import {
  deriveStats,
  EMPTY_STATS,
  mapBeneficiary,
  mapDocument,
  mapSponsor,
  mapStats,
  type Beneficiary,
  type Stats,
} from "@/lib/appData";
import { supabase } from "@/lib/supabase";

function BarChart({ data, colors }: { data: { label: string; value: number; max: number }[]; colors: ReturnType<typeof useColors> }) {
  if (data.length === 0) {
    return (
      <View style={barStyles.empty}>
        <Text style={[barStyles.emptyText, { color: colors.mutedForeground }]}>Sin datos para mostrar.</Text>
      </View>
    );
  }

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
                  width: `${Math.max(4, (item.value / item.max) * 100)}%`,
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
  empty: { paddingVertical: 10 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

export default function EstadisticasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const [statsRes, beneficiariesRes, documentsRes, sponsorsRes] = await Promise.all([
          supabase.from("app_stats").select("*").maybeSingle(),
          supabase.from("beneficiaries").select("*"),
          supabase.from("documents").select("*"),
          supabase.from("sponsors").select("*"),
        ]);

        if (!mounted) return;

        const mappedBeneficiaries = (beneficiariesRes.data || []).map(mapBeneficiary);
        setBeneficiaries(mappedBeneficiaries);
        setStats(
          statsRes.data
            ? mapStats(statsRes.data)
            : deriveStats(
                mappedBeneficiaries,
                (documentsRes.data || []).map(mapDocument),
                (sponsorsRes.data || []).map(mapSponsor)
              )
        );
      } catch (error) {
        console.error("Error al cargar estadisticas:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  const buildChart = (items: { label: string; value: number }[]) => {
    const max = Math.max(1, ...items.map((item) => item.value));
    return items.map((item) => ({ ...item, max }));
  };

  const byMunicipality = useMemo(() => {
    const counts = beneficiaries.reduce<Record<string, number>>((acc, item) => {
      const key = item.municipality || "Sin municipio";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return buildChart(Object.entries(counts).map(([label, value]) => ({ label, value })));
  }, [beneficiaries]);

  const byStatus = useMemo(() => {
    const labels: Record<string, string> = {
      activo: "Activo",
      aprobado: "Aprobado",
      en_revision: "En revisión",
      pendiente: "Pendiente",
      rechazado: "Rechazado",
    };
    const counts = beneficiaries.reduce<Record<string, number>>((acc, item) => {
      const key = labels[item.status] ?? item.status ?? "Sin estado";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return buildChart(Object.entries(counts).map(([label, value]) => ({ label, value })));
  }, [beneficiaries]);

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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Cargando métricas...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Métricas generales</Text>
            <View style={styles.grid}>
              <StatsCard label="Total beneficiarios" value={stats.totalBeneficiaries} icon="users" color={colors.primary} />
              <StatsCard label="Beneficiarios activos" value={stats.activeRecords} icon="users" color="#059669" />
            </View>
            <View style={styles.grid}>
              <StatsCard label="Apoyos entregados" value={stats.supportDelivered} icon="gift" color="#7C3AED" />
              <StatsCard label="Familias apoyadas" value={stats.familiesHelped} icon="heart" color="#DC2626" />
            </View>
            <View style={styles.grid}>
              <StatsCard label="Patrocinadores activos" value={stats.activeSponsors} icon="award" color="#D97706" />
              <StatsCard label="Docs pendientes" value={stats.pendingDocuments} icon="paperclip" color="#0891B2" />
            </View>
          </View>

          <View style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.foreground }]}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>Beneficiarios por municipio</Text>
            <BarChart data={byMunicipality} colors={colors} />
          </View>

          <View style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.foreground }]}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>Por estado del beneficiario</Text>
            <BarChart data={byStatus} colors={colors} />
          </View>

          <Pressable
            style={[styles.exportButton, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}
          >
            <Feather name="download" size={18} color={colors.primary} />
            <Text style={[styles.exportText, { color: colors.primary }]}>Exportar reporte</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
