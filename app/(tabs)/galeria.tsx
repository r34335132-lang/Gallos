import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

interface Photo {
  id: string;
  title: string;
  description: string;
  image_url: string;
  tournaments?: { name: string };
}

export default function Galeria() {
  const colors = useColors();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_photos")
        .select(`
          id,
          title,
          description,
          image_url,
          tournaments ( name )
        `)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error al cargar la galería:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Galería Comunitaria</Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
          Torneos e historias de impacto en imágenes
        </Text>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshing={loading}
        onRefresh={fetchPhotos}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <View style={styles.info}>
              {item.tournaments?.name && (
                <Text style={[styles.tournamentTag, { color: colors.primary }]}>
                  🏆 {item.tournaments.name}
                </Text>
              )}
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {item.title || "Sin título"}
              </Text>
              {item.description && (
                <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  grid: { padding: 12 },
  row: { justifyContent: "space-between" },
  card: {
    width: COLUMN_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  image: { width: "100%", height: 140, resizeMode: "cover" },
  info: { padding: 8, gap: 4 },
  tournamentTag: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 14, fontFamily: "Inter_700Bold" },
  desc: { fontSize: 12, lineHeight: 16 },
});