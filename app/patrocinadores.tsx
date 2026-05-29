import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SponsorCard from "@/components/SponsorCard";
import { useColors } from "@/hooks/useColors";
import { mapSponsor, type Sponsor, type SponsorLevel } from "@/lib/appData";
import { supabase } from "@/lib/supabase";

const LEVEL_FILTERS: { value: SponsorLevel | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "Oro", label: "Oro" },
  { value: "Plata", label: "Plata" },
  { value: "Bronce", label: "Bronce" },
  { value: "Benefactor principal", label: "Benefactor" },
  { value: "Apoyo en especie", label: "En especie" },
];

export default function PatrocinadoresScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [levelFilter, setLevelFilter] = useState<SponsorLevel | "todos">("todos");
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSponsors = async () => {
      try {
        const { data, error } = await supabase
          .from("sponsors")
          .select("*");

        if (error) throw error;
        
        if (mounted && data) {
          // Mapeamos y ordenamos: Oro primero, luego Plata, luego Bronce, etc.
          const sorted = data.map(mapSponsor).sort((a, b) => {
            const rank = { oro: 1, plata: 2, bronce: 3 };
            const rankA = rank[a.level.toLowerCase() as keyof typeof rank] || 4;
            const rankB = rank[b.level.toLowerCase() as keyof typeof rank] || 4;
            return rankA - rankB;
          });
          setSponsors(sorted);
        }
      } catch (error) {
        console.error("Error al cargar patrocinadores:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSponsors();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = levelFilter === "todos"
    ? sponsors
    : sponsors.filter((s) => s.level === levelFilter);

  const totalBeneficiaries = sponsors.reduce((sum, s) => sum + s.beneficiaries, 0);

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
        <Text style={styles.headerTitle}>Patrocinadores</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Cargando patrocinadores...</Text>
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Aviso Legal para pasar filtros de Apple y Google (App Store / Play Store) */}
            <View style={[styles.disclaimerBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <Feather name="heart" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
              <Text style={[styles.disclaimerText, { color: colors.foreground }]}>
                Agradecemos profundamente a nuestros contribuyentes y patrocinadores por hacer posible la labor de la Fundación Gallos Smiling. Este espacio es un reconocimiento de carácter puramente informativo y de agradecimiento a su generosidad. 
                {"\n\n"}
                <Text style={{ fontFamily: 'Inter_700Bold' }}>Nota:</Text> No se realizan transacciones, donaciones ni pagos a través de esta aplicación.
              </Text>
            </View>

            {/* Impact summary */}
            <View style={[styles.impactCard, { backgroundColor: colors.primary }]}>
              <View style={styles.impactStat}>
                <Text style={styles.impactValue}>{sponsors.filter((s) => s.status === "activo").length}</Text>
                <Text style={styles.impactLabel}>Patrocinadores activos</Text>
              </View>
              <View style={[styles.impactDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
              <View style={styles.impactStat}>
                <Text style={styles.impactValue}>{totalBeneficiaries}</Text>
                <Text style={styles.impactLabel}>Beneficiarios apoyados</Text>
              </View>
            </View>

            {/* Tagline */}
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Nuestros patrocinadores hacen posible el trabajo de la Fundación Gallos Smiling. Cada empresa y persona que apoya representa una historia de cambio.
            </Text>

            {/* Level filters */}
            <FlatList
              data={LEVEL_FILTERS}
              keyExtractor={(item) => item.value}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: levelFilter === item.value ? colors.primary : colors.muted,
                      borderColor: levelFilter === item.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setLevelFilter(item.value)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: levelFilter === item.value ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />

            <Text style={[styles.count, { color: colors.mutedForeground }]}>
              {filtered.length} patrocinador{filtered.length !== 1 ? "es" : ""}
            </Text>
          </>
        }
        renderItem={({ item }) => <SponsorCard sponsor={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="award" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No hay patrocinadores en este nivel
            </Text>
          </View>
        }
      />
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
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  disclaimerBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  disclaimerText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, textAlign: 'center' },
  impactCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  impactStat: { flex: 1, alignItems: "center" },
  impactValue: { color: "#FFFFFF", fontSize: 32, fontFamily: "Inter_700Bold" },
  impactLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  impactDivider: { width: 1, height: 40 },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 12, // Ajustado el margen
  },
  filterList: { gap: 8, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  count: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});