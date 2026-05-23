import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");
// Calculamos el ancho para 2 columnas con un gap (espaciado) de 16px
const COLUMN_WIDTH = (width - 48) / 2;

interface Photo {
  id: string;
  title: string;
  description: string;
  image_url: string;
  tournaments?: { name: string } | null;
}

export default function Galeria() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPhotos = async () => {
    try {
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPhotos();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_500Medium" }}>
          Cargando recuerdos...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER ELEGANTE */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 20 : 10) }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Galería Pública</Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            Nuestra comunidad en acción
          </Text>
        </View>
      </View>

      {/* LISTA DE FOTOS */}
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.grid,
          photos.length === 0 && styles.emptyGrid, // Si no hay fotos, centramos el contenido
          { paddingBottom: insets.bottom + 40 }
        ]}
        columnWrapperStyle={photos.length > 0 ? styles.row : undefined}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="camera-off" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aún no hay fotos</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Las fotos publicadas por los administradores aparecerán aquí. ¡Desliza hacia abajo para recargar!
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          // Extraer nombre del torneo de forma segura
          const tournamentName = Array.isArray(item.tournaments) 
            ? item.tournaments[0]?.name 
            : item.tournaments?.name;

          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.foreground }]}>
              <Image source={{ uri: item.image_url }} style={styles.image} />
              
              <View style={styles.info}>
                {tournamentName && (
                  <View style={[styles.tagContainer, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.tournamentTag, { color: colors.primary }]} numberOfLines={1}>
                      🏆 {tournamentName}
                    </Text>
                  </View>
                )}
                
                <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                  {item.title || "Sin título"}
                </Text>
                
                {item.description ? (
                  <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headerTextContainer: {
    gap: 4,
  },
  headerTitle: { fontSize: 28, fontFamily: "Inter_700Bold" },
  headerSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular" },
  
  // Grid
  grid: { padding: 16, gap: 16 },
  row: { gap: 16 },
  emptyGrid: { flexGrow: 1, justifyContent: "center" },
  
  // Card
  card: {
    width: COLUMN_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    // Sombras sutiles
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  image: { width: "100%", height: 160, resizeMode: "cover" },
  info: { padding: 12, gap: 6 },
  tagContainer: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tournamentTag: { fontSize: 10, fontFamily: "Inter_700Bold" },
  title: { fontSize: 15, fontFamily: "Inter_700Bold" },
  desc: { fontSize: 12, lineHeight: 16, fontFamily: "Inter_400Regular" },

  // Empty State
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});