import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { mapNotification, type AppNotification } from "@/lib/appData";
import { supabase } from "@/lib/supabase";

const TYPE_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  success: { icon: "check-circle", color: "#059669", bg: "#D1FAE5" },
  error: { icon: "x-circle", color: "#DC2626", bg: "#FEE2E2" },
  info: { icon: "info", color: "#1A4FA8", bg: "#DBEAFE" },
  warning: { icon: "alert-triangle", color: "#D97706", bg: "#FEF3C7" },
};

export default function NotificacionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        // Eliminamos la búsqueda por user_id porque las alertas son globales
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50); // Límite de seguridad

        if (error) throw error;
        if (mounted) setNotifications((data || []).map(mapNotification));
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [profile?.id]);

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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedForeground, marginTop: 10 }}>Cargando notificaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell-off" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No tienes notificaciones por ahora.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.info;
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
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