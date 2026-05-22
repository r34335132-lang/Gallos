import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { BENEFICIARIES, DOCUMENTS } from "@/data/mock";
import { useColors } from "@/hooks/useColors";

export default function ExpedienteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuth();
  const b = BENEFICIARIES.find((x) => x.id === id);
  const docs = DOCUMENTS.filter((d) => d.beneficiaryId === id);

  if (!b) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          Expediente no encontrado
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primaryLight }}>Regresar</Text>
        </Pressable>
      </View>
    );
  }

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
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Expediente
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Card */}
        <View style={[styles.identityCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "20" }]}>
          <View style={[styles.avatarLg, { backgroundColor: colors.primary + "20" }]}>
            <Feather name="user" size={36} color={colors.primary} />
          </View>
          <View style={styles.identityInfo}>
            <Text style={[styles.benefName, { color: colors.foreground }]}>{b.name}</Text>
            <Text style={[styles.benefAge, { color: colors.mutedForeground }]}>
              {b.age} años · {b.gender}
            </Text>
            <Text style={[styles.folioText, { color: colors.primary }]}>Folio: {b.folio}</Text>
            <StatusBadge status={b.status} />
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Información personal</Text>
          {[
            { label: "CURP", value: b.curp },
            { label: "Fecha de nacimiento", value: b.birthDate },
            { label: "Municipio", value: b.municipality },
            { label: "Zona", value: b.zone },
            { label: "Dirección", value: b.address },
            { label: "Escuela", value: b.school },
            { label: "Grado", value: b.gradeLevel },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Discapacidad</Text>
          {[
            { label: "Tipo", value: b.disabilityType },
            { label: "Diagnóstico", value: b.diagnosis },
            { label: "Necesidades", value: b.needs },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tutor</Text>
          {[
            { label: "Nombre", value: b.tutorName },
            { label: "Apoyo solicitado", value: b.supportType },
            { label: "Fecha de registro", value: b.registrationDate },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Documents */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documentos</Text>
          {docs.length === 0 ? (
            <Text style={[styles.emptyDocs, { color: colors.mutedForeground }]}>
              No hay documentos registrados.
            </Text>
          ) : (
            docs.map((doc) => (
              <View
                key={doc.id}
                style={[styles.docRow, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.docIconWrap, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="file" size={16} color={colors.primary} />
                </View>
                <View style={styles.docInfo}>
                  <Text style={[styles.docName, { color: colors.foreground }]}>{doc.name}</Text>
                  {doc.uploadDate && (
                    <Text style={[styles.docDate, { color: colors.mutedForeground }]}>
                      {doc.uploadDate}
                    </Text>
                  )}
                  {doc.adminComment && (
                    <Text style={[styles.docComment, { color: colors.warning }]}>
                      {doc.adminComment}
                    </Text>
                  )}
                </View>
                <StatusBadge status={doc.status} small />
              </View>
            ))
          )}
        </View>

        {/* Admin Actions */}
        {isAdmin && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Acciones administrativas</Text>
            <View style={styles.adminButtons}>
              <Pressable
                style={[styles.adminBtn, { backgroundColor: colors.success }]}
                onPress={() => Alert.alert("Aprobado", "El expediente ha sido aprobado.")}
              >
                <Feather name="check" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Aprobar</Text>
              </Pressable>
              <Pressable
                style={[styles.adminBtn, { backgroundColor: colors.destructive }]}
                onPress={() => Alert.alert("Rechazado", "El expediente ha sido rechazado.")}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Rechazar</Text>
              </Pressable>
              <Pressable
                style={[styles.adminBtn, { backgroundColor: colors.warning }]}
                onPress={() => Alert.alert("Corrección", "Se ha solicitado corrección.")}
              >
                <Feather name="edit-2" size={16} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>Solicitar corrección</Text>
              </Pressable>
            </View>
            {b.notes && (
              <View style={[styles.notesCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.notesLabel, { color: colors.mutedForeground }]}>Notas internas</Text>
                <Text style={[styles.notesText, { color: colors.foreground }]}>{b.notes}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
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
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  identityCard: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  avatarLg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  identityInfo: { flex: 1, gap: 4 },
  benefName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  benefAge: { fontSize: 13, fontFamily: "Inter_400Regular" },
  folioText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 0,
    overflow: "hidden",
  },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyDocs: { fontSize: 14, fontFamily: "Inter_400Regular" },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  docIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: { flex: 1, gap: 2 },
  docName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  docDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  docComment: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  adminButtons: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  adminBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  notesCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  notesLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  notesText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
