import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/context/AuthContext"; // Importamos el contexto

export default function Login() {
  const colors = useColors();
  const { signInAsGuest } = useAuth(); // Extraemos la función para invitados
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Campos vacíos", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (authData?.user) {
        // Consultar el rol usando maybeSingle() para evitar crasheos si el RLS bloquea o no hay perfil
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        // Validar si el rol requiere panel de administración o flujos normales
        const rolesAdmin = ["admin", "capturista", "validador", "comunicacion"];
        
        if (profile?.role && rolesAdmin.includes(profile.role)) {
          router.replace("/admin");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (error: any) {
      Alert.alert("Error de acceso", error.message || "Credenciales incorrectas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Iniciar Sesión</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Bienvenido de vuelta a Gallos Smiling
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.foreground }]}>Correo Electrónico</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="ejemplo@correo.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Contraseña</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Entrar</Text>}
          </Pressable>

          {/* NUEVO BOTÓN: Entrar como visitante */}
          <Pressable
            style={[styles.guestButton, { borderColor: colors.primary }]}
            onPress={signInAsGuest}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.primary }]}>Entrar como visitante</Text>
          </Pressable>

          <View style={styles.footerLink}>
            <Text style={{ color: colors.mutedForeground }}>¿No tienes una cuenta? </Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={[styles.linkText, { color: colors.primary }]}>Regístrate aquí</Text>
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
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center", marginTop: 8 },
  form: { gap: 16 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  button: { height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 12 },
  guestButton: { height: 52, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, marginTop: 4 },
  buttonText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  footerLink: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  linkText: { fontFamily: "Inter_700Bold" },
});