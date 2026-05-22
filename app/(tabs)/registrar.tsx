import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DISABILITY_TYPES,
  MUNICIPALITIES,
  SUPPORT_TYPES,
  ZONES,
} from "@/data/mock";
import { useColors } from "@/hooks/useColors";

const STEPS = [
  "Beneficiario",
  "Tutor",
  "Médico",
  "Apoyo",
  "Documentos",
  "Confirmar",
];

type FormData = {
  // Step 1 - Beneficiary
  name: string;
  birthDate: string;
  curp: string;
  gender: string;
  municipality: string;
  zone: string;
  address: string;
  school: string;
  gradeLevel: string;
  disabilityType: string;
  diagnosis: string;
  needs: string;
  observations: string;
  // Step 2 - Tutor
  tutorName: string;
  relationship: string;
  tutorPhone: string;
  tutorEmail: string;
  tutorAddress: string;
  occupation: string;
  // Step 3 - Medical
  primaryDiagnosis: string;
  treatingDoctor: string;
  hospital: string;
  treatingSpecialty: string;
  // Step 4 - Support
  supportType: string;
  supportReason: string;
  additionalComments: string;
};

const INITIAL: FormData = {
  name: "",
  birthDate: "",
  curp: "",
  gender: "",
  municipality: "",
  zone: "",
  address: "",
  school: "",
  gradeLevel: "",
  disabilityType: "",
  diagnosis: "",
  needs: "",
  observations: "",
  tutorName: "",
  relationship: "",
  tutorPhone: "",
  tutorEmail: "",
  tutorAddress: "",
  occupation: "",
  primaryDiagnosis: "",
  treatingDoctor: "",
  hospital: "",
  treatingSpecialty: "",
  supportType: "",
  supportReason: "",
  additionalComments: "",
};

function SelectChips({
  options,
  value,
  onSelect,
  colors,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={selectStyles.wrap}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[
            selectStyles.chip,
            {
              backgroundColor: value === opt ? colors.primary : colors.muted,
              borderColor: value === opt ? colors.primary : colors.border,
            },
          ]}
          onPress={() => onSelect(opt)}
        >
          <Text
            style={[
              selectStyles.chipText,
              { color: value === opt ? "#FFFFFF" : colors.mutedForeground },
            ]}
          >
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const selectStyles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  multiline?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={fieldStyles.group}>
      <Text style={[fieldStyles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[
          fieldStyles.input,
          {
            backgroundColor: colors.muted,
            borderColor: colors.border,
            color: colors.foreground,
          },
          multiline && fieldStyles.multiline,
        ]}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 48,
  },
  multiline: { minHeight: 80 },
});

