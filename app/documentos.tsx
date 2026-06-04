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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const RESPONSIVE_LETTER_URL =
  "https://jfutdmtjcunkvefojlgm.supabase.co/storage/v1/object/public/img/documents/Gallos%20Smiling%20-%20Carta%20Responsiva.pdf";
const MEDICAL_CERTIFICATE_FORMAT_URL =
  "https://jfutdmtjcunkvefojlgm.supabase.co/storage/v1/object/public/img/documents/Gallos%20Smiling%20-%20Formato%20Certificado%20Medico.pdf";
const WHATSAPP_URL = "https://wa.me/524421234567?text=Hola%20Gallos%20Smiling%2C%20quiero%20enviar%20documentos%20para%20revision.";

type BeneficiaryDocState = {
  id: string;
  name: string;
  carta_responsiva_recibida?: boolean | null;
  certificado_medico_recibido?: boolean | null;
};

function receivedLabel(value?: boolean | null) {
  return value ? "Recibida" : "Pendiente";
}

export default function DocumentosScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const routeBeneficiaryId = Array.isArray(id) ? id[0] : id;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryDocState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBeneficiaries = async () => {
      if (!profile) return;

      try {
        setLoading(true);
        let query = supabase
          .from("beneficiaries")
          .select("id, name, carta_responsiva_recibida, certificado_medico_recibido")
          .order("created_at", { ascending: false });

        if (routeBeneficiaryId) {
          query = query.eq("id", routeBeneficiaryId);
        } else if (profile.role === "tutor") {
          query = query.eq("tutor_id", profile.id);
        }

        const { data, error } = await query;
        if (error?.code === "PGRST204") {
          let fallbackQuery = supabase
            .from("beneficiaries")
            .select("id, name")
            .order("created_at", { ascending: false });

          if (routeBeneficiaryId) {
            fallbackQuery = fallbackQuery.eq("id", routeBeneficiaryId);
          } else if (profile.role === "tutor") {
            fallbackQuery = fallbackQuery.eq("tutor_id", profile.id);
          }

          const fallback = await fallbackQuery;
          if (fallback.error) throw fallback.error;
          setBeneficiaries((fallback.data || []).map((item) => ({
            ...item,
            carta_responsiva_recibida: false,
            certificado_medico_recibido: false,
          })));
          return;
        }
        if (error) throw error;
        setBeneficiaries(data || []);
      } catch (error) {
        console.error("Error cargando estados documentales:", error);
        Alert.alert("Error", "No se pudo cargar el estado de documentacion.");
      } finally {
        setLoading(false);
      }
    };

    loadBeneficiaries();
  }, [profile?.id, profile?.role, routeBeneficiaryId]);

  const downloadFile = async (url: string, fileName: string) => {
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("No disponible", "No se pudo descargar el archivo en este momento.");
    }
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("No disponible", "No se pudo abrir el enlace en este momento.");
    });
  };

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
        <Text style={styles.headerTitle}>Documentos</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
          <Feather name="shield" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            Los documentos se descargan desde la aplicación y se envían directamente a la asociación para su revisión.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionCard, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => downloadFile(RESPONSIVE_LETTER_URL, "Gallos Smiling - Carta Responsiva.pdf")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#1A4FA812" }]}>
              <Feather name="download" size={20} color="#1A4FA8" />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Descargar Carta Responsiva</Text>
              <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Toca para descargar el PDF</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={[styles.actionCard, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => downloadFile(MEDICAL_CERTIFICATE_FORMAT_URL, "Gallos Smiling - Formato Certificado Medico.pdf")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#05966912" }]}>
              <Feather name="download" size={20} color="#059669" />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Descargar Formato de Certificado Médico</Text>
              <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Formato para entregar a la asociación</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          <Pressable style={[styles.actionCard, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => openUrl(WHATSAPP_URL)}>
            <View style={[styles.actionIcon, { backgroundColor: "#25D36618" }]}>
              <Feather name="message-circle" size={20} color="#128C7E" />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Contactar por WhatsApp</Text>
              <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>Enviar documentos para revisión</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estado de Documentación</Text>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.mutedForeground }}>Cargando estados...</Text>
            </View>
          ) : beneficiaries.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Aún no hay beneficiarios vinculados a esta cuenta.
            </Text>
          ) : (
            beneficiaries.map((item) => (
              <View key={item.id} style={[styles.stateCard, { borderColor: colors.border }]}>
                <Text style={[styles.beneficiaryName, { color: colors.foreground }]}>{item.name}</Text>
                <View style={styles.stateRow}>
                  <Text style={[styles.stateLabel, { color: colors.mutedForeground }]}>Carta Responsiva</Text>
                  <Text style={[styles.stateValue, { color: item.carta_responsiva_recibida ? "#059669" : "#92400E" }]}>
                    {receivedLabel(item.carta_responsiva_recibida)}
                  </Text>
                </View>
                <View style={styles.stateRow}>
                  <Text style={[styles.stateLabel, { color: colors.mutedForeground }]}>Certificado Médico</Text>
                  <Text style={[styles.stateValue, { color: item.certificado_medico_recibido ? "#059669" : "#92400E" }]}>
                    {receivedLabel(item.certificado_medico_recibido)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
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
  scroll: { padding: 20, gap: 18 },
  infoBox: { flexDirection: "row", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 21 },
  actions: { gap: 12 },
  actionCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  actionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  actionText: { flex: 1, gap: 3 },
  actionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  actionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  stateCard: { borderTopWidth: 1, paddingTop: 12, gap: 10 },
  beneficiaryName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  stateRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  stateLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  stateValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
