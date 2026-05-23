import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

interface GroupedPost {
  id: string;
  title: string;
  description: string;
  tournamentName?: string | null;
  images: string[];
}

// Subcomponente que renderiza cada publicación con el diseño exacto de Noticias
const GalleryPostCard = ({ post, colors }: { post: GroupedPost; colors: any }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setCurrentIndex(Math.round(index));
  };

  return (
    <View style={styles.postContainer}>
      {/* Imagen / Carrusel (Ocupa el 100% del ancho, sin bordes) */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={200}
        >
          {post.images.map((imgUri, index) => (
            <Image key={index} source={{ uri: imgUri }} style={[styles.image, { width }]} resizeMode="cover" />
          ))}
        </ScrollView>

        {/* Indicador de Carrusel estilo Instagram */}
        {post.images.length > 1 && (
          <View style={styles.carouselBadge}>
            <Text style={styles.carouselBadgeText}>
              {currentIndex + 1} / {post.images.length}
            </Text>
          </View>
        )}
      </View>

      {/* Contenido (Textos con el mismo diseño de Noticias) */}
      <View style={styles.content}>
        {post.tournamentName && (
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              🏆 {post.tournamentName}
            </Text>
          </View>
        )}

        {post.title ? (
          <Text style={[styles.title, { color: colors.foreground }]}>
            {post.title}
          </Text>
        ) : null}

        {post.description ? (
          <Text style={[styles.bodyText, { color: colors.foreground }]}>
            {post.description}
          </Text>
        ) : null}
      </View>

      {/* Divisor al final de cada publicación */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </View>
  );
};

export default function Galeria() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<GroupedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAndGroupPhotos = async () => {
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

      // Agrupamos las fotos si tienen el mismo título/descripción
      const grouped = (data || []).reduce((acc: GroupedPost[], curr) => {
        const key = (curr.title || curr.description) ? `${curr.title}|${curr.description}` : curr.id;
        const existingGroup = acc.find(g => g.id === key || (`${g.title}|${g.description}` === key));

        if (existingGroup) {
          existingGroup.images.push(curr.image_url);
        } else {
          const tournamentName = Array.isArray(curr.tournaments) 
            ? curr.tournaments[0]?.name 
            : curr.tournaments?.name;

          acc.push({
            id: key,
            title: curr.title || "",
            description: curr.description || "",
            tournamentName: tournamentName,
            images: [curr.image_url],
          });
        }
        return acc;
      }, []);

      setPosts(grouped);
    } catch (error) {
      console.error("Error al cargar la galería:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAndGroupPhotos();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAndGroupPhotos();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: "Inter_500Medium" }}>
          Cargando galería...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ENCABEZADO ESTÁNDAR DE LA APP */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Galería Pública</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* FEED DE PUBLICACIONES */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          posts.length === 0 && styles.emptyFeed,
          { paddingBottom: insets.bottom + 40 }
        ]}
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
              Las fotos publicadas aparecerán aquí. ¡Desliza hacia abajo para recargar!
            </Text>
          </View>
        }
        renderItem={({ item }) => <GalleryPostCard post={item} colors={colors} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  // Header Estándar
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
  
  // Feed List
  emptyFeed: { flexGrow: 1, justifyContent: "center" },
  postContainer: {
    marginBottom: 10,
  },
  
  // Componentes heredados del diseño de Noticias
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 280, // Misma altura que la imagen del NewsDetail
    backgroundColor: "#F3F4F6",
  },
  image: {
    height: 280,
  },
  carouselBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  carouselBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
  },
  divider: {
    height: 8, // Divisor grueso estilo feed nativo (opcional, puedes poner 1 si quieres línea delgada)
    opacity: 0.5,
  },

  // Empty State
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
});