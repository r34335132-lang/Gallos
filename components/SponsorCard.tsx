import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Sponsor } from "@/lib/appData";

const LEVEL_COLORS: Record<string, { color: string; bg: string }> = {
  Oro: { color: "#92400E", bg: "#FEF3C7" },
  Plata: { color: "#374151", bg: "#F3F4F6" },
  Bronce: { color: "#7C2D12", bg: "#FFF7ED" },
  "Donador recurrente": { color: "#1E40AF", bg: "#DBEAFE" },
  "Donador único": { color: "#5B21B6", bg: "#EDE9FE" },
  "Benefactor principal": { color: "#065F46", bg: "#D1FAE5" },
  "Apoyo en especie": { color: "#0891B2", bg: "#CFFAFE" },
};

interface Props {
  sponsor: Sponsor;
}

export function SponsorCard({ sponsor }: Props) {
  const colors = useColors();
  const levelStyle = LEVEL_COLORS[sponsor.level] ?? { color: colors.primary, bg: colors.secondary };

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
      ]}
      onPress={() => router.push("/patrocinadores")}
    >
      <View style={[styles.logoWrap, { backgroundColor: colors.primary + "12" }]}>
        <Feather name="award" size={28} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {sponsor.name}
        </Text>
        <View style={[styles.levelBadge, { backgroundColor: levelStyle.bg }]}>
          <Text style={[styles.levelText, { color: levelStyle.color }]}>
            {sponsor.level}
          </Text>
        </View>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {sponsor.beneficiaries} beneficiarios apoyados
        </Text>
      </View>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: sponsor.status === "activo" ? "#10B981" : "#9CA3AF" },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
