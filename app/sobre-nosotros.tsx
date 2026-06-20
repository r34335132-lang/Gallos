import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";
import { DEFAULT_SITE_SETTINGS, loadSettings, type SiteSettings } from "@/lib/publicContent";

export default function AboutScreen() {
  const colors = useColors();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  return (
    <PublicScaffold title="Sobre Gallos Smiling" subtitle="Historia, mision, vision y valores de la fundacion.">
      <View style={styles.grid}>
        <View style={[styles.story, { backgroundColor: colors.card }]}>
          <Text style={[styles.kicker, { color: colors.primary }]}>Historia</Text>
          <Text style={[styles.storyText, { color: colors.foreground }]}>{settings.aboutStory}</Text>
        </View>
        <ValueCard icon="flag" title="Mision" text={settings.mission} />
        <ValueCard icon="eye" title="Vision" text={settings.vision} />
      </View>
      <View style={styles.values}>
        {settings.values.map((item) => (
          <View key={item} style={[styles.valuePill, { backgroundColor: colors.primary + "12" }]}>
            <Feather name="check-circle" size={15} color={colors.primary} />
            <Text style={[styles.valueText, { color: colors.foreground }]}>{item}</Text>
          </View>
        ))}
      </View>
    </PublicScaffold>
  );
}

function ValueCard({ icon, title, text }: { icon: keyof typeof Feather.glyphMap; title: string; text: string }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <View style={[styles.icon, { backgroundColor: colors.primary + "12" }]}><Feather name={icon} size={22} color={colors.primary} /></View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  story: { flexGrow: 2, flexBasis: 360, borderRadius: 18, padding: 18, gap: 8 },
  kicker: { fontSize: 13, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  storyText: { fontSize: 17, lineHeight: 27, fontFamily: "Inter_600SemiBold" },
  card: { flexGrow: 1, flexBasis: 240, borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  text: { fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },
  values: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  valuePill: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  valueText: { fontFamily: "Inter_700Bold" },
});
