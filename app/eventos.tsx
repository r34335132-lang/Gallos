import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";
import { addEventToCalendar, CAN_ADD_TO_CALENDAR, shareContent } from "@/lib/nativeActions";
import { loadEvents, type PublicEvent } from "@/lib/publicContent";

function isPastEvent(item: PublicEvent) {
  if (!item.startsAt) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(item.startsAt).getTime() < startOfToday.getTime();
}

export default function EventsScreen() {
  const colors = useColors();
  const [items, setItems] = useState<PublicEvent[]>([]);
  const [mode, setMode] = useState<"proximos" | "pasados">("proximos");

  useEffect(() => {
    loadEvents().then(setItems).catch((error) => console.error("Error eventos:", error));
  }, []);

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => (mode === "pasados" ? isPastEvent(item) : !isPastEvent(item)));
    return mode === "pasados" ? [...filtered].reverse() : filtered;
  }, [items, mode]);

  const addToCalendar = async (item: PublicEvent) => {
    if (!item.startsAt) return;
    try {
      await addEventToCalendar({ title: item.title, startsAt: item.startsAt, location: item.location, notes: item.description });
    } catch (error) {
      console.error("Error calendario:", error);
      Alert.alert("No disponible", "No se pudo abrir el calendario.");
    }
  };

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
        {visibleItems.map((item) => (
          <View key={item.id} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" /> : <View style={[styles.imageFallback, { backgroundColor: colors.primary + "12" }]}><Feather name="calendar" size={30} color={colors.primary} /></View>}
            <View style={styles.body}>
              <Text style={[styles.date, { color: colors.primary }]}>{item.eventDate}</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.location, { color: colors.mutedForeground }]}>{item.location}</Text>
              <Text style={[styles.text, { color: colors.mutedForeground }]}>{item.description}</Text>
              {item.videoUrl ? <Text style={[styles.video, { color: colors.primary }]}>Video disponible</Text> : null}
              <View style={styles.actions}>
                {CAN_ADD_TO_CALENDAR && item.startsAt && !isPastEvent(item) ? (
                  <Pressable style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => addToCalendar(item)}>
                    <Feather name="calendar" size={15} color="#fff" />
                    <Text style={styles.actionTextPrimary}>Agregar al calendario</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={[styles.actionBtn, { borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => shareContent({ title: item.title, text: [item.eventDate, item.location].filter(Boolean).join(" - "), path: "/eventos" })}
                >
                  <Feather name="share-2" size={15} color={colors.foreground} />
                  <Text style={[styles.actionText, { color: colors.foreground }]}>Compartir</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
        {visibleItems.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {mode === "proximos" ? "Por ahora no hay eventos proximos." : "Aun no hay eventos pasados."}
            </Text>
          </View>
        )}
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  actionTextPrimary: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  actionText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  empty: { borderRadius: 16, padding: 24, alignItems: "center" },
  emptyText: { fontFamily: "Inter_600SemiBold", textAlign: "center" },
});
