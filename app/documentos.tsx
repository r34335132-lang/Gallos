import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBadge } from "@/components/StatusBadge";
import { DOCUMENTS } from "@/data/mock";
import { useColors } from "@/hooks/useColors";

const ALL_DOC_TYPES = [
  "Acta de nacimiento",
  "CURP",
  "Comprobante de domicilio",
  "Identificación oficial del tutor",
  "Comprobante médico",
  "Diagnóstico médico",
  "Comprobante escolar",
  "Fotografía del beneficiario",
  "Carta de solicitud",
  "Otros documentos",
];

export default function DocumentosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const docs = DOCUMENTS.filter((d) => d.beneficiaryId === "b1");

  const getDocForType = (name: string) =>
    docs.find((d) => d.name === name);

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
        <Text style={styles.headerTitle}>Gestión documental</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={ALL_DOC_TYPES}
        keyExtractor={(item) => item}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={[styles.alertBanner, { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }]}>
            <Feather name="alert-triangle" size={16} color="#92400E" />
            <Text style={[styles.alertText, { color: "#92400E" }]}>
              Tienes documentos pendientes o con correcciones requeridas. Completa tu expediente para avanzar en el proceso.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const doc = getDocForType(item);
          const status = doc?.status ?? "pendiente";
          return (
            <View
              style={[
                styles.docCard,
                { backgroundColor: colors.background, borderColor: colors.border, shadowColor: colors.foreground },
              ]}
            >
              <View style={[styles.docIconWrap, { backgroundColor: colors.primary + "12" }]}>
                <Feather name="file-text" size={20} color={colors.primary} />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docName, { color: colors.foreground }]}>{item}</Text>
                {doc?.uploadDate && (
                  <Text style={[styles.docDate, { color: colors.mutedForeground }]}>
                    Subido: {doc.uploadDate}
                  </Text>
                )}
                {doc?.adminComment && (
                  <View style={[styles.commentBox, { backgroundColor: colors.warning + "15" }]}>
                    <Feather name="message-square" size={12} color={colors.warning} />
                    <Text style={[styles.commentText, { color: colors.foreground }]}>
                      {doc.adminComment}
                    </Text>
                  </View>
                )}
                <StatusBadge status={status} small />
              </View>
              <View style={styles.docActions}>
                {(status === "pendiente" || status === "requiere_correccion" || status === "rechazado") && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Alert.alert("Subir documento", `Selecciona el archivo para: ${item}`)}
                  >
                    <Feather name="upload" size={14} color="#FFFFFF" />
                  </Pressable>
                )}
                {doc && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => Alert.alert("Ver documento", `Abriendo: ${item}`)}
                  >
                    <Feather name="eye" size={14} color={colors.foreground} />
                  </Pressable>
                )}
              </View>
            </View>
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
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
  list: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  alertBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
    marginBottom: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  docInfo: { flex: 1, gap: 6 },
  docName: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  docDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  commentBox: {
    flexDirection: "row",
    gap: 6,
    padding: 8,
    borderRadius: 8,
    alignItems: "flex-start",
  },
  commentText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  docActions: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 2 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
