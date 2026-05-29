import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

import {
  CONSENT_DOCUMENTS,
  DISABILITY_TYPES,
  isAdminRole,
  MUNICIPALITIES,
  REQUIRED_DOC_TYPES,
  SUPPORT_TYPES,
  ZONES,
} from "@/lib/appData";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const STEPS = [
  "Beneficiario",
  "Tutor",
  "Médico",
  "Apoyo",
  "Documentos",
  "Confirmar",
];

const REQUIRED_DOCS = REQUIRED_DOC_TYPES;

type FormDataType = {
  name: string; birthDate: string; curp: string; gender: string; municipality: string;
  zone: string; address: string; school: string; gradeLevel: string; disabilityType: string;
  diagnosis: string; needs: string; observations: string;
  tutorName: string; relationship: string; tutorPhone: string; tutorEmail: string;
  tutorAddress: string; occupation: string; emergencyPhone: string;
  primaryDiagnosis: string; treatingDoctor: string; hospital: string; treatingSpecialty: string;
  bloodType: string; allergies: string;
  supportType: string; supportReason: string; additionalComments: string;
  shirtSize: string; shoeSize: string;
};

const INITIAL: FormDataType = {
  name: "", birthDate: "", curp: "", gender: "", municipality: "", zone: "", address: "", school: "", gradeLevel: "", disabilityType: "", diagnosis: "", needs: "", observations: "",
  tutorName: "", relationship: "", tutorPhone: "", tutorEmail: "", tutorAddress: "", occupation: "", emergencyPhone: "",
  primaryDiagnosis: "", treatingDoctor: "", hospital: "", treatingSpecialty: "", bloodType: "", allergies: "",
  supportType: "", supportReason: "", additionalComments: "", shirtSize: "", shoeSize: "",
};

