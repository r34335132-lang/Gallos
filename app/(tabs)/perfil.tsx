import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  capturista: "Capturista",
  validador: "Validador",
  comunicacion: "Comunicación",
  tutor: "Tutor",
  patrocinador: "Patrocinador",
  visitante: "Visitante",
};

export default function PerfilScreen() {
  const colors = useColors();
  
  // EXTRAEMOS LAS VARIABLES CORRECTAS DEL AUTH CONTEXT
  const { profile, signOut, isGuest } = useAuth(); 
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === "web" ? 84 : 60;

  // VERIFICAR SI EL USUARIO TIENE PERMISOS ADMINISTRATIVOS
  const isAdmin = ["admin", "capturista", "validador", "comunicacion"].includes(profile?.role || "");

  const tutorItems = [
    { icon: "users" as const, label: "Mis beneficiarios", route: "/(tabs)/expedientes" },
    { icon: "paperclip" as const, label: "Mis documentos", route: "/documentos" },
    { icon: "bell" as const, label: "Notificaciones", route: "/notificaciones" },
  ];

  const adminItems = [
    { icon: "settings" as const, label: "Panel administrador", route: "/admin" },
    { icon: "bar-chart-2" as const, label: "Estadísticas", route: "/estadisticas" },
    { icon: "users" as const, label: "Expedientes", route: "/(tabs)/expedientes" },
    { icon: "award" as const, label: "Patrocinadores", route: "/patrocinadores" },
    { icon: "bell" as const, label: "Notificaciones", route: "/notificaciones" },
  ];
  
  const guestItems = [
    { icon: "bell" as const, label: "Notificaciones", route: "/notificaciones" },
  ];

  // ASIGNAR EL MENÚ CORRECTO SEGÚN EL ROL
  const menuItems = isAdmin ? adminItems : (isGuest ? guestItems : tutorItems);

  const handleLogout = async () => {
    await signOut(); // Se usa la función signOut del contexto
    // router.replace("/login"); ya está manejado dentro del signOut() en AuthContext
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 24),
          paddingBottom: tabBarHeight + insets.bottom + 24,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Tarjeta de Perfil */}
      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarWrap}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={[styles.roleTag, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.roleTagText}>
              {ROLE_LABELS[profile?.role ?? "visitante"]}
            </Text>
          </View>
        </View>
        
        {/* Mostrar Nombre y Correo Real del Contexto */}
        <Text style={styles.profileName}>{profile?.name ?? "Usuario"}</Text>
        <Text style={styles.profileEmail}>{profile?.email ?? ""}</Text>
        
        {profile?.phone && (
          <Text style={styles.profilePhone}>{profile.phone}</Text>
        )}
      </View>

      {/* Opciones del Menú */}
      <View style={[styles.menuSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {menuItems.map((item, index) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [
              styles.menuItem,
              {
                borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: colors.primary + "12" }]}>
              <Feather name={item.icon} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>
              {item.label}
            </Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      {/* Info Section */}
      <View style={[styles.menuSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Pressable
          style={[styles.menuItem, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: "#7C3AED12" }]}>
            <Feather name="info" size={18} color="#7C3AED" />
          </View>
          <Text style={[styles.menuLabel, { color: colors.foreground }]}>Acerca de Gallos Smiling</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => {}}>
          <View style={[styles.menuIconWrap, { backgroundColor: "#059669" + "12" }]}>
            <Feather name="shield" size={18} color="#059669" />
          </View>
          <Text style={[styles.menuLabel, { color: colors.foreground }]}>Privacidad y términos</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appInfoText, { color: colors.mutedForeground }]}>
          Gallos Smiling v1.0.0
        </Text>
        <Text style={[styles.appInfoText, { color: colors.mutedForeground }]}>
          Fundación Gallos Smiling · Club Gallos Blancos
        </Text>
      </View>

      {/* Botón de Logout */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          { borderColor: colors.destructive, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={handleLogout}
      >
        <Feather name={isGuest ? "log-in" : "log-out"} size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>
          {isGuest ? "Iniciar sesión / Registrarse" : "Cerrar sesión"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, gap: 20 },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatarWrap: { alignItems: "center", gap: 8, marginBottom: 4 },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleTagText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  profileEmail: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  profilePhone: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  menuSection: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  appInfo: { alignItems: "center", gap: 4 },
  appInfoText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});