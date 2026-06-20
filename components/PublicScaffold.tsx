import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const LOGO = require("@/assets/images/logo.png");

const NAV_ITEMS = [
  { label: "Home", route: "/", icon: "home" as const },
  { label: "Noticias", route: "/noticias", icon: "file-text" as const },
  { label: "Galeria", route: "/galeria", icon: "image" as const },
  { label: "Campanas", route: "/campanas", icon: "target" as const },
  { label: "Eventos", route: "/eventos", icon: "calendar" as const },
  { label: "Apoyar", route: "/apoyar", icon: "heart" as const },
  { label: "Contacto", route: "/contacto", icon: "message-circle" as const },
];

export function PublicScaffold({
  title,
  subtitle,
  children,
  heroImage,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  heroImage?: string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = width < 820;

  const go = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10, borderColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable style={styles.brand} onPress={() => go("/")}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={[styles.brandTitle, { color: colors.foreground }]}>Gallos Smiling</Text>
            <Text style={[styles.brandSub, { color: colors.mutedForeground }]}>Fundacion</Text>
          </View>
        </Pressable>

        {compact ? (
          <Pressable style={[styles.iconButton, { borderColor: colors.border }]} onPress={() => setMenuOpen((value) => !value)}>
            <Feather name={menuOpen ? "x" : "menu"} size={22} color={colors.foreground} />
          </Pressable>
        ) : (
          <View style={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <Pressable key={item.route} style={[styles.navItem, pathname === item.route && { backgroundColor: colors.primary + "12" }]} onPress={() => go(item.route)}>
                <Text style={[styles.navText, { color: pathname === item.route ? colors.primary : colors.mutedForeground }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!compact && (
          <Pressable style={[styles.loginButton, { backgroundColor: colors.primary }]} onPress={() => go(user ? (isAdmin ? "/admin" : "/dashboard") : "/login")}>
            <Feather name={user ? "layout" : "log-in"} size={15} color="#fff" />
            <Text style={styles.loginText}>{user ? "Dashboard" : "Login"}</Text>
          </Pressable>
        )}
      </View>

      {compact && menuOpen && (
        <View style={[styles.mobileMenu, { borderColor: colors.border, backgroundColor: colors.background }]}>
          {NAV_ITEMS.map((item) => (
            <Pressable key={item.route} style={styles.mobileNavItem} onPress={() => go(item.route)}>
              <Feather name={item.icon} size={17} color={colors.primary} />
              <Text style={[styles.mobileNavText, { color: colors.foreground }]}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.mobileLogin, { backgroundColor: colors.primary }]} onPress={() => go(user ? (isAdmin ? "/admin" : "/dashboard") : "/login")}>
            <Text style={styles.loginText}>{user ? "Ir al dashboard" : "Iniciar sesion"}</Text>
          </Pressable>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (compact ? 96 : 40) }]}>
        {title ? (
          <View style={[styles.hero, heroImage ? { minHeight: 280 } : null]}>
            {heroImage ? <Image source={{ uri: heroImage }} style={styles.heroImage} resizeMode="cover" /> : null}
            <View style={[styles.heroShade, !heroImage && { backgroundColor: colors.primary }]} />
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>{title}</Text>
              {!!subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
            </View>
          </View>
        ) : null}

        <View style={styles.content}>{children}</View>

        <View style={[styles.footer, { borderColor: colors.border }]}>
          <Text style={[styles.footerTitle, { color: colors.foreground }]}>Gallos Smiling</Text>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Comunicacion institucional, noticias, eventos, actividades, patrocinadores y seguimiento basico de documentacion.
          </Text>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => go("/privacidad")}><Text style={[styles.footerLink, { color: colors.primary }]}>Privacidad</Text></Pressable>
            <Pressable onPress={() => go("/terminos")}><Text style={[styles.footerLink, { color: colors.primary }]}>Terminos</Text></Pressable>
            <Pressable onPress={() => go("/manejo-documentos")}><Text style={[styles.footerLink, { color: colors.primary }]}>Documentos e imagenes</Text></Pressable>
            <Pressable onPress={() => Linking.openURL("mailto:contacto@gallossmiling.org")}><Text style={[styles.footerLink, { color: colors.primary }]}>Correo</Text></Pressable>
          </View>
        </View>
      </ScrollView>

      {compact && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: colors.background, borderColor: colors.border }]}>
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <Pressable key={item.route} style={styles.bottomItem} onPress={() => go(item.route)}>
              <Feather name={item.icon} size={19} color={pathname === item.route ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.bottomText, { color: pathname === item.route ? colors.primary : colors.mutedForeground }]} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { minHeight: 74, borderBottomWidth: 1, paddingHorizontal: 18, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 14 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 190 },
  logo: { width: 42, height: 42 },
  brandTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  brandSub: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 1 },
  nav: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  navItem: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999 },
  navText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  iconButton: { marginLeft: "auto", width: 42, height: 42, borderWidth: 1, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  loginButton: { flexDirection: "row", gap: 7, alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  loginText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  mobileMenu: { borderBottomWidth: 1, padding: 14, gap: 4 },
  mobileNavItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  mobileNavText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  mobileLogin: { alignItems: "center", marginTop: 8, borderRadius: 14, paddingVertical: 13 },
  scroll: { flexGrow: 1 },
  hero: { position: "relative", overflow: "hidden", justifyContent: "flex-end" },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(13,43,110,0.58)" },
  heroText: { paddingHorizontal: 22, paddingVertical: 34, maxWidth: 980, width: "100%", alignSelf: "center", gap: 8 },
  heroTitle: { color: "#fff", fontSize: 34, lineHeight: 40, fontFamily: "Inter_700Bold" },
  heroSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 16, lineHeight: 24, fontFamily: "Inter_500Medium", maxWidth: 760 },
  content: { width: "100%", maxWidth: 1120, alignSelf: "center", padding: 18, gap: 18 },
  footer: { width: "100%", maxWidth: 1120, alignSelf: "center", marginTop: 24, padding: 18, borderTopWidth: 1, gap: 8 },
  footerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  footerText: { fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular" },
  footerLinks: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 4 },
  footerLink: { fontSize: 13, fontFamily: "Inter_700Bold" },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, flexDirection: "row", paddingTop: 8 },
  bottomItem: { flex: 1, alignItems: "center", gap: 3 },
  bottomText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
});
