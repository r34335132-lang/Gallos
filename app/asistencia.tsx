import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { ATTENDANCE_ROLES, MUNICIPALITIES, type UserRole } from "@/lib/appData";
import { goBack } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";

type AttendanceStatus = "asistio" | "no_asistio" | "justificado";
type RosterEntry = { id: string; name: string; folio: string | null; photo_url: string | null };
type SavedRecord = { id: string; status: AttendanceStatus };
type SessionSummary = { date: string; present: number; total: number };

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; short: string; color: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "asistio", label: "Asistió", short: "Asistió", color: "#059669", icon: "check" },
  { value: "no_asistio", label: "Faltó", short: "Faltó", color: "#DC2626", icon: "x" },
  { value: "justificado", label: "Justificado", short: "Justif.", color: "#D97706", icon: "file-text" },
];

const MISSING_MIGRATION_CODES = ["PGRST202", "PGRST204", "PGRST205", "42P01", "42703", "42883"];

const pad = (value: number) => String(value).padStart(2, "0");
const toISODate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function shiftDate(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return toISODate(new Date(year, month - 1, day + days));
}

function formatLongDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function AsistenciaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const canTakeAttendance = ATTENDANCE_ROLES.includes(profile?.role as UserRole);
  const today = toISODate(new Date());

  const [sede, setSede] = useState(MUNICIPALITIES[0]);
  const [date, setDate] = useState(today);
  const [activity, setActivity] = useState("Entrenamiento");
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [saved, setSaved] = useState<Record<string, SavedRecord>>({});
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [history, setHistory] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const loadRoster = async () => {
    const { data, error } = await supabase.rpc("attendance_roster", { p_sede: sede });
    if (error) throw error;
    setRoster((data || []) as RosterEntry[]);
  };

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("id, beneficiary_id, status")
      .eq("sede", sede)
      .eq("attendance_date", date);
    if (error) throw error;
    const savedMap: Record<string, SavedRecord> = {};
    for (const row of data || []) savedMap[row.beneficiary_id] = { id: row.id, status: row.status };
    setSaved(savedMap);
    setMarks(Object.fromEntries(Object.entries(savedMap).map(([id, record]) => [id, record.status])));
  };

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("attendance_date, status")
      .eq("sede", sede)
      .order("attendance_date", { ascending: false })
      .limit(1000);
    if (error) throw error;
    const byDate = new Map<string, SessionSummary>();
    for (const row of data || []) {
      const summary = byDate.get(row.attendance_date) || { date: row.attendance_date, present: 0, total: 0 };
      summary.total++;
      if (row.status === "asistio") summary.present++;
      byDate.set(row.attendance_date, summary);
    }
    setHistory(Array.from(byDate.values()).slice(0, 12));
  };

  const loadAll = async () => {
    if (!canTakeAttendance) return;
    setLoading(true);
    setSetupError(null);
    try {
      await Promise.all([loadRoster(), loadRecords(), loadHistory()]);
    } catch (error: any) {
      console.error("Error cargando asistencia:", error);
      setSetupError(
        MISSING_MIGRATION_CODES.includes(error?.code)
          ? "Falta aplicar la migración 202611110001_admin_gallery_attendance.sql en Supabase para activar la asistencia por sede."
          : error?.message || "No se pudo cargar la lista."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [sede, date, profile?.role]);

  const counts = STATUS_OPTIONS.map((option) => ({ ...option, count: roster.filter((entry) => marks[entry.id] === option.value).length }));
  const unmarked = roster.filter((entry) => !marks[entry.id]).length;
  const pendingChanges = roster.filter((entry) => marks[entry.id] && marks[entry.id] !== saved[entry.id]?.status).length;

  const markAllPresent = () => {
    setMarks((prev) => {
      const next = { ...prev };
      for (const entry of roster) if (!next[entry.id]) next[entry.id] = "asistio";
      return next;
    });
  };

  const saveAttendance = async () => {
    const toInsert = roster
      .filter((entry) => marks[entry.id] && !saved[entry.id])
      .map((entry) => ({
        beneficiary_id: entry.id,
        attendance_date: date,
        sede,
        event_name: activity.trim() || "Entrenamiento",
        status: marks[entry.id],
        created_by: profile?.id ?? null,
      }));
    const toUpdate = roster.filter((entry) => saved[entry.id] && marks[entry.id] && marks[entry.id] !== saved[entry.id].status);

    if (toInsert.length === 0 && toUpdate.length === 0) {
      return Alert.alert("Sin cambios", "Marca la asistencia de al menos un alumno.");
    }

    setSaving(true);
    try {
      if (toInsert.length > 0) {
        const { error } = await supabase.from("attendance_records").insert(toInsert);
        if (error) throw error;
      }
      for (const entry of toUpdate) {
        const { error } = await supabase
          .from("attendance_records")
          .update({ status: marks[entry.id], updated_at: new Date().toISOString() })
          .eq("id", saved[entry.id].id);
        if (error) throw error;
      }
      await Promise.all([loadRecords(), loadHistory()]);
      Alert.alert("Asistencia guardada", `${sede} · ${formatLongDate(date)}\n${toInsert.length + toUpdate.length} alumno(s) actualizados.`);
    } catch (error: any) {
      console.error("Error guardando asistencia:", error);
      Alert.alert("Error", error?.message || "No se pudo guardar la asistencia.");
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 24 : 16) }]}>
      <Pressable onPress={() => goBack("/admin")} style={styles.headerBtn} hitSlop={10}>
        <Feather name="arrow-left" size={22} color="#FFFFFF" />
      </Pressable>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Pasar asistencia</Text>
        {!!profile?.name && <Text style={styles.headerSub}>{profile.name}</Text>}
      </View>
      {profile?.role === "entrenador" ? (
        <Pressable onPress={signOut} style={styles.headerBtn} hitSlop={10}>
          <Feather name="log-out" size={20} color="#FFFFFF" />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
    </View>
  );

  if (!canTakeAttendance) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.center}>
          <Feather name="lock" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {profile ? "Tu cuenta no tiene acceso a la asistencia. Pide a un administrador que te asigne el rol de Entrenador." : "Inicia sesión para pasar asistencia."}
          </Text>
        </View>
      </View>
    );
  }

  const listHeader = (
    <View style={styles.controls}>
      <Text style={[styles.label, { color: colors.foreground }]}>Sede</Text>
      <View style={styles.chipWrap}>
        {MUNICIPALITIES.map((item) => {
          const active = item === sede;
          return (
            <Pressable
              key={item}
              style={[styles.chip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
              onPress={() => setSede(item)}
            >
              <Text style={[styles.chipText, { color: active ? "#FFFFFF" : colors.foreground }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.foreground }]}>Fecha</Text>
      <View style={[styles.dateRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable style={styles.dateBtn} onPress={() => setDate((value) => shiftDate(value, -1))} hitSlop={8}>
          <Feather name="chevron-left" size={22} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.dateText, { color: colors.foreground }]}>{formatLongDate(date)}</Text>
          {date === today ? (
            <Text style={[styles.todayBadge, { color: colors.primary }]}>Hoy</Text>
          ) : (
            <Pressable onPress={() => setDate(today)}>
              <Text style={[styles.todayBadge, { color: colors.primary }]}>Ir a hoy</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={[styles.dateBtn, date >= today && { opacity: 0.3 }]} onPress={() => setDate((value) => shiftDate(value, 1))} disabled={date >= today} hitSlop={8}>
          <Feather name="chevron-right" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={[styles.label, { color: colors.foreground }]}>Actividad</Text>
      <TextInput
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={activity}
        onChangeText={setActivity}
        placeholder="Entrenamiento"
        placeholderTextColor={colors.mutedForeground}
      />

      {!loading && !setupError && roster.length > 0 && (
        <>
          <View style={styles.summaryRow}>
            {counts.map((item) => (
              <View key={item.value} style={[styles.summaryPill, { backgroundColor: item.color + "15" }]}>
                <Text style={[styles.summaryValue, { color: item.color }]}>{item.count}</Text>
                <Text style={[styles.summaryLabel, { color: item.color }]}>{item.label}</Text>
              </View>
            ))}
            <View style={[styles.summaryPill, { backgroundColor: colors.muted }]}>
              <Text style={[styles.summaryValue, { color: colors.mutedForeground }]}>{unmarked}</Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Sin marcar</Text>
            </View>
          </View>
          {unmarked > 0 && (
            <Pressable style={[styles.markAllBtn, { borderColor: "#059669" }]} onPress={markAllPresent}>
              <Feather name="check-circle" size={16} color="#059669" />
              <Text style={styles.markAllText}>Marcar a los {unmarked} restantes como "Asistió"</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );

  const listFooter = (
    <View style={styles.footer}>
      {roster.length > 0 && (
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]} onPress={saveAttendance} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{pendingChanges > 0 ? `Guardar asistencia (${pendingChanges} cambio${pendingChanges === 1 ? "" : "s"})` : "Guardar asistencia"}</Text>
          )}
        </Pressable>
      )}

      {history.length > 0 && (
        <View style={[styles.historyBox, { borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Últimas sesiones en {sede}</Text>
          {history.map((session) => (
            <Pressable key={session.date} style={[styles.historyRow, { borderTopColor: colors.border }]} onPress={() => setDate(session.date)}>
              <Text style={[styles.historyDate, { color: session.date === date ? colors.primary : colors.foreground }]}>{formatLongDate(session.date)}</Text>
              <Text style={[styles.historyValue, { color: colors.mutedForeground }]}>
                {session.present}/{session.total} asistieron
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <FlatList
        data={loading || setupError ? [] : roster}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        ListEmptyComponent={
          <View style={styles.center}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.emptyText, { color: setupError ? colors.destructive : colors.mutedForeground }]}>
                {setupError || `No hay alumnos registrados en la sede ${sede}. Se agregan desde "Registrar beneficiario" eligiendo esta sede.`}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const current = marks[item.id];
          return (
            <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary + "18", alignItems: "center", justifyContent: "center" }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{item.name.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
                {!!item.folio && <Text style={[styles.rowFolio, { color: colors.mutedForeground }]}>{item.folio}</Text>}
              </View>
              <View style={styles.statusGroup}>
                {STATUS_OPTIONS.map((option) => {
                  const active = current === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityLabel={`${option.label}: ${item.name}`}
                      style={[styles.statusBtn, { backgroundColor: active ? option.color : colors.background, borderColor: active ? option.color : colors.border }]}
                      onPress={() => setMarks((prev) => ({ ...prev, [item.id]: option.value }))}
                    >
                      <Feather name={option.icon} size={16} color={active ? "#FFFFFF" : option.color} />
                      <Text style={[styles.statusText, { color: active ? "#FFFFFF" : option.color }]}>{option.short}</Text>
                    </Pressable>
                  );
                })}
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  list: { padding: 16, gap: 10, width: "100%", maxWidth: 820, alignSelf: "center" },
  controls: { gap: 10, marginBottom: 6 },
  label: { fontSize: 14, fontFamily: "Inter_700Bold" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dateRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 6 },
  dateBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  dateText: { fontSize: 15, fontFamily: "Inter_600SemiBold", textTransform: "capitalize", textAlign: "center" },
  todayBadge: { fontSize: 12, fontFamily: "Inter_700Bold", marginTop: 2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 15, fontFamily: "Inter_400Regular" },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  summaryPill: { flexGrow: 1, flexBasis: 70, borderRadius: 12, paddingVertical: 8, alignItems: "center" },
  summaryValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  markAllBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 11 },
  markAllText: { color: "#059669", fontSize: 13, fontFamily: "Inter_700Bold" },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  rowInfo: { flex: 1, minWidth: 140, gap: 2 },
  rowName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowFolio: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusGroup: { flexDirection: "row", gap: 6 },
  statusBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  footer: { gap: 16, marginTop: 8 },
  saveBtn: { height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  historyBox: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
  historyRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, borderTopWidth: 1, paddingVertical: 10 },
  historyDate: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  historyValue: { fontSize: 13, fontFamily: "Inter_500Medium" },
  center: { alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyText: { fontSize: 14, lineHeight: 21, fontFamily: "Inter_500Medium", textAlign: "center" },
});
