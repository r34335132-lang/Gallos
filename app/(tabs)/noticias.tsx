import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NewsCard } from "@/components/NewsCard";
import { COMMUNICATIONS, NEWS } from "@/data/mock";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";

type Tab = "noticias" | "comunicados";

const CATEGORIES = ["Todas", "Fundación", "Club Gallos Blancos", "Beneficiarios", "Eventos", "Patrocinadores", "Historias de impacto"];

export default function NoticiasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === "web" ? 84 : 60;
  const [activeTab, setActiveTab] = useState<Tab>("noticias");
  const [activeCategory, setActiveCategory] = useState("Todas");

  const filteredNews = activeCategory === "Todas"
    ? NEWS
    : NEWS.filter((n) => n.category === activeCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.primary,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          },
        ]}
      >
        <Text style={styles.headerTitle}>Noticias</Text>
        <View style={styles.tabs}>
          {(["noticias", "comunicados"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              style={[
                styles.tab,
                activeTab === t && styles.tabActive,
              ]}
              onPress={() => setActiveTab(t)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === t ? colors.primary : "rgba(255,255,255,0.7)" },
                ]}
              >
                {t === "noticias" ? "Noticias" : "Comunicados"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {activeTab === "noticias" ? (
        <FlatList
          data={filteredNews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarHeight + insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: activeCategory === item ? colors.primary : colors.muted,
                      borderColor: activeCategory === item ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setActiveCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: activeCategory === item ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          }
          renderItem={({ item }) => <NewsCard article={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="file-text" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No hay noticias en esta categoría
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={COMMUNICATIONS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarHeight + insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.commCard,
                { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.foreground },
              ]}
            >
              <View style={styles.commHeader}>
                <StatusBadge status={item.priority} small />
                <Text style={[styles.commDate, { color: colors.mutedForeground }]}>{item.date}</Text>
              </View>
              <Text style={[styles.commTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.commCategory, { color: colors.mutedForeground }]}>{item.category}</Text>
              <Text style={[styles.commContent, { color: colors.mutedForeground }]} numberOfLines={3}>
                {item.content}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    gap: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginBottom: -1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 0,
  },
  categoryList: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  commCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  commHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  commTitle: { fontSize: 15, fontFamily: "Inter_700Bold", lineHeight: 22 },
  commCategory: { fontSize: 12, fontFamily: "Inter_500Medium" },
  commContent: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
