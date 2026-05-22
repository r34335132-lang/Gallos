import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { NewsArticle } from "@/data/mock";

const IMAGES: Record<string, ReturnType<typeof require>> = {
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

interface Props {
  article: NewsArticle;
  featured?: boolean;
}

export function NewsCard({ article, featured }: Props) {
  const colors = useColors();
  const catColor = CATEGORY_COLORS[article.category] ?? colors.primary;
  const imgSrc = IMAGES[article.image] ?? IMAGES.hero_banner;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
          shadowColor: colors.foreground,
        },
        featured && styles.featured,
      ]}
      onPress={() => router.push(`/noticia/${article.id}`)}
    >
      <Image
        source={imgSrc}
        style={[styles.image, featured && styles.featuredImage]}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={[styles.categoryBadge, { backgroundColor: catColor + "18" }]}>
          <Text style={[styles.categoryText, { color: catColor }]}>
            {article.category}
          </Text>
        </View>
        <Text
          style={[styles.title, { color: colors.foreground }, featured && styles.featuredTitle]}
          numberOfLines={featured ? 3 : 2}
        >
          {article.title}
        </Text>
        <Text
          style={[styles.summary, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {article.summary}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {article.date}
          </Text>
          <Text style={[styles.readMore, { color: colors.primaryLight }]}>
            Leer más
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  featured: {
    borderWidth: 0,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  image: {
    width: "100%",
    height: 160,
  },
  featuredImage: {
    height: 200,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  featuredTitle: {
    fontSize: 18,
    lineHeight: 26,
  },
  summary: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  readMore: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
