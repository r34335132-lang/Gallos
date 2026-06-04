import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NewsCard } from "@/components/NewsCard";
import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  deriveStats,
  EMPTY_STATS,
  mapBeneficiary,
  mapDocument,
  mapNews,
  mapSponsor,
  mapStats,
  type NewsArticle,
  type Stats,
} from "@/lib/appData";
import { supabase } from "@/lib/supabase";

const LOGO = require("@/assets/images/logo.png");

// --- URL DE LA NUEVA IMAGEN PARA EL HERO CARD ---
const HERO_IMAGE_URL = "https://jfutdmtjcunkvefojlgm.supabase.co/storage/v1/object/public/img/WhatsApp%20Image%202026-05-28%20at%205.22.54%20PM.jpeg";

const QUICK_ACTIONS = [
  { label: "Noticias", icon: "file-text" as const, route: "/(tabs)/noticias", color: "#1A4FA8" },
  { label: "Beneficiarios", icon: "users" as const, route: "/(tabs)/expedientes", color: "#059669" },
  { label: "Documentos", icon: "paperclip" as const, route: "/documentos", color: "#7C3AED" },
  { label: "Patrocinadores", icon: "award" as const, route: "/patrocinadores", color: "#D97706" },
  { label: "Estadísticas", icon: "bar-chart-2" as const, route: "/estadisticas", color: "#0891B2" },
  { label: "Comunicados", icon: "bell" as const, route: "/notificaciones", color: "#DC2626" },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const { user, isAdmin } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === "web" ? 84 : 60;
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [featuredNews, setFeaturedNews] = useState<NewsArticle | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadHomeData = async () => {
      try {
        const [{ data: statsRow }, { data: newsRow }] = await Promise.all([
          supabase.from("app_stats").select("*").maybeSingle(),
          supabase.from("news").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);

        if (!mounted) return;
        if (statsRow) setStats(mapStats(statsRow));
        if (newsRow) setFeaturedNews(mapNews(newsRow));

        if (!statsRow) {
          const [beneficiariesRes, documentsRes, sponsorsRes] = await Promise.all([
            supabase.from("beneficiaries").select("*"),
            supabase.from("documents").select("*"),
            supabase.from("sponsors").select("*"),
          ]);

          if (!mounted) return;
          setStats(
            deriveStats(
              (beneficiariesRes.data || []).map(mapBeneficiary),
              (documentsRes.data || []).map(mapDocument),
              (sponsorsRes.data || []).map(mapSponsor)
            )
            );
        }
      } catch (error) {
        console.error("Error al cargar inicio:", error);
      }
    };

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: tabBarHeight + insets.bottom + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {greeting()},
            </Text>
            <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
              {user?.name?.split(" ")[0] ?? "Usuario"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {isAdmin && (
            <Pressable
              style={[styles.adminBadge, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/admin")}
            >
              <Feather name="settings" size={14} color="#FFFFFF" />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.notifBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={() => router.push("/notificaciones")}
          >
            <Feather name="bell" size={20} color={colors.foreground} />
            <View style={[styles.notifDot, { backgroundColor: colors.destructive }]} />
          </Pressable>
        </View>
      </View>

      {/* Hero Card */}
      <Pressable
        style={[styles.heroCard, { shadowColor: colors.primary }]}
        onPress={() => router.push("/(tabs)/registrar")}
      >
        <Image
          // --- CAMBIO AQUÍ: USAMOS LA URL REMOTA ---
          source={{ uri: HERO_IMAGE_URL }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Gallos Smiling</Text>
          <Text style={styles.heroSubtitle}>
            Deporte, comunidad y esperanza.
          </Text>
          <View style={styles.heroButton}>
            <Feather name="user-plus" size={14} color="#FFFFFF" />
            <Text style={styles.heroButtonText}>Registrar beneficiario</Text>
          </View>
        </View>
      </Pressable>

      {/* Impact Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Impacto Gallos Smiling
        </Text>
        <View style={styles.statsGrid}>
          <StatsCard
            label="Beneficiarios apoyados"
            value={stats.supportDelivered}
            icon="users"
            color={colors.primary}
          />
          <StatsCard
            label="Familias acompañadas"
            value={stats.familiesHelped}
            icon="heart"
            color="#059669"
          />
        </View>
        <View style={styles.statsGrid}>
          <StatsCard
            label="Patrocinadores activos"
            value={stats.activeSponsors}
            icon="award"
            color="#D97706"
          />
          <StatsCard
            label="Apoyos entregados"
            value={stats.approvedRequests}
            icon="check-circle"
            color="#7C3AED"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Accesos rápidos
        </Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: colors.foreground,
                },
              ]}
              onPress={() => router.push(action.route as any)}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: action.color + "15" }]}
              >
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.foreground }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Featured News */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Noticia destacada
          </Text>
          <Pressable onPress={() => router.push("/(tabs)/noticias")}>
            <Text style={[styles.seeAll, { color: colors.primaryLight }]}>Ver todas</Text>
          </Pressable>
        </View>
        {featuredNews ? (
          <NewsCard article={featuredNews} featured />
        ) : (
          <View style={[styles.emptyNews, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            <Feather name="file-text" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyNewsText, { color: colors.mutedForeground }]}>
              Aún no hay noticias publicadas.
            </Text>
          </View>
        )}
      </View>

      {/* Tagline */}
      <View style={[styles.taglineCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.taglineText}>
          "Cada beneficiario representa una historia."
        </Text>
        <Text style={styles.taglineSub}>
          Juntos impulsamos el futuro de nuestros beneficiarios.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 48, height: 48 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroImage: {
    width: "100%",
    height: 200,
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 4,
    backgroundColor: "rgba(13,43,110,0.7)",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  taglineCard: {
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  taglineText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontStyle: "italic",
    lineHeight: 24,
  },
  taglineSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  emptyNews: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  emptyNewsText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
