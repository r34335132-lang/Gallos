import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PublicScaffold } from "@/components/PublicScaffold";
import { useColors } from "@/hooks/useColors";
import { DEFAULT_SITE_SETTINGS, loadSettings, type SiteSettings } from "@/lib/publicContent";
import { supabase } from "@/lib/supabase";

export default function ContactScreen() {
  const colors = useColors();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => {});
  }, []);

  const submit = async () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert("Campos requeridos", "Escribe tu nombre y mensaje.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      message: message.trim(),
      status: "nuevo",
    });
    setSaving(false);
    if (error) {
      Alert.alert("Mensaje listo", "No se pudo guardar en base de datos, pero puedes contactarnos por WhatsApp o correo.");
      return;
    }
    setName("");
    setPhone("");
    setEmail("");
    setMessage("");
    Alert.alert("Gracias", "Recibimos tu mensaje.");
  };

  return (
    <PublicScaffold title="Contacto" subtitle="Escribenos para informacion, apoyo, voluntariado o patrocinios.">
      <View style={styles.grid}>
        <View style={[styles.form, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Field label="Nombre" value={name} onChangeText={setName} placeholder="Tu nombre" />
          <Field label="Telefono" value={phone} onChangeText={setPhone} placeholder="Opcional" keyboardType="phone-pad" />
          <Field label="Correo" value={email} onChangeText={setEmail} placeholder="Opcional" keyboardType="email-address" />
          <Field label="Mensaje" value={message} onChangeText={setMessage} placeholder="Como podemos ayudarte?" multiline />
          <Pressable style={[styles.submit, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]} onPress={submit} disabled={saving}>
            <Text style={styles.submitText}>{saving ? "Enviando..." : "Enviar mensaje"}</Text>
          </Pressable>
        </View>

        <View style={styles.side}>
          <ContactAction icon="message-circle" title="WhatsApp" text="Respuesta rapida" onPress={() => Linking.openURL(settings.whatsappUrl)} />
          <ContactAction icon="phone" title="Telefono" text={settings.phone} onPress={() => Linking.openURL(`tel:${settings.phone}`)} />
          <ContactAction icon="mail" title="Correo" text={settings.email} onPress={() => Linking.openURL(`mailto:${settings.email}`)} />
          <View style={[styles.info, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Zona de atencion</Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{settings.serviceArea}</Text>
          </View>
        </View>
      </View>
    </PublicScaffold>
  );
}

function Field(props: any) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{props.label}</Text>
      <TextInput
        {...props}
        style={[props.multiline ? styles.area : styles.input, { borderColor: colors.border, color: colors.foreground }]}
        placeholderTextColor={colors.mutedForeground}
        textAlignVertical={props.multiline ? "top" : "center"}
      />
    </View>
  );
}

function ContactAction({ icon, title, text, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; text: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable style={[styles.action, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: colors.primary + "12" }]}><Feather name={icon} size={20} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.actionText, { color: colors.mutedForeground }]}>{text}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  form: { flex: 2, minWidth: 300, borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  side: { flex: 1, minWidth: 280, gap: 12 },
  field: { gap: 7 },
  label: { fontSize: 13, fontFamily: "Inter_700Bold" },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: "Inter_400Regular" },
  area: { minHeight: 130, borderWidth: 1, borderRadius: 12, padding: 14, fontFamily: "Inter_400Regular" },
  submit: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  submitText: { color: "#fff", fontFamily: "Inter_700Bold" },
  action: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  actionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  actionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  info: { borderRadius: 16, padding: 16, gap: 6 },
  infoTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  infoText: { fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
});
