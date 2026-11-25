import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { goBack } from "@/lib/navigation";
import { MUNICIPALITIES } from "@/lib/appData";
import { uploadMedia } from "@/lib/mediaUpload";
import { supabase } from "@/lib/supabase";

const INTERNAL_ROLES = ["admin", "capturista", "validador", "comunicacion"];

export default function RegistrarBeneficiarioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const isInternal = INTERNAL_ROLES.includes(profile?.role || "");
  const tabBarHeight = Platform.OS === "web" ? 84 : 60;

  const [loading, setLoading] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [tutorName, setTutorName] = useState(profile?.role === "tutor" ? profile?.name || "" : "");
  const [tutorEmail, setTutorEmail] = useState("");
  const [curp, setCurp] = useState("");
  const [municipality, setMunicipality] = useState(MUNICIPALITIES[0]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickBeneficiaryPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadImageToStorage = (fileUri: string) => uploadMedia({ uri: fileUri, type: "imagen" }, { folder: "beneficiaries" });

  const resolveTutor = async () => {
    if (!isInternal) {
      return { id: profile?.id || null, name: tutorName || profile?.name || "" };
    }

    if (!tutorEmail.trim()) {
      return { id: null, name: tutorName.trim() };
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("email", tutorEmail.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return {
      id: data?.id || null,
      name: data?.name || tutorName.trim(),
    };
  };

  const handleSubmit = async () => {
    if (!beneficiaryName.trim()) {
      return Alert.alert("Faltan datos", "El nombre del beneficiario es obligatorio.");
    }

    if (curp && curp.length !== 18) {
      return Alert.alert("CURP inválida", "La CURP debe tener exactamente 18 caracteres.");
    }

    setLoading(true);
    try {
      const tutor = await resolveTutor();
      let photoUrl: string | null = null;

      if (photoUri) {
        photoUrl = await uploadImageToStorage(photoUri);
      }

      const autoFolio = `GS-${Math.floor(100000 + Math.random() * 900000)}`;
      const basePayload = {
        name: beneficiaryName.trim(),
        tutor_name: tutor.name || null,
        tutor_id: tutor.id,
        curp: curp.trim().toUpperCase() || null,
        municipality,
        folio: autoFolio,
        photo_url: photoUrl,
        status: "pendiente",
      };
      const payloadWithDocumentState = {
        ...basePayload,
        carta_responsiva_recibida: false,
        certificado_medico_recibido: false,
      };

      let { error } = await supabase.from("beneficiaries").insert(payloadWithDocumentState);
      if (error?.code === "PGRST204") {
        const retry = await supabase.from("beneficiaries").insert(basePayload);
        error = retry.error;
      }

      if (error) throw error;

      Alert.alert("Registro guardado", "El beneficiario fue registrado con seguimiento documental básico.");
      router.replace("/(tabs)/expedientes");
    } catch (error: any) {
      console.error("Error al guardar beneficiario:", error);
      Alert.alert("Error", error.message || "No se pudo guardar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 60 : 16) }]}>
        <Pressable onPress={() => goBack("/(tabs)")} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Registrar beneficiario</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + insets.bottom + 32 }]}
        bottomOffset={tabBarHeight}
      >
        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.foreground }]}>Datos básicos</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>
            Captura únicamente la información necesaria para identificar al beneficiario y dar seguimiento documental.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre del beneficiario *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Ej. Juan Pérez García"
              placeholderTextColor={colors.mutedForeground}
              value={beneficiaryName}
              onChangeText={setBeneficiaryName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Fotografía de perfil</Text>
            <Pressable style={[styles.photoBox, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={pickBeneficiaryPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <>
                  <Feather name="camera" size={28} color={colors.mutedForeground} />
                  <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>Seleccionar fotografía</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>CURP</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Opcional, 18 caracteres"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="characters"
              maxLength={18}
              value={curp}
              onChangeText={setCurp}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Sede / Municipio</Text>
            <View style={styles.chipWrap}>
              {MUNICIPALITIES.map((mun) => (
                <Pressable
                  key={mun}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: municipality === mun ? colors.primary : colors.card,
                      borderColor: municipality === mun ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setMunicipality(mun)}
                >
                  <Text style={[styles.chipText, { color: municipality === mun ? "#FFFFFF" : colors.foreground }]}>{mun}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre del tutor</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Ej. María García"
              placeholderTextColor={colors.mutedForeground}
              value={tutorName}
              onChangeText={setTutorName}
            />
          </View>

          {isInternal && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Correo del tutor para asignación</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="tutor@correo.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                value={tutorEmail}
                onChangeText={setTutorEmail}
              />
            </View>
          )}

          <View style={[styles.infoBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="file-text" size={18} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Los documentos no se suben desde la aplicación. La administración marcará únicamente si la carta responsiva y el certificado médico fueron recibidos.
            </Text>
          </View>

          <Pressable style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Guardar beneficiario</Text>}
          </Pressable>
        </View>
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
  section: { gap: 16 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  helper: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  photoBox: { height: 160, borderWidth: 1, borderStyle: "dashed", borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  photoPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  infoBox: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  button: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  buttonText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
});
