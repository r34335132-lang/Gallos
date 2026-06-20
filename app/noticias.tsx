import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { NewsCard } from "@/components/NewsCard";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";
import { mapNews, type NewsArticle } from "@/lib/appData";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["Todas", "eventos", "campanas", "beneficiarios", "avisos", "logros", "comunidad"];

export default function PublicNewsScreen() {
  const colors = useColors();
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState("Todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadNews = async () => {
      try {
        const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
        if (mounted) setItems((data || []).map(mapNews));
      } catch (error) {
        console.error("Error cargando noticias publicas:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadNews();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = category === "Todas" ? items : items.filter((item) => item.category?.toLowerCase().includes(category));

  return (
    <PublicScaffold title="Noticias" subtitle="Comunicados, historias, logros, eventos y avisos de Gallos Smiling.">
      <View style={styles.filters}>
        {CATEGORIES.map((item) => (
          <Pressable key={item} style={[styles.chip, { backgroundColor: category === item ? colors.primary : colors.card }]} onPress={() => setCategory(item)}>
            <Text style={[styles.chipText, { color: category === item ? "#fff" : colors.foreground }]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((article) => <View key={article.id} style={styles.card}><NewsCard article={article} /></View>)}
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Feather name="file-text" size={34} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No hay noticias en esta categoria.</Text>
            </View>
          )}
        </View>
      )}
    </PublicScaffold>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  chipText: { fontFamily: "Inter_700Bold", fontSize: 12, textTransform: "capitalize" },
  center: { minHeight: 240, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  card: { flexGrow: 1, flexBasis: 300 },
  empty: { minHeight: 220, flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { fontFamily: "Inter_600SemiBold" },
});
