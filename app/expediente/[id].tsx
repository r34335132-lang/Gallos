import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

export default function BeneficiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const canAdminister = ["admin", "capturista", "validador"].includes(profile?.role || "");

  const [beneficiary, setBeneficiary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBeneficiary = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("beneficiaries").select("*").eq("id", id).single();
      if (error) throw error;
      setBeneficiary(data);
    } catch (error) {
      console.error("Error cargando beneficiario:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBeneficiary();
  }, [id]);

  const updateBeneficiary = async (payload: Record<string, boolean | string>) => {
    try {
      const { error } = await supabase.from("beneficiaries").update(payload).eq("id", id);
      if (error) throw error;
      await fetchBeneficiary();
    } catch (error: any) {
      if (error?.code === "PGRST204") {
        Alert.alert(
          "Migración pendiente",
          "La base de datos aún no tiene los campos de estado documental. Aplica la migración 202606040001_privacy_app_store_cleanup.sql y vuelve a intentar."
        );
        return;
      }
      Alert.alert("Error", "No se pudo actualizar el beneficiario.");
    }
  };

  const confirmStatus = (status: string) => {
    Alert.alert("Confirmar", `¿Cambiar el estatus a ${status}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => updateBeneficiary({ status }) },
    ]);
  };

  const toggleDocument = (field: "carta_responsiva_recibida" | "certificado_medico_recibido", value: boolean) => {
    updateBeneficiary({ [field]: value });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Cargando beneficiario...</Text>
      </View>
    );
  }

  if (!beneficiary) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Beneficiario no encontrado</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 10 }}>Regresar</Text>
        </Pressable>
      </View>
    );
  }

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
        <Text style={styles.headerTitle} numberOfLines={1}>Beneficiario</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.identityCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }]}>
          {beneficiary.photo_url ? (
            <Image source={{ uri: beneficiary.photo_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarLg, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="user" size={36} color={colors.primary} />
            </View>
          )}
          <View style={styles.identityInfo}>
            <Text style={[styles.benefName, { color: colors.foreground }]}>{beneficiary.name}</Text>
            {canAdminister && <Text style={[styles.folioText, { color: colors.primary }]}>Folio: {beneficiary.folio || "Sin folio"}</Text>}
            <View style={{ marginTop: 4 }}>
              <StatusBadge status={beneficiary.status || "pendiente"} />
            </View>
          </View>
        </View>

        {canAdminister && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Información administrativa</Text>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Tutor asignado</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{beneficiary.tutor_name || "No registrado"}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: "transparent" }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Fecha de registro</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {beneficiary.registration_date || beneficiary.created_at?.split("T")[0] || "Desconocida"}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estado de Documentación</Text>
          <DocumentStateRow
            label="Carta Responsiva"
            value={Boolean(beneficiary.carta_responsiva_recibida)}
            editable={canAdminister}
            onChange={(value) => toggleDocument("carta_responsiva_recibida", value)}
          />
          <DocumentStateRow
            label="Certificado Médico"
            value={Boolean(beneficiary.certificado_medico_recibido)}
            editable={canAdminister}
            onChange={(value) => toggleDocument("certificado_medico_recibido", value)}
          />
        </View>

        {canAdminister && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estatus del beneficiario</Text>
            <View style={styles.adminButtons}>
              <Pressable style={[styles.adminBtn, { backgroundColor: colors.success }]} onPress={() => confirmStatus("aprobado")}>
                <Feather name="check" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Aprobar</Text>
              </Pressable>
              <Pressable style={[styles.adminBtn, { backgroundColor: colors.destructive }]} onPress={() => confirmStatus("rechazado")}>
                <Feather name="x" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Rechazar</Text>
              </Pressable>
              <Pressable style={[styles.adminBtn, { backgroundColor: colors.warning }]} onPress={() => confirmStatus("en_revision")}>
                <Feather name="edit-2" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>En revisión</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DocumentStateRow({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: boolean;
  editable: boolean;
  onChange: (value: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.docStateRow, { borderTopColor: colors.border }]}>
      <View style={styles.docStateText}>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
          {value ? "Recibido" : "Pendiente"}
        </Text>
      </View>
      {editable ? (
        <View style={styles.toggleGroup}>
          <Pressable
            style={[styles.toggleBtn, { backgroundColor: value ? "#059669" : colors.muted, borderColor: value ? "#059669" : colors.border }]}
            onPress={() => onChange(true)}
          >
            <Text style={[styles.toggleText, { color: value ? "#FFFFFF" : colors.foreground }]}>Sí</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, { backgroundColor: !value ? "#92400E" : colors.muted, borderColor: !value ? "#92400E" : colors.border }]}
            onPress={() => onChange(false)}
          >
            <Text style={[styles.toggleText, { color: !value ? "#FFFFFF" : colors.foreground }]}>No</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={[styles.stateValue, { color: value ? "#059669" : "#92400E" }]}>{value ? "Recibido" : "Pendiente"}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  identityCard: { flexDirection: "row", gap: 16, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: "center" },
  avatarLg: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#E5E7EB" },
  identityInfo: { flex: 1, gap: 4 },
  benefName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  folioText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 0, overflow: "hidden" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  infoRow: { paddingVertical: 10, borderBottomWidth: 1, gap: 4 },
  infoLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  docStateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingVertical: 12, gap: 12 },
  docStateText: { flex: 1, gap: 2 },
  stateValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  toggleGroup: { flexDirection: "row", gap: 8 },
  toggleBtn: { minWidth: 48, alignItems: "center", borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  toggleText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  adminButtons: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  adminBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  adminBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
