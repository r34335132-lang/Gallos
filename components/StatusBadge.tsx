import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { BeneficiaryStatus, CommPriority, DocStatus } from "@/data/mock";

type AnyStatus = BeneficiaryStatus | CommPriority | DocStatus | "activo" | "inactivo" | string;

interface Props {
  status: AnyStatus;
  small?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: "Pendiente", color: "#92400E", bg: "#FEF3C7" },
  en_revision: { label: "En revisión", color: "#1E40AF", bg: "#DBEAFE" },
  aprobado: { label: "Aprobado", color: "#065F46", bg: "#D1FAE5" },
  rechazado: { label: "Rechazado", color: "#991B1B", bg: "#FEE2E2" },
  activo: { label: "Activo", color: "#065F46", bg: "#D1FAE5" },
  inactivo: { label: "Inactivo", color: "#374151", bg: "#F3F4F6" },
  validado: { label: "Validado", color: "#065F46", bg: "#D1FAE5" },
  requiere_correccion: { label: "Correccion", color: "#92400E", bg: "#FEF3C7" },
  importante: { label: "Importante", color: "#1E40AF", bg: "#DBEAFE" },
  informativo: { label: "Informativo", color: "#065F46", bg: "#D1FAE5" },
  urgente: { label: "Urgente", color: "#991B1B", bg: "#FEE2E2" },
};

export function StatusBadge({ status, small }: Props) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: "#374151",
    bg: "#F3F4F6",
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        small && styles.small,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.color },
          small && styles.smallText,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  smallText: {
    fontSize: 10,
  },
});
