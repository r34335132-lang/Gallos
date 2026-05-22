import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
import { BENEFICIARIES, type BeneficiaryStatus } from "@/data/mock";
import { useColors } from "@/hooks/useColors";

const STATUSES: { value: BeneficiaryStatus | "todos"; label: string }[] = [
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
  const { isAdmin, isTutor, user } = useAuth();
  const tabBarHeight = Platform.OS === "web" ? 84 : 60;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BeneficiaryStatus | "todos">("todos");

  const beneficiaries = isTutor && !isAdmin
    ? BENEFICIARIES.filter((_, i) => i < 2)
    : BENEFICIARIES;

  const filtered = beneficiaries.filter((b) => {
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.folio.toLowerCase().includes(search.toLowerCase()) ||
      b.curp.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
        <Text style={styles.headerTitle}>Expedientes</Text>
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
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
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
            <Feather name="folder" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Sin resultados
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No se encontraron expedientes con los filtros seleccionados.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  filterRow: { gap: 8, marginBottom: 12 },
  filterList: { gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  count: { fontSize: 13, fontFamily: "Inter_400Regular" },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
