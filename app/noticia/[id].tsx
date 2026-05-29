import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { mapNews, type NewsArticle } from "@/lib/appData";
import { supabase } from "@/lib/supabase";

const IMAGES: Record<string, ImageSourcePropType> = {
  news_1: require("@/assets/images/news_1.png"),
  news_2: require("@/assets/images/news_2.png"),
  hero_banner: require("@/assets/images/hero_banner.png"),
};

const CATEGORY_COLORS: Record<string, string> = {
  "Fundación": "#1A4FA8",
  "Club Gallos Blancos": "#0D2B6E",
  "Beneficiarios": "#059669",
  "Eventos": "#7C3AED",
  "Comunicados oficiales": "#DC2626",
  "Patrocinadores": "#D97706",
  "Historias de impacto": "#0891B2",
  "Apoyos entregados": "#16A34A",
};

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [article, setArticle] = React.useState<NewsArticle | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const loadArticle = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("news")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (mounted) setArticle(data ? mapNews(data) : null);
      } catch (error) {
        console.error("Error al cargar noticia:", error);
        if (mounted) setArticle(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadArticle();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Cargando noticia...
        </Text>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          Noticia no encontrada
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primaryLight }}>Regresar</Text>
        </Pressable>
      </View>
    );
  }

  const imgSrc: ImageSourcePropType =
    article.image && article.image.startsWith("http")
      ? { uri: article.image }
      : IMAGES[article.image ?? ""] ?? IMAGES.hero_banner;
  const catColor = CATEGORY_COLORS[article.category] ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        {/* Hero image */}
        <View style={styles.imageContainer}>
          <Image source={imgSrc} style={styles.image} resizeMode="cover" />
          <View
            style={[
              styles.backBtn,
              {
                top: insets.top + (Platform.OS === "web" ? 67 : 16),
                backgroundColor: "rgba(0,0,0,0.4)",
              },
            ]}
          >
            <Pressable onPress={() => router.back()} style={styles.backPressable}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={[styles.categoryBadge, { backgroundColor: catColor + "18" }]}>
            <Text style={[styles.categoryText, { color: catColor }]}>
              {article.category}
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            {article.title}
          </Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {article.date}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="user" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {article.author}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.bodyText, { color: colors.foreground }]}>
            {article.content}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  imageContainer: { position: "relative" },
  image: { width: "100%", height: 280 },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backPressable: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
  meta: {
    flexDirection: "row",
    gap: 20,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
  },
  bodyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
  },
});
