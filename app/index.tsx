import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { NewsCard } from "@/components/NewsCard";
import { PublicScaffold } from "@/components/PublicScaffold";
import SponsorCard from "@/components/SponsorCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { loadPublicBundle, type Campaign, type PublicEvent, type SiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/publicContent";
import type { GalleryItem, NewsArticle, Sponsor } from "@/lib/appData";

const HERO = require("@/assets/images/hero_banner.png");

export default function PublicHome() {
  const colors = useColors();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let mounted = true;
    loadPublicBundle()
      .then((bundle) => {
        if (!mounted) return;
        setNews(bundle.news);
        setGallery(bundle.gallery);
        setCampaigns(bundle.campaigns);
        setEvents(bundle.events);
        setSponsors(bundle.sponsors);
        setSettings(bundle.settings);
      })
      .catch((error) => console.error("Error cargando home publica:", error))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PublicScaffold>
      <View style={styles.hero}>
        <Image source={HERO} style={styles.heroImg} resizeMode="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroBody}>
          <Text style={styles.heroTitle}>Gallos Smiling</Text>
          <Text style={styles.heroCopy}>
            Una experiencia web/PWA para comunicacion institucional, noticias, eventos, galeria, apoyo y seguimiento seguro de documentacion.
          </Text>
          <View style={styles.heroActions}>
            <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/sobre-nosotros" as any)}>
              <Text style={styles.primaryText}>Conoce la fundacion</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push((user ? (isAdmin ? "/admin" : "/dashboard") : "/login") as any)}>
              <Text style={styles.secondaryText}>{user ? "Ir al dashboard" : "Iniciar sesion"}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <>
          <View style={styles.impactGrid}>
            <Impact label="Beneficiarios" value={settings.impactBeneficiaries || sponsors.reduce((sum, item) => sum + item.beneficiaries, 0)} icon="users" color="#1A4FA8" />
            <Impact label="Campanas" value={settings.impactCampaigns || campaigns.length} icon="target" color="#059669" />
            <Impact label="Eventos" value={settings.impactEvents || events.length} icon="calendar" color="#7C3AED" />
            <Impact label="Aliados" value={sponsors.length} icon="award" color="#D97706" />
          </View>

          <SectionHeader title="Noticias recientes" action="Ver noticias" route="/noticias" />
          <View style={styles.newsGrid}>
            {news.slice(0, 3).map((item) => <View key={item.id} style={styles.newsItem}><NewsCard article={item} /></View>)}
            {news.length === 0 && <Empty text="Aun no hay noticias publicadas." />}
          </View>

          <SectionHeader title="Galeria destacada" action="Ver galeria" route="/galeria" />
          <View style={styles.galleryGrid}>
            {gallery.slice(0, 6).map((item) => (
              <Pressable key={item.id} style={[styles.galleryCard, { backgroundColor: colors.card }]} onPress={() => router.push("/galeria")}>
                {item.thumbnailUrl || item.type === "imagen" ? <Image source={{ uri: item.thumbnailUrl || item.mediaUrl }} style={styles.galleryImage} resizeMode="cover" /> : null}
                {item.type === "video" && <View style={styles.videoMark}><Feather name="play" size={16} color="#fff" /></View>}
                <Text style={styles.galleryTitle} numberOfLines={2}>{item.title}</Text>
              </Pressable>
            ))}
            {gallery.length === 0 && <Empty text="La galeria publica esta lista para fotos y videos." />}
          </View>

          <SectionHeader title="Campanas y eventos" action="Ver todo" route="/campanas" />
          <View style={styles.cardGrid}>
            {campaigns.slice(0, 2).map((item) => <InfoCard key={item.id} title={item.title} text={item.description} icon="target" color="#059669" route="/campanas" />)}
            {events.slice(0, 2).map((item) => <InfoCard key={item.id} title={item.title} text={`${item.eventDate} - ${item.location}`} icon="calendar" color="#7C3AED" route="/eventos" />)}
          </View>

          <SectionHeader title="Patrocinadores" action="Ver aliados" route="/patrocinadores" />
          <View style={styles.sponsorGrid}>
            {sponsors.slice(0, 3).map((item) => <View key={item.id} style={styles.sponsorItem}><SponsorCard sponsor={item} /></View>)}
            {sponsors.length === 0 && <Empty text="Aqui apareceran patrocinadores y aliados." />}
          </View>

          <View style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaTitle}>Quieres apoyar a Gallos Smiling?</Text>
            <Text style={styles.ctaText}>Puedes colaborar con donaciones en especie, voluntariado, patrocinios o difusion.</Text>
            <Pressable style={styles.ctaBtn} onPress={() => router.push("/apoyar" as any)}>
              <Text style={[styles.ctaBtnText, { color: colors.primary }]}>Ver formas de apoyar</Text>
            </Pressable>
          </View>
        </>
      )}
    </PublicScaffold>
  );
}