function SelectChips({ options, value, onSelect, colors }: any) {
  return (
    <View style={selectStyles.wrap}>
      {options.map((opt: string) => (
        <Pressable
          key={opt}
          style={[
            selectStyles.chip,
            { backgroundColor: value === opt ? colors.primary : colors.muted, borderColor: value === opt ? colors.primary : colors.border },
          ]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[selectStyles.chipText, { color: value === opt ? "#FFFFFF" : colors.mutedForeground }]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const selectStyles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, colors, maxLength }: any) {
  return (
    <View style={fieldStyles.group}>
      <Text style={[fieldStyles.label, { color: colors.foreground }]}>{label} *</Text>
      <TextInput
        style={[
          fieldStyles.input,
          { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground },
          multiline && fieldStyles.multiline,
        ]}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        maxLength={maxLength}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 48 },
  multiline: { minHeight: 80 },
});

export default function RegistrarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const isInternalUser = isAdminRole(profile?.role);
  const canRegisterBeneficiary = !profile || profile.role === "tutor" || profile.role === "admin" || profile.role === "capturista";
  const tabBarHeight = Platform.OS === "web" ? 84 : 80;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormDataType>(INITIAL);
  const [docs, setDocs] = useState<Record<string, { uri: string, name: string, type: string }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBeneficiaryId, setSubmittedBeneficiaryId] = useState<string | null>(null);
  const [uploadingConsent, setUploadingConsent] = useState<string | null>(null);
  
  const [folio, setFolio] = useState("GS-2026-" + Math.floor(Math.random() * 9000 + 1000).toString());

  const set = (field: keyof FormDataType, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleDateChange = (text: string) => {
    if (text.length < form.birthDate.length) {
      set("birthDate", text);
      return;
    }
    let cleaned = text.replace(/\D/g, ''); 
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length >= 4) {
      formatted = formatted.substring(0, 5) + '/' + cleaned.substring(4, 8);
    }
    set("birthDate", formatted);
  };

  const pickDocument = async (docName: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setDocs(prev => ({
          ...prev,
          [docName]: { uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" }
        }));
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar el documento.");
    }
  };

  const uploadDocToStorage = async (fileUri: string, fileNameOriginal: string): Promise<string | null> => {
    try {
      const fileExt = fileNameOriginal.split(".").pop() || "pdf";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `expedientes/${folio}/${fileName}`; 

      const formData = new FormData();
      formData.append("file", { uri: fileUri, name: fileName, type: `application/${fileExt}` } as any);

      const { error: uploadError } = await supabase.storage.from("img").upload(filePath, formData);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("img").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error al subir archivo:", error);
      return null;
    }
  };

  // VALIDACIÓN INTELIGENTE (Te redirige a donde falta el dato)
  const validateStep = (currentStep: number) => {
    let isValid = true;
    let errorMsg = "";

    if (currentStep === 0) {
      if (!form.name || !form.birthDate || !form.curp || !form.gender || !form.municipality || !form.zone || !form.address || !form.school || !form.gradeLevel || !form.disabilityType || !form.diagnosis || !form.needs || !form.observations) {
        errorMsg = "Debes llenar todos los datos del Beneficiario para avanzar.";
        isValid = false;
      } else if (form.curp.length !== 18) {
        errorMsg = "La CURP debe tener exactamente 18 caracteres.";
        isValid = false;
      } else if (form.birthDate.length !== 10) {
        errorMsg = "La fecha de nacimiento debe estar en formato DD/MM/AAAA.";
        isValid = false;
      }
    } else if (currentStep === 1) {
      if (!form.tutorName || !form.relationship || !form.tutorPhone || !form.emergencyPhone || !form.tutorEmail || !form.tutorAddress || !form.occupation) {
        errorMsg = "Debes llenar todos los datos del Tutor para avanzar.";
        isValid = false;
      }
    } else if (currentStep === 2) {
      if (!form.bloodType || !form.allergies || !form.primaryDiagnosis || !form.treatingDoctor || !form.hospital || !form.treatingSpecialty) {
        errorMsg = "Debes llenar toda la información médica para avanzar.";
        isValid = false;
      }
    } else if (currentStep === 3) {
      if (!form.shirtSize || !form.shoeSize || !form.supportType || !form.supportReason || !form.additionalComments) {
        errorMsg = "Debes llenar toda la información de logística y apoyo.";
        isValid = false;
      }
    } else if (currentStep === 4) {
      const missingDocs = REQUIRED_DOCS.filter(doc => !docs[doc]);
      if (missingDocs.length > 0) {
        errorMsg = `Es obligatorio subir todos los documentos.\nFaltan:\n- ${missingDocs.join("\n- ")}`;
        isValid = false;
      }
    }

    if (!isValid) {
      Alert.alert("Datos faltantes", errorMsg);
    }
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    // Validamos todo de nuevo por seguridad
    for (let i = 0; i <= 4; i++) {
      if (!validateStep(i)) {
        setStep(i); // Te regresa al paso exacto donde falta algo
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let formattedDate = new Date().toISOString().split('T')[0];
      let age = null;
      if (form.birthDate && form.birthDate.includes("/")) {
        const parts = form.birthDate.split("/");
        if (parts.length === 3) {
          formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          const dob = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          const diffMs = Date.now() - dob.getTime();
          age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
        }
      }

      const compiledNotes = `
--- DATOS DE TUTOR ---
Parentesco: ${form.relationship}
Teléfono: ${form.tutorPhone}
Email: ${form.tutorEmail}
Dirección: ${form.tutorAddress}
Ocupación: ${form.occupation}

--- DATOS MÉDICOS EXTRAS ---
Especialidad/Hospital: ${form.treatingSpecialty} en ${form.hospital}
Médico Tratante: ${form.treatingDoctor}
Diag. Principal: ${form.primaryDiagnosis}

--- MOTIVO DE APOYO ---
Razón: ${form.supportReason}
Adicionales: ${form.additionalComments}

--- OBSERVACIONES DEL EXPEDIENTE ---
${form.observations}
      `.trim();

      let linkedTutorId: string | null = profile?.role === "tutor" ? profile.id : null;

      if (isInternalUser && form.tutorEmail) {
        const { data: tutorProfile } = await supabase
          .from("users")
          .select("id")
          .eq("email", form.tutorEmail.trim().toLowerCase())
          .eq("role", "tutor")
          .maybeSingle();

        linkedTutorId = tutorProfile?.id ?? null;
      }

      const payload = {
        folio: folio,
        name: form.name,
        birth_date: formattedDate,
        age: age,
        curp: form.curp,
        gender: form.gender,
        municipality: form.municipality,
        zone: form.zone,
        address: form.address,
        school: form.school,
        grade_level: form.gradeLevel,
        disability_type: form.disabilityType,
        diagnosis: form.diagnosis,
        needs: form.needs,
        status: "pendiente",
        
        tutor_id: linkedTutorId, 
        tutor_name: form.tutorName || profile?.name || "Sin especificar",
        
        blood_type: form.bloodType,
        allergies: form.allergies,
        emergency_phone: form.emergencyPhone,
        shirt_size: form.shirtSize,
        shoe_size: form.shoeSize,
        support_type: form.supportType,
        notes: compiledNotes,
      };

      const { data: newBen, error: benError } = await supabase.from("beneficiaries").insert(payload).select().single();
      
      // Control de error específico de CURP duplicada
      if (benError) {
        if (benError.code === '23505' || benError.message.includes('curp')) {
          throw new Error("Esta CURP ya se encuentra registrada en el sistema. Modifícala o revisa los expedientes existentes.");
        }
        throw benError;
      }

      const docEntries = Object.entries(docs);
      if (docEntries.length > 0 && newBen?.id) {
        for (const [docName, fileData] of docEntries) {
          const publicUrl = await uploadDocToStorage(fileData.uri, fileData.name);
          if (publicUrl) {
            await supabase.from("documents").insert({
              beneficiary_id: newBen.id,
              name: docName,
              document_type: docName,
              status: "pendiente",
              admin_comment: publicUrl
            });
          }
        }
      }

      if (newBen?.id) {
        const { error: consentError } = await supabase.from("documents").insert(
          CONSENT_DOCUMENTS.map((doc) => ({
            beneficiary_id: newBen.id,
            name: doc.name,
            document_type: doc.type,
            status: "pendiente",
            admin_comment: null,
          }))
        );
        if (consentError) console.error("Error al crear permisos de firma:", consentError);
        setSubmittedBeneficiaryId(newBen.id);
      }

      setSubmitted(true);
    } catch (error: any) {
      console.error(error);
      if (!error) error = {};
      Alert.alert("No se pudo registrar", error.message || "Revisa tu conexión o intenta nuevamente.");
      // Si fue error de CURP, regresamos al paso 0 para que la corrijan
      if ((error.message || "").includes("CURP")) {
        setStep(0);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSignedConsent = async (docType: string, docName: string) => {
    if (!submittedBeneficiaryId) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setUploadingConsent(docType);
      const publicUrl = await uploadDocToStorage(file.uri, file.name);
      if (!publicUrl) throw new Error("No se pudo subir el archivo firmado.");

      const { error } = await supabase
        .from("documents")
        .update({
          admin_comment: publicUrl,
          status: "pendiente",
          upload_date: new Date().toISOString().split("T")[0],
        })
        .eq("beneficiary_id", submittedBeneficiaryId)
        .eq("document_type", docType);

      if (error) throw error;
      Alert.alert("Archivo recibido", `${docName} se subió correctamente.`);
    } catch (error: any) {
      Alert.alert("No se pudo subir", error.message || "Intenta nuevamente.");
    } finally {
      setUploadingConsent(null);
    }
  };

  const handleReset = () => {
    setForm(INITIAL);
    setDocs({});
    setStep(0);
    setFolio("GS-2026-" + Math.floor(Math.random() * 9000 + 1000).toString());
    setSubmittedBeneficiaryId(null);
    setSubmitted(false);
  };

  if (!canRegisterBeneficiary) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.warning + "15" }]}>
          <Feather name="lock" size={42} color={colors.warning} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Sin permiso de captura</Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Tu rol puede consultar su panel, pero no registrar beneficiarios.
        </Text>
        <Pressable style={[styles.newButton, { backgroundColor: colors.primary }]} onPress={() => router.replace("/admin")}>
          <Text style={styles.newButtonText}>Volver al panel</Text>
        </Pressable>
      </View>
    );
  }

  if (submitted) {
    return (
      <KeyboardAwareScrollViewCompat
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.successContainer, { paddingTop: insets.top + 40, paddingBottom: tabBarHeight + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.successIcon, { backgroundColor: colors.success + "15" }]}>
          <Feather name="check-circle" size={56} color={colors.success} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Solicitud enviada</Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Tu solicitud ha sido registrada exitosamente.</Text>
        <View style={[styles.folioCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.folioLabel, { color: colors.mutedForeground }]}>Número de folio</Text>
          <Text style={[styles.folioValue, { color: colors.primary }]}>{folio}</Text>
          <Text style={[styles.folioNote, { color: colors.mutedForeground }]}>Guarda este folio para dar seguimiento a tu expediente.</Text>
        </View>
        <View style={[styles.consentSection, { borderColor: colors.border }]}>
          <Text style={[styles.consentTitle, { color: colors.foreground }]}>Archivos para firma</Text>
          <Text style={[styles.consentIntro, { color: colors.mutedForeground }]}>
            Firma estos permisos y súbelos para completar el expediente.
          </Text>
          {CONSENT_DOCUMENTS.map((doc) => (
            <View key={doc.type} style={[styles.consentCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={[styles.consentIcon, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="file-text" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.consentName, { color: colors.foreground }]}>{doc.shortName}</Text>
                <Text style={[styles.consentDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {doc.description}
                </Text>
              </View>
              <View style={styles.consentActions}>
                <Pressable
                  style={[styles.consentActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() =>
                    router.push({
                      pathname: "/consentimiento/[type]",
                      params: { type: doc.type, beneficiaryId: submittedBeneficiaryId ?? "", folio },
                    } as any)
                  }
                >
                  <Feather name="eye" size={14} color={colors.foreground} />
                </Pressable>
                <Pressable
                  style={[styles.consentActionBtn, { backgroundColor: colors.primary, opacity: uploadingConsent === doc.type ? 0.7 : 1 }]}
                  onPress={() => handleUploadSignedConsent(doc.type, doc.name)}
                  disabled={uploadingConsent === doc.type}
                >
                  {uploadingConsent === doc.type ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="upload" size={14} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={[styles.newButton, { backgroundColor: colors.primary }]} onPress={handleReset}>
          <Text style={styles.newButtonText}>Registrar otro beneficiario</Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Fijo */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Text style={styles.headerTitle}>Registrar beneficiario</Text>
        <Text style={styles.headerSub}>Paso {step + 1} de {STEPS.length}: {STEPS[step]}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
        </View>
        <View style={styles.stepDots}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.stepDot, { backgroundColor: i <= step ? "#FFFFFF" : "rgba(255,255,255,0.3)", width: i === step ? 20 : 8 }]} />
          ))}
        </View>
      </View>

      <KeyboardAwareScrollViewCompat 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + tabBarHeight + 20 }} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          {step === 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Datos Personales</Text>
              <Field label="Nombre completo" value={form.name} onChangeText={(v:any) => set("name", v)} colors={colors} />
              <Field label="Fecha de nacimiento" value={form.birthDate} onChangeText={handleDateChange} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} colors={colors} />
              <Field label="CURP" value={form.curp} onChangeText={(v:any) => set("curp", v.toUpperCase())} placeholder="18 caracteres" maxLength={18} colors={colors} />
              
              <View style={fieldStyles.group}>
                <Text style={[fieldStyles.label, { color: colors.foreground }]}>Género *</Text>
                <SelectChips options={["Masculino", "Femenino", "No especificado"]} value={form.gender} onSelect={(v:any) => set("gender", v)} colors={colors} />
              </View>
              <View style={fieldStyles.group}>
                <Text style={[fieldStyles.label, { color: colors.foreground }]}>Municipio *</Text>
                <SelectChips options={MUNICIPALITIES.slice(0, 4)} value={form.municipality} onSelect={(v:any) => set("municipality", v)} colors={colors} />
                <SelectChips options={MUNICIPALITIES.slice(4)} value={form.municipality} onSelect={(v:any) => set("municipality", v)} colors={colors} />
              </View>
              <View style={fieldStyles.group}>
                <Text style={[fieldStyles.label, { color: colors.foreground }]}>Zona *</Text>
                <SelectChips options={ZONES} value={form.zone} onSelect={(v:any) => set("zone", v)} colors={colors} />
              </View>

              <Field label="Dirección" value={form.address} onChangeText={(v:any) => set("address", v)} colors={colors} />
              <Field label="Escuela o institución" value={form.school} onChangeText={(v:any) => set("school", v)} colors={colors} />
              <Field label="Grado escolar" value={form.gradeLevel} onChangeText={(v:any) => set("gradeLevel", v)} colors={colors} />
              
              <View style={fieldStyles.group}>
                <Text style={[fieldStyles.label, { color: colors.foreground }]}>Tipo de discapacidad *</Text>
                <SelectChips options={DISABILITY_TYPES} value={form.disabilityType} onSelect={(v:any) => set("disabilityType", v)} colors={colors} />
              </View>

              <Field label="Diagnóstico o condición" value={form.diagnosis} onChangeText={(v:any) => set("diagnosis", v)} multiline colors={colors} />
              <Field label="Necesidades principales" value={form.needs} onChangeText={(v:any) => set("needs", v)} multiline colors={colors} />
              <Field label="Observaciones" value={form.observations} onChangeText={(v:any) => set("observations", v)} multiline colors={colors} />
            </>
          )}

          {step === 1 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Datos del Tutor</Text>
              <Field label="Nombre completo del tutor" value={form.tutorName} onChangeText={(v:any) => set("tutorName", v)} colors={colors} />
              <View style={fieldStyles.group}>
                <Text style={[fieldStyles.label, { color: colors.foreground }]}>Parentesco *</Text>
                <SelectChips options={["Madre", "Padre", "Abuelo/a", "Tío/a", "Hermano/a", "Tutor legal"]} value={form.relationship} onSelect={(v:any) => set("relationship", v)} colors={colors} />
              </View>
              <Field label="Teléfono" value={form.tutorPhone} onChangeText={(v:any) => set("tutorPhone", v)} keyboardType="phone-pad" colors={colors} />
              <Field label="Teléfono de Emergencia" value={form.emergencyPhone} onChangeText={(v:any) => set("emergencyPhone", v)} keyboardType="phone-pad" colors={colors} />
              <Field label="Correo electrónico" value={form.tutorEmail} onChangeText={(v:any) => set("tutorEmail", v)} keyboardType="email-address" colors={colors} />
              <Field label="Dirección del tutor" value={form.tutorAddress} onChangeText={(v:any) => set("tutorAddress", v)} colors={colors} />
              <Field label="Ocupación" value={form.occupation} onChangeText={(v:any) => set("occupation", v)} colors={colors} />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Información Médica</Text>
              <Field label="Tipo de Sangre" value={form.bloodType} onChangeText={(v:any) => set("bloodType", v)} placeholder="Ej. O+" colors={colors} />
              <Field label="Alergias (Alimentos/Medicamentos)" value={form.allergies} onChangeText={(v:any) => set("allergies", v)} colors={colors} />
              <Field label="Diagnóstico principal" value={form.primaryDiagnosis} onChangeText={(v:any) => set("primaryDiagnosis", v)} multiline colors={colors} />
              <Field label="Médico tratante" value={form.treatingDoctor} onChangeText={(v:any) => set("treatingDoctor", v)} colors={colors} />
              <Field label="Hospital o clínica" value={form.hospital} onChangeText={(v:any) => set("hospital", v)} colors={colors} />
              <Field label="Especialidad médica" value={form.treatingSpecialty} onChangeText={(v:any) => set("treatingSpecialty", v)} colors={colors} />
            </>
          )}

          {step === 3 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Logística y Apoyo</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Talla Playera" value={form.shirtSize} onChangeText={(v:any) => set("shirtSize", v)} placeholder="S, M, L..." colors={colors} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Talla Calzado" value={form.shoeSize} onChangeText={(v:any) => set("shoeSize", v)} placeholder="Ej. 24" colors={colors} />
                </View>
              </View>
              <View style={[fieldStyles.group, { marginTop: 10 }]}>
                <Text style={[fieldStyles.label, { color: colors.foreground }]}>Tipo de apoyo *</Text>
                <SelectChips options={SUPPORT_TYPES} value={form.supportType} onSelect={(v:any) => set("supportType", v)} colors={colors} />
              </View>
              <Field label="Motivo de solicitud" value={form.supportReason} onChangeText={(v:any) => set("supportReason", v)} multiline colors={colors} />
              <Field label="Comentarios adicionales" value={form.additionalComments} onChangeText={(v:any) => set("additionalComments", v)} multiline colors={colors} />
            </>
          )}

          {step === 4 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Documentos</Text>
              <Text style={[styles.docNote, { color: colors.mutedForeground, marginBottom: 10 }]}>
                Sube una foto o PDF de los siguientes documentos. Todos son obligatorios.
              </Text>
              
              {REQUIRED_DOCS.map((doc) => {
                const hasFile = !!docs[doc];
                return (
                  <View key={doc} style={[styles.docItem, { backgroundColor: colors.muted, borderColor: hasFile ? colors.primary : colors.border }]}>
                    <View style={[styles.docIcon, { backgroundColor: hasFile ? colors.primary + "15" : colors.background }]}>
                      <Feather name={hasFile ? "check-circle" : "file"} size={18} color={hasFile ? colors.primary : colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.docName, { color: hasFile ? colors.foreground : colors.mutedForeground }]}>{doc} *</Text>
                      {hasFile && <Text style={{ fontSize: 11, color: colors.primary }} numberOfLines={1}>{docs[doc].name}</Text>}
                    </View>
                    <Pressable
                      style={[styles.uploadBtn, { backgroundColor: hasFile ? colors.background : colors.primary }]}
                      onPress={() => pickDocument(doc)}
                    >
                      <Text style={{ color: hasFile ? colors.foreground : "#FFF", fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
                        {hasFile ? "Cambiar" : "Subir"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </>
          )}

          {step === 5 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Confirmación</Text>
              <Text style={[styles.confirmNote, { color: colors.mutedForeground }]}>
                Revisa los datos antes de enviar.
              </Text>
              {[
                { label: "Nombre del beneficiario", value: form.name || "No especificado" },
                { label: "CURP", value: form.curp || "No especificado" },
                { label: "Documentos listos", value: `${Object.keys(docs).length} / ${REQUIRED_DOCS.length}` },
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
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.bottomNav}>
          {step > 0 && (
            <Pressable style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.muted }]} onPress={handleBack} disabled={isSubmitting}>
              <Feather name="arrow-left" size={18} color={colors.foreground} />
            </Pressable>
          )}
          <Pressable
            style={[styles.nextButton, { backgroundColor: colors.primary, flex: 1, opacity: isSubmitting ? 0.7 : 1 }]}
            onPress={step === STEPS.length - 1 ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : (
              <>
                <Text style={styles.nextButtonText}>{step === STEPS.length - 1 ? "Enviar solicitud" : "Siguiente"}</Text>
                {step < STEPS.length - 1 && <Feather name="arrow-right" size={18} color="#FFFFFF" />}
              </>
            )}
          </Pressable>
        </View>

      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  headerTitle: { color: "#FFFFFF", fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, marginTop: 8 },
  progressFill: { height: 4, backgroundColor: "#FFFFFF", borderRadius: 2 },
  stepDots: { flexDirection: "row", gap: 4, marginTop: 6, alignItems: "center" },
  stepDot: { height: 8, borderRadius: 4 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  docNote: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  docItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  docIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  docName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  uploadBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  confirmNote: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  confirmRow: { paddingVertical: 12, borderBottomWidth: 1, gap: 4 },
  confirmLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  confirmValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bottomNav: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 30 },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, height: 52, borderRadius: 14, borderWidth: 1 },
  backButtonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  nextButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14 },
  nextButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  successContainer: { flexGrow: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 20 },
  permissionContainer: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 18 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  folioCard: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 6 },
  folioLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  folioValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  folioNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  consentSection: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  consentTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  consentIntro: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  consentCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 10 },
  consentIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  consentName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  consentDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  consentActions: { flexDirection: "row", gap: 8 },
  consentActionBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  newButton: { width: "100%", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  newButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_700Bold" },
});
