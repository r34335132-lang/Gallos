import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { createClient } from "@supabase/supabase-js";

import { StatsCard } from "@/components/StatsCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { STAFF_ROLES, type UserRole } from "@/lib/appData";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

const ADMIN_SECTIONS = [
  { icon: "user-plus" as const, label: "Registrar beneficiario", desc: "Capturar una nueva solicitud en base de datos", route: "/(tabs)/registrar", color: "#059669" },
  { icon: "folder" as const, label: "Expedientes", desc: "Gestionar expedientes y beneficiarios", route: "/(tabs)/expedientes", color: "#1A4FA8" },
  { icon: "file-text" as const, label: "Noticias Publicadas", desc: "Ver todas las noticias", route: "/(tabs)/noticias", color: "#059669" },
  { icon: "image" as const, label: "Galería Pública", desc: "Ver fotos publicadas", route: "/galeria", color: "#EC4899" },
  { icon: "award" as const, label: "Patrocinadores", desc: "Administrar patrocinadores", route: "/patrocinadores", color: "#D97706" },
  { icon: "bar-chart-2" as const, label: "Estadísticas", desc: "Ver reportes y métricas", route: "/estadisticas", color: "#7C3AED" },
];

type AdminTab = "dashboard" | "news" | "photos" | "users";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  capturista: "Capturista",
  validador: "Validador",
  comunicacion: "Comunicación",
};

const TAB_PERMISSIONS: Record<AdminTab, string[]> = {
  dashboard: ["admin", "capturista", "validador", "comunicacion"],
  news: ["admin", "comunicacion"],
  photos: ["admin", "comunicacion"],
  users: ["admin"],
};