function Impact({ label, value, icon, color }: { label: string; value: number; icon: keyof typeof Feather.glyphMap; color: string }) {
  return (
    <View style={styles.impactCard}>
      <View style={[styles.impactIcon, { backgroundColor: color + "16" }]}><Feather name={icon} size={22} color={color} /></View>
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, action, route }: { title: string; action: string; route: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={() => router.push(route as any)}><Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text></Pressable>
    </View>
  );
}

function InfoCard({ title, text, icon, color, route }: { title: string; text: string; icon: keyof typeof Feather.glyphMap; color: string; route: string }) {
  return (
    <Pressable style={styles.infoCard} onPress={() => router.push(route as any)}>
      <View style={[styles.infoIcon, { backgroundColor: color + "16" }]}><Feather name={icon} size={20} color={color} /></View>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoText} numberOfLines={3}>{text}</Text>
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  return <View style={styles.empty}><Text style={styles.emptyText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { minHeight: 420, borderRadius: 22, overflow: "hidden", justifyContent: "flex-end" },
  heroImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(13,43,110,0.58)" },
  heroBody: { padding: 26, maxWidth: 720, gap: 14 },
  heroTitle: { color: "#fff", fontSize: 42, lineHeight: 48, fontFamily: "Inter_700Bold" },
  heroCopy: { color: "rgba(255,255,255,0.92)", fontSize: 17, lineHeight: 26, fontFamily: "Inter_500Medium" },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  primaryBtn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 13 },
  primaryText: { color: "#fff", fontFamily: "Inter_700Bold" },
  secondaryBtn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 13, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },
  secondaryText: { color: "#fff", fontFamily: "Inter_700Bold" },
  loading: { padding: 50, alignItems: "center" },
  impactGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  impactCard: { flexGrow: 1, flexBasis: 160, borderRadius: 16, padding: 16, backgroundColor: "#F4F7FC", gap: 8 },
  impactIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  impactValue: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#0A0E1A" },
  impactLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#64748B" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  sectionTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0A0E1A" },
  sectionAction: { fontSize: 14, fontFamily: "Inter_700Bold" },
  newsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  newsItem: { flexGrow: 1, flexBasis: 280 },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  galleryCard: { flexGrow: 1, flexBasis: 150, height: 170, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end" },
  galleryImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  videoMark: { position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.56)", alignItems: "center", justifyContent: "center" },
  galleryTitle: { color: "#fff", fontFamily: "Inter_700Bold", padding: 12, backgroundColor: "rgba(0,0,0,0.45)" },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoCard: { flexGrow: 1, flexBasis: 240, padding: 16, borderRadius: 16, backgroundColor: "#F4F7FC", gap: 8 },
  infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  infoTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0A0E1A" },
  infoText: { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular", color: "#64748B" },
  sponsorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  sponsorItem: { flexGrow: 1, flexBasis: 280 },
  cta: { borderRadius: 20, padding: 22, gap: 10, marginTop: 10 },
  ctaTitle: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  ctaText: { color: "rgba(255,255,255,0.86)", fontSize: 15, lineHeight: 22, fontFamily: "Inter_400Regular" },
  ctaBtn: { backgroundColor: "#fff", alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  ctaBtnText: { fontFamily: "Inter_700Bold" },
  empty: { flex: 1, minHeight: 120, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F7FC", borderRadius: 16, padding: 16 },
  emptyText: { color: "#64748B", fontFamily: "Inter_600SemiBold", textAlign: "center" },
});
