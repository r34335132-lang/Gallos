import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";
import { DEFAULT_SITE_SETTINGS, loadSettings } from "@/lib/publicContent";

const WAYS = [
  { icon: "gift" as const, title: "Donaciones en especie", text: "Material, equipo, articulos para actividades y apoyos definidos por la fundacion." },
  { icon: "users" as const, title: "Voluntariado", text: "Participacion en actividades, eventos y acompaniamiento institucional." },
  { icon: "award" as const, title: "Patrocinios", text: "Alianzas con empresas y personas que desean impulsar programas publicos." },
  { icon: "share-2" as const, title: "Difusion", text: "Compartir noticias, eventos y campanas para ampliar el alcance de Gallos Smiling." },
];

export default function SupportScreen() {
  const colors = useColors();
  const [whatsapp, setWhatsapp] = useState(DEFAULT_SITE_SETTINGS.whatsappUrl);

  useEffect(() => {
    loadSettings().then((settings) => setWhatsapp(settings.whatsappUrl)).catch(() => {});
  }, []);

  return (
    <PublicScaffold title="Apoyar" subtitle="Formas de colaborar con Gallos Smiling sin pagos obligatorios dentro de la plataforma.">
      <View style={styles.grid}>
        {WAYS.map((item) => (
          <View key={item.title} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <View style={[styles.icon, { backgroundColor: colors.primary + "12" }]}><Feather name={item.icon} size={24} color={colors.primary} /></View>
            <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
            <Text style={[styles.text, { color: colors.mutedForeground }]}>{item.text}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.cta, { backgroundColor: colors.primary }]}>
        <Text style={styles.ctaTitle}>Hablemos de como puedes apoyar</Text>
        <Text style={styles.ctaText}>La plataforma queda preparada para futuras integraciones de donacion, pero hoy el contacto se realiza directamente con la asociacion.</Text>
        <Pressable style={styles.btn} onPress={() => Linking.openURL(whatsapp)}>
          <Text style={[styles.btnText, { color: colors.primary }]}>Contactar por WhatsApp</Text>
        </Pressable>
      </View>
    </PublicScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  card: { flexGrow: 1, flexBasis: 240, borderWidth: 1, borderRadius: 18, padding: 18, gap: 9 },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  text: { fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
  cta: { borderRadius: 20, padding: 22, gap: 10 },
  ctaTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  ctaText: { color: "rgba(255,255,255,0.86)", fontSize: 15, lineHeight: 23, fontFamily: "Inter_400Regular" },
  btn: { backgroundColor: "#fff", alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  btnText: { fontFamily: "Inter_700Bold" },
});
