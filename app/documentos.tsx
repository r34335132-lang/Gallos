import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { ALL_DOC_TYPES, getConsentByNameOrType } from "@/lib/appData";
import { supabase } from "@/lib/supabase";

export default function DocumentosScreen() {
  // Recibimos el ID del beneficiario desde la ruta anterior, si existe.
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const routeBeneficiaryId = Array.isArray(id) ? id[0] : id;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const { profile } = useAuth();
  const canValidateDocuments = profile?.role === "admin" || profile?.role === "validador";

  const [docs, setDocs] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const activeBeneficiaryId = routeBeneficiaryId || selectedBeneficiaryId;

  const fetchDocs = async () => {
    if (!activeBeneficiaryId) {
      setDocs([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("beneficiary_id", activeBeneficiaryId);

      if (error) throw error;
      setDocs(data || []);
    } catch (error) {
      console.error("Error cargando documentos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeBeneficiaryId]);

  useEffect(() => {
    const fetchTutorBeneficiaries = async () => {
      if (routeBeneficiaryId || profile?.role !== "tutor") return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("beneficiaries")
          .select("id, name, folio")
          .eq("tutor_id", profile.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = data || [];
        setBeneficiaries(rows);
        setSelectedBeneficiaryId((current) => current || rows[0]?.id || null);
        if (rows.length === 0) setLoading(false);
      } catch (error) {
        console.error("Error cargando beneficiarios del tutor:", error);
        setBeneficiaries([]);
        setSelectedBeneficiaryId(null);
        setLoading(false);
      }
    };

    fetchTutorBeneficiaries();
  }, [profile?.id, profile?.role, routeBeneficiaryId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocs();
  };

  // --- ACCIONES DE ADMINISTRADOR ---
  const changeDocStatus = async (docId: string, newStatus: string, docName: string) => {
    Alert.alert(
      "Confirmar acción",
      `¿Cambiar el estatus de "${docName}" a ${newStatus.replace("_", " ")}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("documents")
                .update({ status: newStatus })
                .eq("id", docId);

              if (error) throw error;
              fetchDocs(); // Recargar la lista
            } catch (e) {
              Alert.alert("Error", "No se pudo actualizar el estatus del documento.");
            }
          },
        },
      ]
    );
  };

  // --- ACCIONES DE TUTOR (Subir/Corregir) ---
  const handleUpload = async (docType: string, existingDocId?: string) => {
    try {
      if (!activeBeneficiaryId) {
        Alert.alert("Sin beneficiario", "Selecciona un beneficiario antes de subir documentos.");
        return;
      }

      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets) return;
      const file = res.assets[0];

      Alert.alert("Subiendo...", "Espera un momento mientras subimos tu documento.");

      // Subir archivo a Supabase Storage
      const fileExt = file.name.split(".").pop() || "pdf";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `expedientes/${activeBeneficiaryId}/${fileName}`;
      
      const formData = new FormData();
      formData.append("file", { uri: file.uri, name: fileName, type: file.mimeType || "application/pdf" } as any);

      const { error: uploadError } = await supabase.storage.from("img").upload(filePath, formData);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("img").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Actualizar o Insertar en la tabla Documents
      if (existingDocId) {
        await supabase.from("documents").update({ 
          admin_comment: publicUrl, // Guardamos la URL aquí
          status: "pendiente",
          upload_date: new Date().toISOString().split('T')[0]
        }).eq("id", existingDocId);
      } else {
        await supabase.from("documents").insert({ 
          beneficiary_id: activeBeneficiaryId, 
          name: docType, 
          document_type: docType, 
          admin_comment: publicUrl, 
          status: "pendiente",
          upload_date: new Date().toISOString().split('T')[0]
        });
      }

      Alert.alert("Éxito", "Documento subido correctamente.");
      fetchDocs();

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Ocurrió un problema al subir el documento.");
    }
  };

  const openDocument = (url: string) => {
    if (url && url.startsWith("http")) {
      Linking.openURL(url);
    } else {
      Alert.alert("No disponible", "Este documento aún no tiene un archivo válido adjunto.");
    }
  };

  const getDocForType = (name: string) => docs.find((d) => d.name === name || d.document_type === name);

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
        <Text style={styles.headerTitle}>Gestión documental</Text>
        <View style={{ width: 22 }} />
      </View>

      {!activeBeneficiaryId && !loading ? (
        <View style={styles.center}>
          <Feather name="folder" size={36} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, marginTop: 10, textAlign: "center" }}>
            Aun no hay beneficiarios para consultar documentos.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Cargando documentos...</Text>
        </View>
      ) : (
        <FlatList
          data={ALL_DOC_TYPES}
          keyExtractor={(item) => item}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: 40 + insets.bottom },
          ]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {!routeBeneficiaryId && beneficiaries.length > 1 && (
                <View style={styles.beneficiarySelector}>
                  <Text style={[styles.selectorLabel, { color: colors.foreground }]}>Beneficiario</Text>
                  <FlatList
                    data={beneficiaries}
                    horizontal
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectorList}
                    renderItem={({ item }) => {
                      const selected = item.id === activeBeneficiaryId;
                      return (
                        <Pressable
                          style={[
                            styles.selectorChip,
                            {
                              backgroundColor: selected ? colors.primary : colors.muted,
                              borderColor: selected ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => setSelectedBeneficiaryId(item.id)}
                        >
                          <Text style={[styles.selectorChipText, { color: selected ? "#FFFFFF" : colors.foreground }]}>
                            {item.name || item.folio || "Beneficiario"}
                          </Text>
                        </Pressable>
                      );
                    }}
                  />
                </View>
              )}

              {!canValidateDocuments && docs.some(d => d.status === 'requiere_correccion' || d.status === 'rechazado') ? (
              <View style={[styles.alertBanner, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}>
                <Feather name="alert-triangle" size={16} color="#92400E" />
                <Text style={[styles.alertText, { color: "#92400E" }]}>
                  Tienes documentos pendientes o con correcciones requeridas. Actualízalos para avanzar.
                </Text>
              </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => {
            const doc = getDocForType(item);
            const status = doc?.status ?? "faltante";
            const fileUrl = doc?.admin_comment; // Usamos admin_comment para almacenar el URL
            const consent = getConsentByNameOrType(item);

            return (
              <View
                style={[
                  styles.docCard,
                  { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.foreground },
                ]}
              >
                <View style={[styles.docIconWrap, { backgroundColor: colors.primary + "12" }]}>
                  <Feather name={doc ? "file-text" : "file"} size={20} color={doc ? colors.primary : colors.mutedForeground} />
                </View>
                
                <View style={styles.docInfo}>
                  <Text style={[styles.docName, { color: colors.foreground }]}>{item}</Text>
                  
                  {doc?.upload_date && (
                    <Text style={[styles.docDate, { color: colors.mutedForeground }]}>
                      Subido: {doc.upload_date}
                    </Text>
                  )}
                  
                  <StatusBadge status={status} small />

                  {/* BOTONES ADMINISTRATIVOS (Solo visibles si es Admin y el doc existe) */}
                  {canValidateDocuments && doc && (
                    <View style={styles.adminActions}>
                      <Pressable 
                        style={[styles.adminBtn, { backgroundColor: colors.success + "20" }]} 
                        onPress={() => changeDocStatus(doc.id, "validado", item)}
                      >
                        <Feather name="check" size={14} color={colors.success} />
                        <Text style={[styles.adminBtnText, { color: colors.success }]}>Validar</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.adminBtn, { backgroundColor: colors.destructive + "20" }]} 
                        onPress={() => changeDocStatus(doc.id, "requiere_correccion", item)}
                      >
                        <Feather name="refresh-cw" size={14} color={colors.destructive} />
                        <Text style={[styles.adminBtnText, { color: colors.destructive }]}>Corregir</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* BOTONES LATERALES (Ver y Subir) */}
                <View style={styles.docActions}>
                  {consent && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
                      onPress={() =>
                        router.push({
                          pathname: "/consentimiento/[type]",
                          params: { type: consent.type, beneficiaryId: activeBeneficiaryId ?? "" },
                        } as any)
                      }
                    >
                      <Feather name="file-text" size={14} color={colors.foreground} />
                    </Pressable>
                  )}
                  {(!canValidateDocuments && (status === "faltante" || status === "requiere_correccion" || status === "rechazado")) && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleUpload(item, doc?.id)}
                    >
                      <Feather name="upload" size={14} color="#FFFFFF" />
                    </Pressable>
                  )}
                  {doc && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}
                      onPress={() => openDocument(fileUrl)}
                    >
                      <Feather name="eye" size={14} color={colors.foreground} />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
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
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  listHeader: { gap: 12, marginBottom: 8 },
  beneficiarySelector: { gap: 8 },
  selectorLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  selectorList: { gap: 8 },
  selectorChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectorChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  alertBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    marginBottom: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  docInfo: { flex: 1, gap: 6 },
  docName: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  docDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  adminActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adminBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  docActions: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 2 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
