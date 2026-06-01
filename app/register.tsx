import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons"; // <-- Agregado para el icono del checkbox
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const PRIVACY_POLICY_URL = "https://bronze-homegrown-706.notion.site/Pol-ticas-de-Privacidad-Aplicaci-n-M-vil-Gallos-Smiling-36f621fdb42180088314d92c2fd39541";

export default function Register() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  // <-- NUEVO: Estado para el Checkbox de privacidad
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = async () => {
    // <-- NUEVO: Validación del checkbox de privacidad
    if (!acceptedTerms) {
      Alert.alert("Aviso de Privacidad", "Debes leer y aceptar el aviso de privacidad para poder registrarte.");
      return;
    }

    if (!name || !email || !password) {
      Alert.alert("Campos incompletos", "Por favor llena los campos obligatorios.");
      return;
    }

    try {
      setLoading(true);

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // 2. Insertar perfil en la tabla 'users' pública con rol predeterminado 'tutor'
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          name: name,
          email: email.toLowerCase().trim(),
          phone: phone || null,
          role: "tutor", // Todos los registros públicos se guardan por defecto como tutor
        });

        if (profileError) throw profileError;

        Alert.alert(
          "¡Registro exitoso!",
          "Tu cuenta ha sido creada. Ya puedes iniciar sesión.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );
      }
    } catch (error: any) {
      Alert.alert("Error de registro", error.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Crear Cuenta</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Únete a la comunidad de Gallos Smiling
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.foreground }]}>Nombre Completo *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="Juan Pérez"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Correo Electrónico *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="ejemplo@correo.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Teléfono (Opcional)</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="4421234567"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Contraseña *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          {/* <-- NUEVO: Checkbox de Aviso de Privacidad --> */}
          <Pressable 
            style={styles.checkboxContainer} 
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: acceptedTerms ? colors.primary : "transparent" }]}>
              {acceptedTerms && <Feather name="check" size={14} color="#FFF" />}
            </View>
            <Text style={[styles.checkboxText, { color: colors.foreground }]}>
              He leído y acepto el{" "}
              <Text 
                style={[styles.linkText, { color: colors.primary }]}
                onPress={(e) => {
                  e.stopPropagation(); // Evita que se marque el checkbox al tocar el enlace
                  Linking.openURL(PRIVACY_POLICY_URL);
                }}
              >
                Aviso de Privacidad
              </Text>
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Registrarse</Text>}
          </Pressable>

          <View style={styles.footerLink}>
            <Text style={{ color: colors.mutedForeground }}>¿Ya tienes cuenta? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={[styles.linkText, { color: colors.primary }]}>Inicia sesión</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, justifyContent: "center", flexGrow: 1 },
  header: { marginBottom: 32, alignItems: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center", marginTop: 8 },
  form: { gap: 16 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  
  // Estilos agregados para el Checkbox
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 4 },
  checkbox: { width: 22, height: 22, borderWidth: 1, borderRadius: 6, justifyContent: "center", alignItems: "center", marginRight: 10 },
  checkboxText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  
  button: { height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 8 },
  buttonText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  footerLink: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  linkText: { fontFamily: "Inter_700Bold", textDecorationLine: "underline" },
});