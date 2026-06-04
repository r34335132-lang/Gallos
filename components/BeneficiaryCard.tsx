import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBadge } from "./StatusBadge";
import { useColors } from "@/hooks/useColors";
import type { Beneficiary } from "@/lib/appData";

interface Props {
  beneficiary: Beneficiary;
}

export function BeneficiaryCard({ beneficiary: b }: Props) {
  const colors = useColors();

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
      onPress={() => router.push(`/expediente/${b.id}`)}
    >
      {b.photo ? (
        <Image source={{ uri: b.photo }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="user" size={22} color={colors.primary} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {b.name}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {b.municipality || "Sin municipio registrado"}
        </Text>
        <Text style={[styles.folio, { color: colors.mutedForeground }]}>
          Folio: {b.folio || "Sin folio"}
        </Text>
        <View style={styles.row}>
          <StatusBadge status={b.status} small />
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  folio: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    marginTop: 4,
  },
});