const SECTION_PERMISSIONS: Record<string, string[]> = {
  "/(tabs)/registrar": ["admin", "capturista"],
  "/(tabs)/expedientes": ["admin", "capturista", "validador"],
  "/(tabs)/noticias": ["admin", "comunicacion"],
  "/galeria": ["admin", "comunicacion"],
  "/patrocinadores": ["admin"],
  "/estadisticas": ["admin"],
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile, signOut } = useAuth();
  const currentRole = profile?.role || "";
  const canManageUsers = profile?.role === "admin";
  const canPublishContent = currentRole === "admin" || currentRole === "comunicacion";
  
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [uploading, setUploading] = useState(false);

  const [stats, setStats] = useState({
    total_beneficiaries: 0, pending_requests: 0, 
    pending_documents: 0, active_sponsors: 0,
    approved_requests: 0, rejected_requests: 0
  });

  const [newsTitle, setNewsTitle] = useState("");
  const [newsCategory, setNewsCategory] = useState("Fundación");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsImage, setNewsImage] = useState<string | null>(null);

  const [photoTitle, setPhotoTitle] = useState("");
  const [photoDesc, setPhotoDesc] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<Exclude<UserRole, "tutor" | "patrocinador" | "visitante">>("comunicacion");

  const availableTabs = (Object.keys(TAB_PERMISSIONS) as AdminTab[]).filter((tab) =>
    TAB_PERMISSIONS[tab].includes(currentRole)
  );
  const visibleSections = ADMIN_SECTIONS.filter((item) =>
    (SECTION_PERMISSIONS[item.route] || ["admin"]).includes(currentRole)
  );

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab("dashboard");
    }
  }, [activeTab, availableTabs]);

  const loadStats = async () => {
    const { data, error } = await supabase.from("app_stats").select("*").maybeSingle();
    if (data && !error) setStats(data);
  };

  // ✅ SOLUCIÓN AL BUG: Usamos FormData, que es la forma 100% compatible con React Native
  const uploadImageToStorage = async (fileUri: string): Promise<string | null> => {
    try {
      const fileExt = fileUri.split(".").pop() || "jpeg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
      } as any);

      const { error: uploadError } = await supabase.storage
        .from("img")
        .upload(filePath, formData);

      if (uploadError) {
        console.error("❌ Error de Supabase Storage:", uploadError);
        return null;
      }

      const { data } = supabase.storage.from("img").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("❌ Error de red / React Native:", error);
      return null;
    }
  };

  const pickImage = async (type: "news" | "gallery") => {
    const isGallery = type === "gallery";
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: !isGallery, 
      allowsMultipleSelection: isGallery, 
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (type === "news") {
        setNewsImage(result.assets[0].uri);
      } else {
        const newUris = result.assets.map(a => a.uri);
        setGalleryImages(prev => [...prev, ...newUris]);
      }
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setGalleryImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handlePublishNews = async () => {
    if (!canPublishContent) {
      Alert.alert("Sin permisos", "Tu rol no puede publicar noticias.");
      return;
    }
    if (!newsTitle || !newsContent) return Alert.alert("Campos vacíos", "Completa título y contenido.");
    setUploading(true);
    let publicUrl = null;

    if (newsImage) {
      publicUrl = await uploadImageToStorage(newsImage);
      if (!publicUrl) {
        setUploading(false);
        return Alert.alert("Error", "No se pudo subir la foto de la noticia.");
      }
    }

    const { error } = await supabase.from("news").insert({
      title: newsTitle,
      category: newsCategory,
      author: "Administración Gallos",
      summary: newsSummary,
      content: newsContent,
      image_url: publicUrl,
    });

    setUploading(false);
    if (!error) {
      Alert.alert("Éxito", "Noticia publicada exitosamente.");
      setNewsTitle(""); setNewsSummary(""); setNewsContent(""); setNewsImage(null);
      setActiveTab("dashboard");
    } else {
      console.error("❌ Error al insertar noticia en BD:", error);
      Alert.alert("Error de permisos", "No se pudo guardar la noticia en la base de datos.");
    }
  };

  const handleUploadPhoto = async () => {
    if (!canPublishContent) {
      Alert.alert("Sin permisos", "Tu rol no puede subir fotos.");
      return;
    }
    if (galleryImages.length === 0) return Alert.alert("Faltan Imágenes", "Selecciona al menos una fotografía.");
    setUploading(true);

    let successCount = 0;

    for (const uri of galleryImages) {
      const publicUrl = await uploadImageToStorage(uri);

      if (publicUrl) {
        const { error } = await supabase.from("gallery_photos").insert({
          title: photoTitle,
          description: photoDesc,
          image_url: publicUrl,
        });

        if (!error) {
          successCount++;
        } else {
          console.error("❌ Error BD gallery_photos:", error);
        }
      }
    }

    setUploading(false);
    if (successCount > 0) {
      Alert.alert("Éxito", `Se subieron ${successCount} fotos a la galería.`);
      setPhotoTitle(""); setPhotoDesc(""); setGalleryImages([]);
      setActiveTab("dashboard");
    } else {
      Alert.alert("Error", "Revisa la consola. No se pudieron subir o guardar las imágenes.");
    }
  };

  const handleCreateStaffAccount = async () => {
    if (!canManageUsers) {
      Alert.alert("Sin permisos", "Solo una cuenta administradora puede crear usuarios internos.");
      return;
    }

    if (!staffName || !staffEmail || !staffPassword) {
      Alert.alert("Campos incompletos", "Agrega nombre, correo y contraseña temporal.");
      return;
    }

    if (staffPassword.length < 6) {
      Alert.alert("Contraseña corta", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setUploading(true);

    try {
      const normalizedEmail = staffEmail.trim().toLowerCase();
      const isolatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });

      const { data: authData, error: authError } = await isolatedSupabase.auth.signUp({
        email: normalizedEmail,
        password: staffPassword,
        options: {
          data: {
            name: staffName.trim(),
            phone: staffPhone.trim() || null,
            role: staffRole,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user?.id) {
        throw new Error("Supabase no regresó el ID del nuevo usuario.");
      }

      const { error: profileError } = await supabase.from("users").upsert({
        id: authData.user.id,
        name: staffName.trim(),
        email: normalizedEmail,
        phone: staffPhone.trim() || null,
        role: staffRole,
      });

      if (profileError) throw profileError;

      await refreshProfile();
      Alert.alert("Cuenta creada", `La cuenta de ${staffName.trim()} quedó registrada como ${STAFF_ROLES.find((role) => role.value === staffRole)?.label}.`);
      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      setStaffPassword("");
      setStaffRole("comunicacion");
      setActiveTab("dashboard");
    } catch (error: any) {
      Alert.alert("No se pudo crear", error.message || "Revisa permisos de Auth/RLS e intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <Pressable onPress={() => router.replace("/(tabs)")} style={styles.backBtn}>
          <Feather name="home" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Panel</Text>
          <Text style={styles.headerRole}>{ROLE_LABELS[currentRole] ?? "Usuario interno"}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.backBtn}>
          <Feather name="log-out" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* CUSTOM TABS */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {availableTabs.map((tab) => {
          const label: Record<AdminTab, string> = {
            dashboard: "Resumen",
            news: "Redactar",
            photos: "Subir Fotos",
            users: "Cuentas",
          };
          return (
            <Pressable key={tab} style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary }]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.mutedForeground }]}>{label[tab]}</Text>
            </Pressable>
          );
        })}
        {availableTabs.length === 0 && (
          <Pressable style={[styles.tab, { borderBottomColor: colors.primary }]} onPress={() => router.replace("/(tabs)")}>
            <Text style={[styles.tabText, { color: colors.primary }]}>Inicio</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.scroll, { paddingBottom: 40 + insets.bottom }]}>
        
        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === "dashboard" && (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Métricas en vivo</Text>
              <View style={styles.statsGrid}>
                <StatsCard label="Beneficiarios" value={stats.total_beneficiaries || 0} icon="users" color={colors.primary} />
                <StatsCard label="Sol. Pendientes" value={stats.pending_requests || 0} icon="clock" color="#D97706" />
              </View>
              <View style={styles.statsGrid}>
                <StatsCard label="Doc. Pendientes" value={stats.pending_documents || 0} icon="paperclip" color="#DC2626" />
                <StatsCard label="Patrocinadores" value={stats.active_sponsors || 0} icon="award" color="#059669" />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gestión Rápida</Text>
              {visibleSections.map((item) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.sectionCard,
                    { backgroundColor: colors.background, borderColor: colors.border, opacity: pressed ? 0.85 : 1, shadowColor: colors.foreground },
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.sectionIcon, { backgroundColor: item.color + "15" }]}>
                    <Feather name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.sectionInfo}>
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{item.label}</Text>
                    <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* ================= TAB 2: NOTICIAS ================= */}
        {activeTab === "news" && canPublishContent && (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Publicar Nueva Noticia</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Título principal</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Ej. Gran victoria" placeholderTextColor={colors.mutedForeground} value={newsTitle} onChangeText={setNewsTitle} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Resumen corto</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Breve descripción" placeholderTextColor={colors.mutedForeground} value={newsSummary} onChangeText={setNewsSummary} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Contenido completo</Text>
              <TextInput style={[styles.inputArea, { color: colors.foreground, borderColor: colors.border }]} placeholder="Escribe toda la historia..." placeholderTextColor={colors.mutedForeground} multiline textAlignVertical="top" value={newsContent} onChangeText={setNewsContent} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Imagen de portada</Text>
              <Pressable style={[styles.imageBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => pickImage("news")}>
                {newsImage ? <Image source={{ uri: newsImage }} style={styles.previewImage} /> : (
                  <>
                    <Feather name="camera" size={32} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>Tocar para subir foto</Text>
                  </>
                )}
              </Pressable>
            </View>

            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.7 : 1 }]} onPress={handlePublishNews} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Publicar Noticia</Text>}
            </Pressable>
          </View>
        )}

        {/* ================= TAB 3: FOTOS ================= */}
        {activeTab === "photos" && canPublishContent && (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Añadir Fotos a Galería</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Título (Aplicará a todas)</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Ej. Torneo de Verano" placeholderTextColor={colors.mutedForeground} value={photoTitle} onChangeText={setPhotoTitle} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Contexto (Opcional)</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="¿Qué sucedió en estas fotos?" placeholderTextColor={colors.mutedForeground} value={photoDesc} onChangeText={setPhotoDesc} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Fotografías seleccionadas ({galleryImages.length})</Text>
              
              {galleryImages.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                  {galleryImages.map((uri, index) => (
                    <View key={index} style={styles.thumbnailContainer}>
                      <Image source={{ uri }} style={styles.thumbnailImage} />
                      <Pressable style={styles.removeBadge} onPress={() => removeGalleryImage(index)}>
                        <Feather name="x" size={14} color="#FFF" />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={[styles.addMoreBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => pickImage("gallery")}>
                    <Feather name="plus" size={24} color={colors.mutedForeground} />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>Añadir</Text>
                  </Pressable>
                </ScrollView>
              ) : (
                <Pressable style={[styles.imageBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => pickImage("gallery")}>
                  <Feather name="image" size={32} color={colors.mutedForeground} />
                  <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>Tocar para seleccionar varias fotos</Text>
                </Pressable>
              )}
            </View>

            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.7 : 1 }]} onPress={handleUploadPhoto} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Subir {galleryImages.length > 0 ? galleryImages.length : ""} a la Galería</Text>}
            </Pressable>
          </View>
        )}

        {/* ================= TAB 4: CUENTAS ================= */}
        {activeTab === "users" && canManageUsers && (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Crear cuenta interna</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Rol</Text>
              <View style={styles.roleGrid}>
                {STAFF_ROLES.map((role) => (
                  <Pressable
                    key={role.value}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: staffRole === role.value ? colors.primary : colors.card,
                        borderColor: staffRole === role.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setStaffRole(role.value)}
                  >
                    <Text style={[styles.roleChipText, { color: staffRole === role.value ? "#FFFFFF" : colors.foreground }]}>
                      {role.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre completo</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Nombre de la persona" placeholderTextColor={colors.mutedForeground} value={staffName} onChangeText={setStaffName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Correo</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="comunicacion@correo.com" placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none" value={staffEmail} onChangeText={setStaffEmail} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Teléfono</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Opcional" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" value={staffPhone} onChangeText={setStaffPhone} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Contraseña temporal</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Mínimo 6 caracteres" placeholderTextColor={colors.mutedForeground} secureTextEntry value={staffPassword} onChangeText={setStaffPassword} />
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "25" }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.infoBoxText, { color: colors.foreground }]}>
                La opción principal es Comunicación. También puedes crear capturistas, validadores o administradores si tu política de Supabase lo permite.
              </Text>
            </View>

            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.7 : 1 }]} onPress={handleCreateStaffAccount} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Crear cuenta</Text>}
            </Pressable>
          </View>
        )}

      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  headerRole: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  tabContainer: { flexDirection: "row", borderWidth: 0, borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  section: { gap: 14 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", gap: 12 },
  alertCard: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  alertContent: { flex: 1, gap: 4 },
  alertTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  alertText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  sectionCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  sectionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  sectionInfo: { flex: 1, gap: 2 },
  sectionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sectionDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  formSection: { gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 15, fontFamily: "Inter_400Regular" },
  inputArea: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingTop: 14, height: 120, fontSize: 15, fontFamily: "Inter_400Regular" },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  roleChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  infoBox: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "flex-start" },
  infoBoxText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  imageBtn: { height: 180, borderWidth: 1, borderStyle: "dashed", borderRadius: 12, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  submitBtn: { height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center", marginTop: 8 },
  submitBtnText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  thumbnailContainer: { position: "relative", width: 100, height: 100 },
  thumbnailImage: { width: "100%", height: "100%", borderRadius: 12, resizeMode: "cover" },
  removeBadge: { position: "absolute", top: -6, right: -6, backgroundColor: "#EF4444", width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  addMoreBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
});
