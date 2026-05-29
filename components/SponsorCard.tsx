import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import type { Sponsor } from "@/lib/appData";

interface Props {
  sponsor: Sponsor;
}

export function SponsorCard({ sponsor }: Props) {
  const colors = useColors();
  const isGold = sponsor.level === "Oro";
  const isSilver = sponsor.level === "Plata";

  // --- TARJETA ORO (PREMIUM Y GRANDE) ---
  if (isGold) {
    return (
      <View style={[styles.cardContainer, { height: 220 }]}>
        <LinearGradient colors={["#F59E0B", "#B45309"]} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.goldBadge}>
            <Feather name="star" size={12} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.goldBadgeText}>PATROCINADOR ORO</Text>
          </View>
          
          <View style={styles.goldContent}>
            <View style={[styles.logoContainerLg, { backgroundColor: "#FFF" }]}>
              {sponsor.logo ? (
                <Image source={{ uri: sponsor.logo }} style={styles.logoImg} resizeMode="contain" />
              ) : (
                <Feather name="award" size={40} color="#F59E0B" />
              )}
            </View>
            <Text style={styles.goldTitle} numberOfLines={1}>{sponsor.name}</Text>
            {sponsor.description ? (
              <Text style={styles.goldDesc} numberOfLines={2}>{sponsor.description}</Text>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // --- TARJETA PLATA (MEDIANA) ---
  if (isSilver) {
    return (
      <View style={[styles.cardContainer, { height: 120 }]}>
        <LinearGradient colors={["#9CA3AF", "#4B5563"]} style={styles.gradientRow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={[styles.logoContainerMd, { backgroundColor: "#FFF" }]}>
            {sponsor.logo ? (
              <Image source={{ uri: sponsor.logo }} style={styles.logoImg} resizeMode="contain" />
            ) : (
              <Feather name="award" size={28} color="#9CA3AF" />
            )}
          </View>
          <View style={styles.rowInfo}>
            <Text style={styles.silverTitle} numberOfLines={1}>{sponsor.name}</Text>
            <Text style={styles.silverBadgeText}>Patrocinador Plata</Text>
            {sponsor.description ? (
              <Text style={styles.silverDesc} numberOfLines={2}>{sponsor.description}</Text>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    );
  }

  // --- TARJETAS BRONCE / BENEFACTOR (NORMALES) ---
  return (
    <View style={[styles.standardCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[styles.logoContainerSm, { backgroundColor: colors.primary + "12" }]}>
        {sponsor.logo ? (
          <Image source={{ uri: sponsor.logo }} style={styles.logoImg} resizeMode="cover" />
        ) : (
          <Feather name="award" size={24} color={colors.primary} />
        )}
      </View>
      <View style={styles.standardInfo}>
        <Text style={[styles.standardTitle, { color: colors.foreground }]} numberOfLines={1}>{sponsor.name}</Text>
        <Text style={[styles.standardLevel, { color: colors.primary }]}>{sponsor.level}</Text>
        {sponsor.description ? (
          <Text style={[styles.standardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{sponsor.description}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { borderRadius: 16, overflow: "hidden", marginBottom: 12, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  gradient: { flex: 1, padding: 16, justifyContent: "center", alignItems: "center" },
  gradientRow: { flex: 1, padding: 16, flexDirection: "row", alignItems: "center", gap: 16 },
  
  // GOLD
  goldBadge: { position: "absolute", top: 12, right: 16, backgroundColor: "rgba(0,0,0,0.3)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center" },
  goldBadgeText: { color: "#FFF", fontSize: 10, fontFamily: "Inter_700Bold" },
  goldContent: { alignItems: "center", width: "100%", marginTop: 10 },
  logoContainerLg: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", marginBottom: 12, overflow: "hidden", padding: 4, elevation: 5 },
  goldTitle: { color: "#FFF", fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 4 },
  goldDesc: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20 },
  
  // SILVER
  logoContainerMd: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 4, elevation: 3 },
  rowInfo: { flex: 1, justifyContent: "center" },
  silverTitle: { color: "#FFF", fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  silverBadgeText: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 4, textTransform: "uppercase" },
  silverDesc: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },

  // STANDARD
  standardCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12, gap: 12 },
  logoContainerSm: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  standardInfo: { flex: 1 },
  standardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  standardLevel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  standardDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  
  logoImg: { width: "100%", height: "100%", borderRadius: 100 },
});