export default function RegistrarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === "web" ? 84 : 60;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [folio] = useState(
    "GS-2026-0" + String(Math.floor(Math.random() * 90) + 11)
  );

  const set = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(INITIAL);
    setStep(0);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <View
        style={[
          styles.successContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40),
            paddingBottom: tabBarHeight + insets.bottom + 24,
          },
        ]}
      >
        <View
          style={[styles.successIcon, { backgroundColor: colors.success + "15" }]}
        >
          <Feather name="check-circle" size={56} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Solicitud enviada
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Tu solicitud ha sido registrada exitosamente.
        </Text>
        <View style={[styles.folioCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.folioLabel, { color: colors.mutedForeground }]}>
            Número de folio
          </Text>
          <Text style={[styles.folioValue, { color: colors.primary }]}>
            {folio}
          </Text>
          <Text style={[styles.folioNote, { color: colors.mutedForeground }]}>
            Guarda este folio para dar seguimiento a tu expediente.
          </Text>
        </View>
        <Text style={[styles.successNote, { color: colors.mutedForeground }]}>
          El equipo de la fundación revisará tu solicitud en un plazo de 5 días hábiles. Recibirás notificaciones sobre el avance.
        </Text>
        <Pressable
          style={[styles.newButton, { backgroundColor: colors.primary }]}
          onPress={handleReset}
        >
          <Text style={styles.newButtonText}>Registrar otro beneficiario</Text>
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
        <Text style={styles.headerTitle}>Registrar beneficiario</Text>
        <Text style={styles.headerSub}>
          Paso {step + 1} de {STEPS.length}: {STEPS[step]}
        </Text>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((step + 1) / STEPS.length) * 100}%` },
            ]}
          />
        </View>
        {/* Step indicators */}
        <View style={styles.stepDots}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    i <= step
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.3)",
                  width: i === step ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Datos del beneficiario
            </Text>
            <Field label="Nombre completo" value={form.name} onChangeText={(v) => set("name", v)} colors={colors} />
            <Field label="Fecha de nacimiento" value={form.birthDate} onChangeText={(v) => set("birthDate", v)} placeholder="DD/MM/AAAA" colors={colors} />
            <Field label="CURP" value={form.curp} onChangeText={(v) => set("curp", v.toUpperCase())} placeholder="18 caracteres" colors={colors} />
            <View style={fieldStyles.group}>
              <Text style={[fieldStyles.label, { color: colors.foreground }]}>Género</Text>
              <SelectChips options={["Masculino", "Femenino", "No especificado"]} value={form.gender} onSelect={(v) => set("gender", v)} colors={colors} />
            </View>
            <View style={fieldStyles.group}>
              <Text style={[fieldStyles.label, { color: colors.foreground }]}>Municipio</Text>
              <SelectChips options={MUNICIPALITIES.slice(0, 4)} value={form.municipality} onSelect={(v) => set("municipality", v)} colors={colors} />
              <SelectChips options={MUNICIPALITIES.slice(4)} value={form.municipality} onSelect={(v) => set("municipality", v)} colors={colors} />
            </View>
            <View style={fieldStyles.group}>
              <Text style={[fieldStyles.label, { color: colors.foreground }]}>Zona</Text>
              <SelectChips options={ZONES} value={form.zone} onSelect={(v) => set("zone", v)} colors={colors} />
            </View>
            <Field label="Dirección" value={form.address} onChangeText={(v) => set("address", v)} colors={colors} />
            <Field label="Escuela o institución" value={form.school} onChangeText={(v) => set("school", v)} colors={colors} />
            <Field label="Grado escolar" value={form.gradeLevel} onChangeText={(v) => set("gradeLevel", v)} colors={colors} />
            <View style={fieldStyles.group}>
              <Text style={[fieldStyles.label, { color: colors.foreground }]}>Tipo de discapacidad</Text>
              <SelectChips options={DISABILITY_TYPES} value={form.disabilityType} onSelect={(v) => set("disabilityType", v)} colors={colors} />
            </View>
            <Field label="Diagnóstico o condición" value={form.diagnosis} onChangeText={(v) => set("diagnosis", v)} multiline colors={colors} />
            <Field label="Necesidades principales" value={form.needs} onChangeText={(v) => set("needs", v)} multiline colors={colors} />
            <Field label="Observaciones" value={form.observations} onChangeText={(v) => set("observations", v)} multiline colors={colors} />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Datos del tutor</Text>
            <Field label="Nombre completo del tutor" value={form.tutorName} onChangeText={(v) => set("tutorName", v)} colors={colors} />
            <View style={fieldStyles.group}>
              <Text style={[fieldStyles.label, { color: colors.foreground }]}>Parentesco</Text>
              <SelectChips options={["Madre", "Padre", "Abuelo/a", "Tío/a", "Hermano/a", "Tutor legal"]} value={form.relationship} onSelect={(v) => set("relationship", v)} colors={colors} />
            </View>
            <Field label="Teléfono" value={form.tutorPhone} onChangeText={(v) => set("tutorPhone", v)} keyboardType="phone-pad" colors={colors} />
            <Field label="Correo electrónico" value={form.tutorEmail} onChangeText={(v) => set("tutorEmail", v)} keyboardType="email-address" colors={colors} />
            <Field label="Dirección del tutor" value={form.tutorAddress} onChangeText={(v) => set("tutorAddress", v)} colors={colors} />
            <Field label="Ocupación" value={form.occupation} onChangeText={(v) => set("occupation", v)} colors={colors} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Información médica</Text>
            <Field label="Diagnóstico principal" value={form.primaryDiagnosis} onChangeText={(v) => set("primaryDiagnosis", v)} multiline colors={colors} />
            <Field label="Médico tratante" value={form.treatingDoctor} onChangeText={(v) => set("treatingDoctor", v)} colors={colors} />
            <Field label="Hospital o clínica" value={form.hospital} onChangeText={(v) => set("hospital", v)} colors={colors} />
            <Field label="Especialidad médica" value={form.treatingSpecialty} onChangeText={(v) => set("treatingSpecialty", v)} colors={colors} />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Apoyo solicitado</Text>
            <View style={fieldStyles.group}>
              <Text style={[fieldStyles.label, { color: colors.foreground }]}>Tipo de apoyo</Text>
              <SelectChips options={SUPPORT_TYPES} value={form.supportType} onSelect={(v) => set("supportType", v)} colors={colors} />
            </View>
            <Field label="Motivo de solicitud" value={form.supportReason} onChangeText={(v) => set("supportReason", v)} multiline colors={colors} />
            <Field label="Comentarios adicionales" value={form.additionalComments} onChangeText={(v) => set("additionalComments", v)} multiline colors={colors} />
          </>
        )}

        {step === 4 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documentos</Text>
            <Text style={[styles.docNote, { color: colors.mutedForeground }]}>
              Sube los documentos requeridos para completar el expediente. Podrás subir documentos desde la pantalla de expediente después de enviar la solicitud.
            </Text>
            {[
              "Acta de nacimiento",
              "CURP",
              "Comprobante de domicilio",
              "Identificación oficial del tutor",
              "Diagnóstico médico",
              "Comprobante escolar",
              "Fotografía del beneficiario",
              "Carta de solicitud",
            ].map((doc) => (
              <View
                key={doc}
                style={[styles.docItem, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <View style={[styles.docIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="file" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.docName, { color: colors.foreground }]}>{doc}</Text>
                <View style={[styles.docPending, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.docPendingText, { color: "#92400E" }]}>Pendiente</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {step === 5 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Confirmación</Text>
            <Text style={[styles.confirmNote, { color: colors.mutedForeground }]}>
              Revisa los datos antes de enviar. Una vez enviada, la solicitud será revisada por el equipo de la fundación.
            </Text>
            {[
              { label: "Nombre del beneficiario", value: form.name || "No especificado" },
              { label: "CURP", value: form.curp || "No especificado" },
              { label: "Municipio", value: form.municipality || "No especificado" },
              { label: "Tipo de discapacidad", value: form.disabilityType || "No especificado" },
              { label: "Tutor", value: form.tutorName || "No especificado" },
              { label: "Apoyo solicitado", value: form.supportType || "No especificado" },
            ].map((item) => (
              <View key={item.label} style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.confirmLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                <Text style={[styles.confirmValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
          },
        ]}
      >
        {step > 0 && (
          <Pressable
            style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.muted }]}
            onPress={handleBack}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
            <Text style={[styles.backButtonText, { color: colors.foreground }]}>Atrás</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.nextButton, { backgroundColor: colors.primary, flex: step > 0 ? 1 : undefined, width: step === 0 ? "100%" : undefined }]}
          onPress={step === STEPS.length - 1 ? handleSubmit : handleNext}
        >
          <Text style={styles.nextButtonText}>
            {step === STEPS.length - 1 ? "Enviar solicitud" : "Siguiente"}
          </Text>
          {step < STEPS.length - 1 && (
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 6,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    marginTop: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  stepDots: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    alignItems: "center",
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  docNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  docName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  docPending: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  docPendingText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  confirmNote: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  confirmRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 4,
  },
  confirmLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  confirmValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bottomNav: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
  },
  backButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  successSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  folioCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  folioLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  folioValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  folioNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  successNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  newButton: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  newButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
