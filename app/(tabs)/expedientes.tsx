import { Feather } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeneficiaryCard } from "@/components/BeneficiaryCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { mapBeneficiary, type Beneficiary } from "@/lib/appData";

const STATUSES: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "aprobado", label: "Aprobado" },
  { value: "activo", label: "Activo" },
  { value: "rechazado", label: "Rechazado" },
];

export default function ExpedientesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  
  const tabBarHeight = Platform.OS === "web" ? 84 : 60;
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  
  // Estados para la base de datos
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Verificamos si el usuario tiene rol administrativo
  const canSeeAllExpedientes = ["admin", "capturista", "validador"].includes(profile?.role || "");

  const fetchBeneficiaries = async () => {
    try {
      if (!profile) return;

      // Iniciamos la consulta a la tabla
      let query = supabase
        .from("beneficiaries")
        .select("*")
        .order("created_at", { ascending: false }); // Los más recientes primero

      // Si NO es administrador, filtramos solo los de su cuenta (Tutor)
      if (!canSeeAllExpedientes) {
        query = query.eq("tutor_id", profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setBeneficiaries((data || []).map(mapBeneficiary));
    } catch (error) {
      console.error("Error al cargar expedientes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar datos al abrir la pantalla o cuando el perfil cambie
  useEffect(() => {
    fetchBeneficiaries();
  }, [profile]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBeneficiaries();
  };

  // Filtrado local (Buscador y Pestañas de Estatus)
  const filtered = beneficiaries.filter((b) => {
    const matchSearch =
      !search ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.folio?.toLowerCase().includes(search.toLowerCase()) ||
      b.curp?.toLowerCase().includes(search.toLowerCase());
      
    const matchStatus = statusFilter === "todos" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER FIJO */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <Text style={styles.headerTitle}>
          {canSeeAllExpedientes ? "Todos los Expedientes" : "Mis Beneficiarios"}
        </Text>
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, folio o CURP..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={10}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ESTADO DE CARGA */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Cargando expedientes...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarHeight + insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            <View style={styles.filterRow}>
              <FlatList
                data={STATUSES}
                keyExtractor={(item) => item.value}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: statusFilter === item.value ? colors.primary : colors.muted,
                        borderColor: statusFilter === item.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setStatusFilter(item.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: statusFilter === item.value ? "#FFFFFF" : colors.mutedForeground },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                )}
              />
              <Text style={[styles.count, { color: colors.mutedForeground }]}>
                {filtered.length} expediente{filtered.length !== 1 ? "s" : ""}
              </Text>
            </View>
          }
          renderItem={({ item }) => <BeneficiaryCard beneficiary={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="folder" size={32} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Sin resultados
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {search.length > 0 || statusFilter !== "todos" 
                  ? "No se encontraron expedientes con los filtros actuales."
                  : canSeeAllExpedientes 
                    ? "Aún no hay expedientes registrados en la plataforma." 
                    : "Aún no has registrado a ningún beneficiario."}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterRow: { gap: 12, marginBottom: 16 },
  filterList: { gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  count: { fontSize: 13, fontFamily: "Inter_400Regular", paddingHorizontal: 4 },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
