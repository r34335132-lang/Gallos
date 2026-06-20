import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";
import { loadCampaigns, loadSettings, type Campaign, DEFAULT_SITE_SETTINGS } from "@/lib/publicContent";

export default function CampaignsScreen() {
  const colors = useColors();
  const [items, setItems] = useState<Campaign[]>([]);
  const [whatsapp, setWhatsapp] = useState(DEFAULT_SITE_SETTINGS.whatsappUrl);

  useEffect(() => {
    loadCampaigns().then(setItems).catch((error) => console.error("Error campanas:", error));
    loadSettings().then((settings) => setWhatsapp(settings.whatsappUrl)).catch(() => {});
  }, []);

  return (
    <PublicScaffold title="Campanas y programas" subtitle="Programas activos, objetivos institucionales y formas de participar.">
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" /> : <View style={[styles.imageFallback, { backgroundColor: colors.primary + "16" }]}><Feather name="target" size={34} color={colors.primary} /></View>}
            <View style={styles.body}>
              <View style={styles.row}>
                <Text style={[styles.status, { color: item.status === "finalizada" ? "#64748B" : "#059669" }]}>{item.status}</Text>
                {item.isFeatured && <Text style={[styles.featured, { color: colors.primary }]}>Destacada</Text>}
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.text, { color: colors.mutedForeground }]}>{item.description}</Text>
              {!!item.goal && <Text style={[styles.goal, { color: colors.foreground }]}>Objetivo: {item.goal}</Text>}
              <Pressable style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL(whatsapp)}>
                <Text style={styles.btnText}>Apoyar o contactar</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </PublicScaffold>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: { flexGrow: 1, flexBasis: 300, borderRadius: 18, overflow: "hidden", borderWidth: 1 },
  image: { width: "100%", height: 190 },
  imageFallback: { height: 190, alignItems: "center", justifyContent: "center" },
  body: { padding: 16, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  status: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  featured: { fontSize: 12, fontFamily: "Inter_700Bold" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", lineHeight: 24 },
  text: { fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
  goal: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_700Bold" },
  btn: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10, marginTop: 4 },
  btnText: { color: "#fff", fontFamily: "Inter_700Bold" },
});
