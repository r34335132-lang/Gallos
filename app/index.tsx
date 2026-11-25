import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { NewsCard } from "@/components/NewsCard";
import { PublicScaffold } from "@/components/PublicScaffold";
import SponsorCard from "@/components/SponsorCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { IS_PUBLIC_APP } from "@/lib/appVariant";
import { albumCountLabel, albumCoverUri, groupGalleryAlbums, type GalleryAlbum } from "@/lib/galleryAlbums";
import { openWebPortal } from "@/lib/nativeActions";
import { loadPublicBundle, type Campaign, type PublicEvent, type SiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/publicContent";
import type { NewsArticle, Sponsor } from "@/lib/appData";

const HERO = require("@/assets/images/hero_campeones.jpg");
const HERO_ASPECT_RATIO = 1024 / 906;

export default function PublicHome() {
  const colors = useColors();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
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
        setAlbums(groupGalleryAlbums(bundle.gallery));
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

  const impactItems = [
    { label: IS_PUBLIC_APP ? "Personas apoyadas" : "Beneficiarios", value: settings.impactBeneficiaries || sponsors.reduce((sum, item) => sum + item.beneficiaries, 0), icon: "users" as const, color: "#1A4FA8" },
    { label: "Campanas", value: settings.impactCampaigns || campaigns.length, icon: "target" as const, color: "#059669" },
    { label: "Eventos", value: settings.impactEvents || events.length, icon: "calendar" as const, color: "#7C3AED" },
    { label: "Aliados", value: sponsors.length, icon: "award" as const, color: "#D97706" },
  ].filter((item) => item.value > 0);

  return (
    <PublicScaffold>
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroMedia}>
          <Image source={HERO} style={styles.heroImg} resizeMode="contain" accessibilityLabel="Gallos Smiling: Somos campeones" />
        </View>
        <View style={styles.heroBody}>
          <Text style={styles.heroTitle}>Gallos Smiling</Text>
          <Text style={styles.heroCopy}>
            {IS_PUBLIC_APP
              ? "Noticias, eventos, galeria, campanas y formas de apoyar a la fundacion."
              : "Una experiencia web/PWA para comunicacion institucional, noticias, eventos, galeria, apoyo y seguimiento seguro de documentacion."}
          </Text>
          <View style={styles.heroActions}>
            <Pressable style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/sobre-nosotros" as any)}>
              <Text style={styles.primaryText}>Conoce la fundacion</Text>
            </Pressable>
            {IS_PUBLIC_APP ? (
              <Pressable style={styles.secondaryBtn} onPress={openWebPortal}>
                <Text style={styles.secondaryText}>Visitar sitio web</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.secondaryBtn} onPress={() => router.push((user ? (isAdmin ? "/admin" : "/dashboard") : "/login") as any)}>
                <Text style={styles.secondaryText}>{user ? "Ir al dashboard" : "Iniciar sesion"}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <>
          {impactItems.length > 0 && (
            <View style={styles.impactGrid}>
              {impactItems.map((item) => <Impact key={item.label} {...item} />)}
            </View>
          )}

          {news.length > 0 && (
            <>
              <SectionHeader title="Noticias recientes" action="Ver noticias" route="/noticias" />
              <View style={styles.newsGrid}>
                {news.slice(0, 3).map((item) => <View key={item.id} style={styles.newsItem}><NewsCard article={item} /></View>)}
              </View>
            </>
          )}

          {albums.length > 0 && <SectionHeader title="Galeria de torneos" action="Ver todos los albumes" route="/galeria" />}
          <View style={styles.galleryGrid}>
            {albums.slice(0, 6).map((album) => {
              const coverUri = albumCoverUri(album);
              return (
                <Pressable
                  key={album.id}
                  style={[styles.galleryCard, { backgroundColor: colors.primary }]}
                  onPress={() => router.push({ pathname: "/galeria", params: { album: album.id } } as any)}
                >
                  {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.galleryImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.galleryPlaceholder}>
                      <Feather name={album.videoCount > 0 ? "play-circle" : "image"} size={40} color="rgba(255,255,255,0.75)" />
                    </View>
                  )}
                  <View style={styles.albumCount}>
                    <Feather name="layers" size={12} color="#fff" />
                    <Text style={styles.albumCountText}>{albumCountLabel(album)}</Text>
                  </View>
                  <Text style={styles.galleryTitle} numberOfLines={2}>{album.title}</Text>
                </Pressable>
              );
            })}
          </View>

          {campaigns.length + events.length > 0 && (
            <>
              <SectionHeader title="Campanas y eventos" action="Ver todo" route="/campanas" />
              <View style={styles.cardGrid}>
                {campaigns.slice(0, 2).map((item) => <InfoCard key={item.id} title={item.title} text={item.description} icon="target" color="#059669" route="/campanas" />)}
                {events.slice(0, 2).map((item) => <InfoCard key={item.id} title={item.title} text={`${item.eventDate} - ${item.location}`} icon="calendar" color="#7C3AED" route="/eventos" />)}
              </View>
            </>
          )}

          {sponsors.length > 0 && (
            <>
              <SectionHeader title="Patrocinadores" action="Ver aliados" route="/patrocinadores" />
              <View style={styles.sponsorGrid}>
                {sponsors.slice(0, 3).map((item) => <View key={item.id} style={styles.sponsorItem}><SponsorCard sponsor={item} /></View>)}
              </View>
            </>
          )}

          <View style={[styles.cta, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaTitle}>Quieres apoyar a Gallos Smiling?</Text>
            <Text style={styles.ctaText}>Puedes colaborar con donaciones en especie, voluntariado, patrocinios o difusion.</Text>
            {!!settings.moniUrl && (
              <Text style={styles.ctaText}>Tambien puedes descargar la app Moni y apoyar a Gallos Smiling desde tu celular.</Text>
            )}
            <View style={styles.ctaActions}>
              {!!settings.moniUrl && (
                <Pressable style={styles.ctaBtn} onPress={() => Linking.openURL(settings.moniUrl)}>
                  <Feather name="download" size={15} color={colors.primary} />
                  <Text style={[styles.ctaBtnText, { color: colors.primary }]}>Descargar Moni</Text>
                </Pressable>
              )}
              <Pressable style={[styles.ctaBtn, !!settings.moniUrl && styles.ctaBtnOutline]} onPress={() => router.push("/apoyar" as any)}>
                <Text style={[styles.ctaBtnText, { color: settings.moniUrl ? "#fff" : colors.primary }]}>Ver formas de apoyar</Text>
              </Pressable>
            </View>
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

const styles = StyleSheet.create({
  hero: { borderRadius: 22, overflow: "hidden", flexDirection: "row", flexWrap: "wrap" },
  heroMedia: { flexGrow: 3, flexBasis: 340, justifyContent: "center" },
  heroImg: { width: "100%", height: "auto", aspectRatio: HERO_ASPECT_RATIO },
  heroBody: { flexGrow: 2, flexBasis: 300, padding: 26, gap: 14, justifyContent: "center" },
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
  galleryCard: { flexGrow: 1, flexBasis: 240, height: 200, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end" },
  galleryImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  galleryPlaceholder: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", paddingBottom: 30 },
  albumCount: { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(0,0,0,0.56)" },
  albumCountText: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  galleryTitle: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15, padding: 12, backgroundColor: "rgba(0,0,0,0.5)" },
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
  ctaActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  ctaBtnOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)" },
  ctaBtnText: { fontFamily: "Inter_700Bold" },
});
