import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";
import { loadEvents, type PublicEvent } from "@/lib/publicContent";

export default function EventsScreen() {
  const colors = useColors();
  const [items, setItems] = useState<PublicEvent[]>([]);
  const [mode, setMode] = useState<"proximos" | "pasados">("proximos");

  useEffect(() => {
    loadEvents().then(setItems).catch((error) => console.error("Error eventos:", error));
  }, []);

  return (
    <PublicScaffold title="Eventos" subtitle="Agenda publica, encuentros, actividades y memoria visual de Gallos Smiling.">
      <View style={styles.switcher}>
        {(["proximos", "pasados"] as const).map((item) => (
          <Pressable key={item} style={[styles.switch, { backgroundColor: mode === item ? colors.primary : colors.card }]} onPress={() => setMode(item)}>
            <Text style={[styles.switchText, { color: mode === item ? "#fff" : colors.foreground }]}>{item === "proximos" ? "Proximos" : "Pasados"}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.timeline}>
        {items.map((item) => (
          <View key={item.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" /> : <View style={[styles.imageFallback, { backgroundColor: colors.primary + "12" }]}><Feather name="calendar" size={30} color={colors.primary} /></View>}
            <View style={styles.body}>
              <Text style={[styles.date, { color: colors.primary }]}>{item.eventDate}</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.location, { color: colors.mutedForeground }]}>{item.location}</Text>
              <Text style={[styles.text, { color: colors.mutedForeground }]}>{item.description}</Text>
              {item.videoUrl ? <Text style={[styles.video, { color: colors.primary }]}>Video disponible</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </PublicScaffold>
  );
}

const styles = StyleSheet.create({
  switcher: { flexDirection: "row", gap: 8 },
  switch: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  switchText: { fontFamily: "Inter_700Bold" },
  timeline: { gap: 14 },
  card: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  image: { width: 260, minHeight: 190, flexGrow: 1 },
  imageFallback: { width: 260, minHeight: 190, flexGrow: 1, alignItems: "center", justifyContent: "center" },
  body: { flex: 2, minWidth: 260, padding: 16, gap: 7 },
  date: { fontSize: 13, fontFamily: "Inter_700Bold" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  location: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  text: { fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
  video: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
