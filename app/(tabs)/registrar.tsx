import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { REQUIRED_DOC_TYPES, DISABILITY_TYPES } from "@/lib/appData"; // <--- Importamos DISABILITY_TYPES
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

export default function RegistrarBeneficiarioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [curp, setCurp] = useState(""); // <--- Nuevo Estado CURP
  const [disability, setDisability] = useState("Síndrome de Down"); // <--- Nuevo Estado Discapacidad
  const [documents, setDocuments] = useState<Record<string, DocumentPicker.DocumentPickerResult>>({});

  const URL_DEL_PDF = "https://jfutdmtjcunkvefojlgm.supabase.co/storage/v1/object/public/img/documents/Gallos%20Smiling%20-%20Carta%20Responsiva.pdf"; 

  const pickDocument = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocuments(prev => ({ ...prev, [docType]: result }));
      }
    } catch (error) {
      console.error("Error al seleccionar documento:", error);
    }
  };

  const uploadFileToSupabase = async (fileUri: string, fileType: string, fileName: string) => {
    try {
      const fileExt = fileName.split(".").pop() || "pdf";
      const storagePath = `documents/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: fileType === "image" ? "image/jpeg" : "application/pdf",
      } as any);

      const { error } = await supabase.storage.from("img").upload(storagePath, formData);
      if (error) throw error;

      const { data } = supabase.storage.from("img").getPublicUrl(storagePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!beneficiaryName || !tutorName || !curp) {
      return Alert.alert("Faltan datos", "El nombre, el tutor y la CURP son obligatorios.");
    }

    if (curp.length !== 18) {
       return Alert.alert("CURP Inválida", "La CURP debe tener exactamente 18 caracteres.");
    }

    const missingDocs = REQUIRED_DOC_TYPES.filter(doc => !documents[doc]);
    if (missingDocs.length > 0) {
      return Alert.alert("Documentos incompletos", `Faltan subir los siguientes archivos:\n\n${missingDocs.join("\n")}`);
    }

    setLoading(true);

    try {
      const autoFolio = `GS-${Math.floor(100000 + Math.random() * 900000)}`;

      // 2. Insertar Beneficiario
      const { data: newBeneficiary, error: beneficiaryError } = await supabase
        .from("beneficiaries")
        .insert({
          name: beneficiaryName,
          tutor_name: tutorName,
          curp: curp.toUpperCase(), // Guardamos la CURP
          disability_type: disability, // Guardamos la discapacidad
          folio: autoFolio,
          tutor_id: profile?.id || null, 
          status: "pendiente"
        })
        .select()
        .single();

      if (beneficiaryError) throw beneficiaryError;

      // 3. Subir Documentos e Insertar en Tabla Documents
      for (const docType of REQUIRED_DOC_TYPES) {
        const doc = documents[docType].assets![0];
        const publicUrl = await uploadFileToSupabase(doc.uri, doc.mimeType || "application/pdf", doc.name);

        if (publicUrl) {
          await supabase.from("documents").insert({
            beneficiary_id: newBeneficiary.id,
            name: doc.name,
            document_type: docType,
            status: "pendiente",
            admin_comment: publicUrl,
          });
        }
      }

      Alert.alert("¡Registro Exitoso!", "El beneficiario ha sido enviado a revisión.");

      // --- ENVÍO DE PUSH NOTIFICATIONS ---
      try {
        const { data: admins } = await supabase
          .from('users')
          .select('push_token')
          .in('role', ['admin', 'validador', 'capturista'])
          .not('push_token', 'is', null);

        if (admins && admins.length > 0) {
          const messages = admins.map(admin => ({
            to: admin.push_token,
            sound: 'default',
            title: '¡Nuevo Beneficiario!',
            body: `Se ha registrado una nueva solicitud a nombre de ${beneficiaryName}.`,
            data: { route: '/(tabs)/expedientes' },
          }));

          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
          });
        }
      } catch (e) {
        console.log("Error enviando push notification", e);
      }
      // ------------------------------------

      router.replace("/(tabs)/");

    } catch (error: any) {
      console.error("Error general:", error);
      Alert.alert("Error", error.message || "Ocurrió un problema al guardar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 60 : 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Registro Simplificado</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
        
        {step === 1 && (
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.foreground }]}>Paso 1: Datos Básicos</Text>
            <Text style={{ color: colors.mutedForeground, marginBottom: 20 }}>
              Proporciona la información principal para crear el expediente.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre completo del jugador(a)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="Ej. Juan Pérez García"
                placeholderTextColor={colors.mutedForeground}
                value={beneficiaryName}
                onChangeText={setBeneficiaryName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>CURP del jugador(a)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="18 caracteres"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                maxLength={18}
                value={curp}
                onChangeText={setCurp}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre del Padre o Tutor</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="Ej. María García"
                placeholderTextColor={colors.mutedForeground}
                value={tutorName}
                onChangeText={setTutorName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Tipo de Discapacidad</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {DISABILITY_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.disabilityChip,
                      {
                        backgroundColor: disability === type ? colors.primary : colors.card,
                        borderColor: disability === type ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setDisability(type)}
                  >
                    <Text style={[styles.disabilityChipText, { color: disability === type ? "#FFFFFF" : colors.foreground }]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Pressable 
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 20 }]} 
              onPress={() => {
                if (!beneficiaryName || !tutorName || !curp) {
                  Alert.alert("Atención", "Llena los campos obligatorios para continuar.");
                } else if (curp.length !== 18) {
                  Alert.alert("CURP Inválida", "La CURP debe tener 18 caracteres.");
                } else {
                  setStep(2);
                }
              }}
            >
              <Text style={styles.buttonText}>Continuar a Documentos</Text>
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.foreground }]}>Paso 2: Documentación</Text>
            
            <View style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
              <Feather name="download" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.primary }]}>Formatos Requeridos</Text>
                <Text style={[styles.infoText, { color: colors.foreground }]}>
                  Descarga la Carta Responsiva y de Uso de Imagen. Llénala, fírmala y súbela en la lista de abajo junto con los demás documentos.
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <Pressable 
                    style={[styles.downloadBtn, { backgroundColor: '#EF4444' }]} 
                    onPress={() => Linking.openURL(URL_DEL_PDF)}
                  >
                    <Feather name="file-text" size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.downloadBtnText}>Descargar Formato (PDF)</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <Text style={[styles.subtitle, { color: colors.foreground, marginTop: 10 }]}>Sube tus archivos (PDF o Imagen)</Text>
            
            <View style={styles.docList}>
              {REQUIRED_DOC_TYPES.map((docType) => {
                const hasFile = !!documents[docType];
                return (
                  <View key={docType} style={[styles.docItem, { borderColor: hasFile ? colors.primary : colors.border }]}>
                    <View style={styles.docIcon}>
                      <Feather name={hasFile ? "check-circle" : "file-text"} size={20} color={hasFile ? colors.primary : colors.mutedForeground} />
                    </View>
                    <View style={styles.docInfo}>
                      <Text style={[styles.docName, { color: hasFile ? colors.foreground : colors.mutedForeground }]}>{docType} *</Text>
                      {hasFile && <Text style={[styles.docSub, { color: colors.primary }]} numberOfLines={1}>{documents[docType].assets![0].name}</Text>}
                    </View>
                    <Pressable
                      style={[styles.uploadBtn, { backgroundColor: hasFile ? colors.background : colors.primary, borderColor: colors.primary, borderWidth: hasFile ? 1 : 0 }]}
                      onPress={() => pickDocument(docType)}
                    >
                      <Text style={[styles.uploadBtnText, { color: hasFile ? colors.primary : "#FFF" }]}>{hasFile ? "Cambiar" : "Subir"}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <Pressable style={[styles.button, { backgroundColor: colors.muted, flex: 1 }]} onPress={() => setStep(1)} disabled={loading}>
                <Text style={[styles.buttonText, { color: colors.foreground }]}>Atrás</Text>
              </Pressable>
              
              <Pressable style={[styles.button, { backgroundColor: colors.primary, flex: 2, opacity: loading ? 0.7 : 1 }]} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Finalizar Registro</Text>}
              </Pressable>
            </View>
          </View>
        )}

      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { padding: 20 },
  section: { flex: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  inputGroup: { marginBottom: 16, gap: 8 },
  inputLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, fontFamily: "Inter_400Regular" },
  disabilityChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  disabilityChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  button: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  infoBox: { flexDirection: "row", borderWidth: 1, borderRadius: 12, padding: 16, gap: 12, marginBottom: 20 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  downloadBtn: { flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  downloadBtnText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  docList: { gap: 12 },
  docItem: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderRadius: 12, gap: 12 },
  docIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  docSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  uploadBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  uploadBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});