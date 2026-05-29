import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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

export default function ExpedienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  // Perfil para saber si es admin o no
  const { profile } = useAuth();
  const canValidateDocuments = profile?.role === "admin" || profile?.role === "validador";
  const canChangeBeneficiaryStatus = profile?.role === "admin" || profile?.role === "validador";

  const [b, setBeneficiary] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos reales de Supabase
  const fetchExpediente = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener Beneficiario
      const { data: benefData, error: benefError } = await supabase
        .from("beneficiaries")
        .select("*")
        .eq("id", id)
        .single();

      if (benefError) throw benefError;

      // 2. Obtener Documentos
      const { data: docsData, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .eq("beneficiary_id", id);

      if (docsError) throw docsError;

      setBeneficiary(benefData);
      setDocs(docsData || []);
    } catch (error) {
      console.error("Error fetching expediente:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchExpediente();
  }, [id]);

  // Actualizar el Estatus General del Beneficiario
  const changeStatus = async (newStatus: string) => {
    Alert.alert(
      "Confirmar",
      `¿Estás seguro de cambiar el estatus a ${newStatus}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("beneficiaries")
                .update({ status: newStatus })
                .eq("id", id);
                
              if (error) throw error;
              
              Alert.alert("Éxito", "El estatus ha sido actualizado.");
              fetchExpediente(); // Recargamos para ver los cambios
            } catch (error) {
              Alert.alert("Error", "No se pudo actualizar el estatus.");
            }
          }
        }
      ]
    );
  };

  // --- NUEVA FUNCIÓN: Actualizar estatus de un documento individual ---
  const updateDocStatus = async (docId: string, status: string, docName: string) => {
    Alert.alert(
      "Confirmar",
      `¿Marcar "${docName}" como ${status.replace("_", " ")}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("documents")
                .update({ status })
                .eq("id", docId);

              if (error) throw error;
              fetchExpediente(); // Recargar para ver el badge actualizado
            } catch (e) {
              Alert.alert("Error", "No se pudo actualizar el estatus del documento.");
            }
          }
        }
      ]
    );
  };

  // Abrir el documento (Guardamos la URL temporalmente en admin_comment)
  const openDocument = (url: string) => {
    if (url && url.startsWith("http")) {
      Linking.openURL(url);
    } else {
      Alert.alert("Aviso", "No hay un archivo válido vinculado a este documento.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Cargando expediente...</Text>
      </View>
    );
  }

  if (!b && !loading) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          Expediente no encontrado
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 10 }}>Regresar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          Expediente
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Card */}
        <View style={[styles.identityCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }]}>
          <View style={[styles.avatarLg, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="user" size={36} color={colors.primary} />
          </View>
          <View style={styles.identityInfo}>
            <Text style={[styles.benefName, { color: colors.foreground }]}>{b.name}</Text>
            <Text style={[styles.benefAge, { color: colors.mutedForeground }]}>
              {b.age || "?"} años · {b.gender}
            </Text>
            <Text style={[styles.folioText, { color: colors.primary }]}>Folio: {b.folio}</Text>
            <StatusBadge status={b.status} />
          </View>
        </View>

        {/* Info Personal */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Información personal</Text>
          {[
            { label: "CURP", value: b.curp },
            { label: "Fecha de nacimiento", value: b.birth_date },
            { label: "Municipio", value: b.municipality },
            { label: "Zona", value: b.zone },
            { label: "Dirección", value: b.address },
            { label: "Escuela", value: b.school || "No especificada" },
            { label: "Grado", value: b.grade_level || "No especificado" },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Info Médica y Discapacidad */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Medicina y Discapacidad</Text>
          {[
            { label: "Tipo de Sangre", value: b.blood_type || "N/A" },
            { label: "Alergias", value: b.allergies || "Ninguna" },
            { label: "Tipo de discapacidad", value: b.disability_type },
            { label: "Diagnóstico", value: b.diagnosis },
            { label: "Necesidades", value: b.needs },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Logística y Tutor */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tutor y Logística</Text>
          {[
            { label: "Nombre Tutor", value: b.tutor_name },
            { label: "Tel. Emergencia", value: b.emergency_phone || "No especificado" },
            { label: "Talla Ropa / Calzado", value: `${b.shirt_size || '?'} / ${b.shoe_size || '?'}` },
            { label: "Apoyo solicitado", value: b.support_type },
            { label: "Fecha de registro", value: b.registration_date },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Documents */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documentos</Text>
          {docs.length === 0 ? (
            <Text style={[styles.emptyDocs, { color: colors.mutedForeground }]}>
              No hay documentos registrados.
            </Text>
          ) : (
            docs.map((doc) => (
              <View key={doc.id} style={[styles.docRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.docIconWrap, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="file-text" size={16} color={colors.primary} />
                </View>
                
                <View style={styles.docInfo}>
                  <Text style={[styles.docName, { color: colors.foreground }]}>{doc.name}</Text>
                  {doc.upload_date && (
                    <Text style={[styles.docDate, { color: colors.mutedForeground }]}>
                      Subido el {doc.upload_date}
                    </Text>
                  )}
                  
                  <View style={{ alignSelf: "flex-start", marginTop: 4 }}>
                    <StatusBadge status={doc.status} small />
                  </View>

                  {/* Acciones de Administrador por Documento */}
                  {canValidateDocuments && (
                    <View style={styles.docAdminActions}>
                      <Pressable 
                        style={[styles.miniBtn, { backgroundColor: colors.success }]} 
                        onPress={() => updateDocStatus(doc.id, "validado", doc.name)}
                      >
                        <Feather name="check" size={12} color="#FFFFFF" />
                        <Text style={styles.miniBtnText}>Validar</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.miniBtn, { backgroundColor: colors.destructive }]} 
                        onPress={() => updateDocStatus(doc.id, "requiere_correccion", doc.name)}
                      >
                        <Feather name="refresh-cw" size={12} color="#FFFFFF" />
                        <Text style={styles.miniBtnText}>Corregir</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Botón para ver el documento */}
                <Pressable 
                  style={styles.actionBtn} 
                  onPress={() => openDocument(doc.admin_comment)} // Usamos admin_comment como URL
                >
                  <Feather name="eye" size={20} color={colors.primary} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Admin Actions Globales del Expediente */}
        {canChangeBeneficiaryStatus && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Acciones del Beneficiario</Text>
            <View style={styles.adminButtons}>
              <Pressable
                style={[styles.adminBtn, { backgroundColor: colors.success }]}
                onPress={() => changeStatus("aprobado")}
              >
                <Feather name="check" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Aprobar</Text>
              </Pressable>
              
              <Pressable
                style={[styles.adminBtn, { backgroundColor: colors.destructive }]}
                onPress={() => changeStatus("rechazado")}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Rechazar</Text>
              </Pressable>
              
              <Pressable
                style={[styles.adminBtn, { backgroundColor: colors.warning }]}
                onPress={() => changeStatus("en_revision")}
              >
                <Feather name="edit-2" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>En Revisión</Text>
              </Pressable>
            </View>
            
            {b.notes && (
              <View style={[styles.notesCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.notesLabel, { color: colors.mutedForeground }]}>Notas completas y observaciones</Text>
                <Text style={[styles.notesText, { color: colors.foreground }]}>{b.notes}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
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
  identityCard: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  avatarLg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  identityInfo: { flex: 1, gap: 4 },
  benefName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  benefAge: { fontSize: 13, fontFamily: "Inter_400Regular" },
  folioText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 0,
    overflow: "hidden",
  },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyDocs: { fontSize: 14, fontFamily: "Inter_400Regular" },
  docRow: {
    flexDirection: "row",
    alignItems: "flex-start", // Alineado arriba para que los botones quepan bien
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2, // Ligeramente bajado para centrarlo con el título
  },
  docInfo: { flex: 1, gap: 4 },
  docName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  docDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  docAdminActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  miniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  miniBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  actionBtn: { 
    padding: 10,
    alignSelf: "center", // Centrado verticalmente
  },
  adminButtons: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  adminBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  notesCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  notesLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  notesText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
