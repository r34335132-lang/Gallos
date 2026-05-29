import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { getConsentByNameOrType } from "@/lib/appData";
import { supabase } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

interface BeneficiarySummary {
  name: string;
  tutorName: string;
  folio: string;
}

export default function ConsentimientoScreen() {
  const { type, beneficiaryId, folio } = useLocalSearchParams<{
    type: string;
    beneficiaryId?: string;
    folio?: string;
  }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const consent = getConsentByNameOrType(type);
  const [beneficiary, setBeneficiary] = useState<BeneficiarySummary | null>(null);
  const [loading, setLoading] = useState(Boolean(beneficiaryId));

  useEffect(() => {
    let mounted = true;

    const loadBeneficiary = async () => {
      if (!beneficiaryId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("beneficiaries")
          .select("name,tutor_name,folio")
          .eq("id", beneficiaryId)
          .maybeSingle();

        if (error) throw error;
        if (mounted && data) {
          setBeneficiary({
            name: data.name ?? "",
            tutorName: data.tutor_name ?? "",
            folio: data.folio ?? folio ?? "",
          });
        }
      } catch (error) {
        console.error("Error al cargar permiso:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadBeneficiary();

    return () => {
      mounted = false;
    };
  }, [beneficiaryId, folio]);

  if (!consent) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.foreground }]}>Permiso no encontrado</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Regresar</Text>
        </Pressable>
      </View>
    );
  }

  const beneficiaryName = beneficiary?.name || "____________________________";
  const tutorName = beneficiary?.tutorName || "____________________________";
  const displayFolio = beneficiary?.folio || folio || "________________";
  const today = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const isImageConsent = consent.type === "permiso_uso_imagen";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{consent.shortName}</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Cargando formato...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.paper, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.docTitle, { color: colors.foreground }]}>{consent.name}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>Folio: {displayFolio}</Text>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>Fecha: {today}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.paragraph, { color: colors.foreground }]}>
              Yo, {tutorName}, en mi carácter de madre, padre o tutor legal de {beneficiaryName}, autorizo de manera informada a Fundación Gallos Smiling para lo siguiente:
            </Text>

            {isImageConsent ? (
              <>
                <Text style={[styles.paragraph, { color: colors.foreground }]}>
                  Capturar, usar y publicar fotografías, video, audio y material audiovisual del beneficiario en medios institucionales, redes sociales, campañas, reportes, presentaciones, sitio web y materiales de difusión relacionados con las actividades de la fundación.
                </Text>
                <Text style={[styles.paragraph, { color: colors.foreground }]}>
                  Esta autorización se otorga sin fines comerciales directos y podrá revocarse por escrito, entendiendo que el material ya publicado podría permanecer en reportes o publicaciones previamente emitidas.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.paragraph, { color: colors.foreground }]}>
                  Participar en juegos, torneos, dinámicas, traslados internos, convivencias y actividades deportivas o recreativas organizadas o acompañadas por la fundación y sus aliados.
                </Text>
                <Text style={[styles.paragraph, { color: colors.foreground }]}>
                  Declaro que he informado condiciones médicas relevantes, alergias, restricciones físicas o necesidades de apoyo para que el equipo pueda tomar medidas razonables de cuidado durante la actividad.
                </Text>
              </>
            )}

            <Text style={[styles.paragraph, { color: colors.foreground }]}>
              Confirmo que la información proporcionada en el expediente es verdadera y que comprendo el alcance de este permiso.
            </Text>

            <View style={styles.signatureBlock}>
              <View style={[styles.signatureLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.signatureText, { color: colors.mutedForeground }]}>Nombre y firma del tutor</Text>
            </View>

            <View style={styles.signatureBlock}>
              <View style={[styles.signatureLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.signatureText, { color: colors.mutedForeground }]}>Fecha</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  notFound: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  scroll: { padding: 20 },
  paper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  docTitle: { fontSize: 21, fontFamily: "Inter_700Bold", lineHeight: 28, textAlign: "center" },
  meta: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  divider: { height: 1, marginVertical: 6 },
  paragraph: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
  signatureBlock: { paddingTop: 28, alignItems: "center", gap: 8 },
  signatureLine: { width: "80%", height: 1 },
  signatureText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
