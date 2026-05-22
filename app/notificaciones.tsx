import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const NOTIFICATIONS: Notification[] = [
  { id: "notif1", type: "success", title: "Solicitud aprobada", body: "El expediente GS-2026-001 de Valentina López ha sido aprobado.", time: "Hace 1 hora", read: false },
  { id: "notif2", type: "error", title: "Documento rechazado", body: "El diagnóstico médico del expediente GS-2026-008 fue rechazado. Por favor vuelva a subir.", time: "Hace 3 horas", read: false },
  { id: "notif3", type: "info", title: "Nuevo comunicado", body: "Se ha publicado un nuevo comunicado: Convocatoria para nuevos beneficiarios — Mayo 2026.", time: "Hace 5 horas", read: true },
  { id: "notif4", type: "warning", title: "Corrección solicitada", body: "El expediente GS-2026-003 requiere corrección en el documento de diagnóstico médico.", time: "Ayer", read: true },
  { id: "notif5", type: "info", title: "En revisión", body: "Tu solicitud GS-2026-009 está siendo revisada por el equipo de la fundación.", time: "Ayer", read: true },
  { id: "notif6", type: "success", title: "Nuevo patrocinador", body: "Grupo Industrial del Norte ha renovado su patrocinio como Patrocinador Oro.", time: "Hace 3 días", read: true },
  { id: "notif7", type: "info", title: "Nueva noticia publicada", body: "Historia de impacto: Valentina, de la silla a la cancha.", time: "Hace 4 días", read: true },
];

const TYPE_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  success: { icon: "check-circle", color: "#059669", bg: "#D1FAE5" },
  error: { icon: "x-circle", color: "#DC2626", bg: "#FEE2E2" },
  info: { icon: "info", color: "#1A4FA8", bg: "#DBEAFE" },
  warning: { icon: "alert-triangle", color: "#D97706", bg: "#FEF3C7" },
};

export default function NotificacionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const config = TYPE_CONFIG[item.type];
          return (
            <Pressable
              style={({ pressed }) => [
                styles.notifCard,
                {
                  backgroundColor: item.read ? colors.background : colors.primary + "06",
                  borderColor: item.read ? colors.border : colors.primary + "25",
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: colors.foreground,
                },
              ]}
            >
              <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                <Feather name={config.icon} size={20} color={config.color} />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, { color: colors.foreground }]}>
                    {item.title}
                  </Text>
                  {!item.read && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                  )}
                </View>
                <Text style={[styles.notifBody, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                  {item.time}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_700Bold" },
  badge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "#0D2B6E", fontSize: 11, fontFamily: "Inter_700Bold" },
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  notifCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: { flex: 1, gap: 4 },
  notifHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notifTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
