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

// IMPORTACIONES CRÍTICAS:
// Si estos 3 archivos no existen exactamente con estos nombres, la app crasheará.
import { StatsCard } from "@/components/StatsCard";
import SponsorCard from "@/components/SponsorCard"; // <-- SponsorCard va SIN llaves porque le pusimos "export default"
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { STAFF_ROLES, type UserRole } from "@/lib/appData";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

const ADMIN_SECTIONS = [
  { icon: "user-plus" as const, label: "Registrar beneficiario", desc: "Capturar una nueva solicitud en base de datos", route: "/(tabs)/registrar", color: "#059669" },
  { icon: "users" as const, label: "Beneficiarios", desc: "Gestionar beneficiarios y estados documentales", route: "/(tabs)/expedientes", color: "#1A4FA8" },
  { icon: "file-text" as const, label: "Noticias Publicadas", desc: "Ver todas las noticias", route: "/(tabs)/noticias", color: "#059669" },
  { icon: "image" as const, label: "Galería Pública", desc: "Ver fotos y videos publicados", route: "/galeria", color: "#EC4899" },
  { icon: "award" as const, label: "Patrocinadores", desc: "Administrar patrocinadores", route: "/patrocinadores", color: "#D97706" },
  { icon: "bar-chart-2" as const, label: "Estadísticas", desc: "Ver reportes y métricas", route: "/estadisticas", color: "#7C3AED" },
];

type AdminTab = "dashboard" | "news" | "photos" | "sponsors" | "users";

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
  sponsors: ["admin", "comunicacion"],
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

const SPONSOR_LEVELS = ["Oro", "Plata", "Bronce", "Benefactor principal", "Apoyo en especie"];

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

  // Estados para Noticias
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsCategory, setNewsCategory] = useState("Fundación");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsImage, setNewsImage] = useState<string | null>(null);

  // Estados para Galería
  const [recentPhotos, setRecentPhotos] = useState<any[]>([]);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [originalGalleryMapping, setOriginalGalleryMapping] = useState<Record<string, string>>({});
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoDesc, setPhotoDesc] = useState("");
  const [galleryType, setGalleryType] = useState<"imagen" | "video">("imagen");
  const [videoUrl, setVideoUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  // Estados para Patrocinadores
  const [recentSponsors, setRecentSponsors] = useState<any[]>([]);
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorLevel, setSponsorLevel] = useState("Bronce");
  const [sponsorDesc, setSponsorDesc] = useState("");
  const [sponsorContact, setSponsorContact] = useState("");
  const [sponsorLogo, setSponsorLogo] = useState<string | null>(null);
  const [sponsorWebsite, setSponsorWebsite] = useState("");
  const [sponsorPromoImage, setSponsorPromoImage] = useState<string | null>(null);

  // Estados para Usuarios
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
    loadAdminContent();
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

  const loadAdminContent = async () => {
    if (canPublishContent) {
      const { data: newsData } = await supabase.from("news").select("*").order("created_at", { ascending: false }).limit(10);
      if (newsData) setRecentNews(newsData);

      const { data: photoData } = await supabase.from("gallery_photos").select("*").order("upload_date", { ascending: false });
      if (photoData) {
        const uniqueTitles = new Set();
        const groupedPhotos = [];
        for (const photo of photoData) {
          if (!uniqueTitles.has(photo.title)) {
            uniqueTitles.add(photo.title);
            groupedPhotos.push(photo);
          }
        }
        setRecentPhotos(groupedPhotos.slice(0, 10));
      }

      const { data: sponsorData } = await supabase.from("sponsors").select("*").order("created_at", { ascending: false }).limit(15);
      if (sponsorData) setRecentSponsors(sponsorData);
    }
  };

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

  const uploadMediaToStorage = async (fileUri: string): Promise<string | null> => {
    try {
      const fileExt = fileUri.split(".").pop() || (galleryType === "video" ? "mp4" : "jpeg");
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      const isVideo = ["mp4", "mov", "m4v", "webm"].includes(fileExt.toLowerCase());

      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: fileName,
        type: isVideo ? `video/${fileExt === "mov" ? "quicktime" : fileExt}` : `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
      } as any);

      const { error } = await supabase.storage.from("img").upload(filePath, formData);
      if (error) throw error;

      const { data } = supabase.storage.from("img").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error subiendo multimedia:", error);
      return null;
    }
  };

  const pickImage = async (type: "news" | "gallery" | "sponsor" | "sponsorPromo") => {
    const isGallery = type === "gallery";
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === "gallery" && galleryType === "video" ? ["videos"] : ["images"],
      allowsEditing: !isGallery, 
      allowsMultipleSelection: isGallery && galleryType === "imagen", 
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (type === "news") {
        setNewsImage(result.assets[0].uri);
      } else if (type === "gallery") {
        const newUris = result.assets.map(a => a.uri);
        setGalleryImages(prev => [...prev, ...newUris]);
      } else if (type === "sponsor") {
        setSponsorLogo(result.assets[0].uri);
      } else if (type === "sponsorPromo") {
        setSponsorPromoImage(result.assets[0].uri);
      }
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setGalleryImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const selectNewsForEdit = (item: any) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title || "");
    setNewsSummary(item.summary || "");
    setNewsContent(item.content || "");
    setNewsCategory(item.category || "Fundación");
    setNewsImage(item.image_url || null);
  };

  const selectGalleryForEdit = async (item: any) => {
    setUploading(true);
    const { data, error } = await supabase.from("gallery_photos").select("*").eq("title", item.title);

    if (data && !error) {
      setEditingGalleryId(item.title);
      setPhotoTitle(item.title || "");
      setPhotoDesc(data[0]?.description || "");
      const firstType = data[0]?.type === "video" || data[0]?.media_type === "video" ? "video" : "imagen";
      setGalleryType(firstType);
      setVideoUrl(firstType === "video" ? data[0]?.video_url || data[0]?.media_url || "" : "");
      setGalleryImages(data.map((d: any) => d.media_url || d.video_url || d.image_url).filter(Boolean));

      const mapping: Record<string, string> = {};
      data.forEach((d: any) => {
        const mediaUrl = d.media_url || d.video_url || d.image_url;
        if (mediaUrl) mapping[mediaUrl] = d.id;
      });
      setOriginalGalleryMapping(mapping);
    }
    setUploading(false);
  };

  const selectSponsorForEdit = (item: any) => {
    setEditingSponsorId(item.id);
    setSponsorName(item.name || "");
    setSponsorLevel(item.level || "Bronce");
    setSponsorDesc(item.description || "");
    setSponsorContact(item.contact_name || "");
    setSponsorLogo(item.logo_url || null);
    setSponsorWebsite(item.website || "");
    setSponsorPromoImage(item.promo_image_url || null);
  };

  const handlePublishNews = async () => {
    if (!canPublishContent) return Alert.alert("Sin permisos", "Tu rol no puede publicar.");
    if (!newsTitle || !newsContent) return Alert.alert("Campos vacíos", "Completa título y contenido.");
    
    setUploading(true);
    let publicUrl = newsImage;

    if (newsImage && !newsImage.startsWith("http")) {
      const uploadedUrl = await uploadImageToStorage(newsImage);
      if (!uploadedUrl) {
        setUploading(false);
        return Alert.alert("Error", "No se pudo subir la foto de la noticia.");
      }
      publicUrl = uploadedUrl;
    }

    const payload = {
      title: newsTitle,
      category: newsCategory,
      summary: newsSummary,
      content: newsContent,
      image_url: publicUrl,
    };

    let error;
    if (editingNewsId) {
      const { error: updateError } = await supabase.from("news").update(payload).eq("id", editingNewsId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("news").insert({ ...payload, author: "Administración Gallos" });
      error = insertError;
    }

    setUploading(false);
    if (!error) {
      Alert.alert("Éxito", editingNewsId ? "Noticia actualizada." : "Noticia publicada.");
      setNewsTitle(""); setNewsSummary(""); setNewsContent(""); setNewsImage(null); setEditingNewsId(null);
      loadAdminContent();
    } else {
      Alert.alert("Error", "No se pudo guardar la noticia.");
    }
  };

  const handleUploadPhoto = async () => {
    if (!canPublishContent) return Alert.alert("Sin permisos", "Tu rol no puede subir multimedia.");
    if (!photoTitle) return Alert.alert("Falta título", "El título es obligatorio.");
    if (galleryType === "imagen" && galleryImages.length === 0) return Alert.alert("Faltan imágenes", "Selecciona al menos una fotografía.");
    if (galleryType === "video" && galleryImages.length === 0 && !videoUrl.trim()) return Alert.alert("Falta video", "Agrega una URL o selecciona un archivo de video.");
    
    setUploading(true);
    let successCount = 0;

    if (galleryType === "video") {
      const mediaUrl = videoUrl.trim() || (galleryImages[0]?.startsWith("http") ? galleryImages[0] : galleryImages[0] ? await uploadMediaToStorage(galleryImages[0]) : null);
      if (!mediaUrl) {
        setUploading(false);
        return Alert.alert("Error", "No se pudo preparar el video.");
      }

      const payload = {
        title: photoTitle,
        description: photoDesc,
        type: "video",
        media_url: mediaUrl,
        video_url: mediaUrl,
        image_url: null,
      };

      if (editingGalleryId) {
        const ids = Object.values(originalGalleryMapping);
        if (ids.length > 0) {
          await supabase.from("gallery_photos").update(payload).in("id", ids);
          successCount = ids.length;
        }
      } else {
        const { error } = await supabase.from("gallery_photos").insert(payload);
        if (!error) successCount = 1;
      }
    } else if (editingGalleryId) {
      const keptUrls = galleryImages.filter(uri => uri.startsWith("http"));
      const newUris = galleryImages.filter(uri => !uri.startsWith("http"));
      const originalUrls = Object.keys(originalGalleryMapping);
      const deletedUrls = originalUrls.filter(url => !keptUrls.includes(url));
      const deletedIds = deletedUrls.map(url => originalGalleryMapping[url]);

      if (deletedIds.length > 0) {
        await supabase.from("gallery_photos").delete().in("id", deletedIds);
      }

      const keptIds = keptUrls.map(url => originalGalleryMapping[url]);
      if (keptIds.length > 0) {
        await supabase.from("gallery_photos").update({ title: photoTitle, description: photoDesc }).in("id", keptIds);
        successCount += keptIds.length;
      }

      for (const uri of newUris) {
        const publicUrl = await uploadMediaToStorage(uri);
        if (publicUrl) {
          const { error } = await supabase.from("gallery_photos").insert({ title: photoTitle, description: photoDesc, type: "imagen", media_url: publicUrl, image_url: publicUrl });
          if (!error) successCount++;
        }
      }
    } else {
      for (const uri of galleryImages) {
        const publicUrl = await uploadMediaToStorage(uri);
        if (publicUrl) {
          const { error } = await supabase.from("gallery_photos").insert({ title: photoTitle, description: photoDesc, type: "imagen", media_url: publicUrl, image_url: publicUrl });
          if (!error) successCount++;
        }
      }
    }

    setUploading(false);
    if (successCount > 0) {
      Alert.alert("Éxito", editingGalleryId ? "Galería actualizada." : `Se guardaron ${successCount} elemento(s).`);
      setPhotoTitle(""); setPhotoDesc(""); setGalleryImages([]); 
      setVideoUrl(""); setGalleryType("imagen"); setEditingGalleryId(null); setOriginalGalleryMapping({});
      loadAdminContent();
    } else {
      Alert.alert("Error", "No se pudieron guardar las imágenes.");
    }
  };

  const handleSaveSponsor = async () => {
    if (!canPublishContent) return Alert.alert("Sin permisos", "Tu rol no puede administrar patrocinadores.");
    if (!sponsorName || !sponsorContact) return Alert.alert("Campos vacíos", "El nombre y el contacto son obligatorios.");
    
    setUploading(true);
    let publicUrl = sponsorLogo;
    let promoUrl = sponsorPromoImage;

    if (sponsorLogo && !sponsorLogo.startsWith("http")) {
      const uploadedUrl = await uploadImageToStorage(sponsorLogo);
      if (!uploadedUrl) {
        setUploading(false);
        return Alert.alert("Error", "No se pudo subir el logo del patrocinador.");
      }
      publicUrl = uploadedUrl;
    }

    if (sponsorPromoImage && !sponsorPromoImage.startsWith("http")) {
      const uploadedUrl = await uploadImageToStorage(sponsorPromoImage);
      if (!uploadedUrl) {
        setUploading(false);
        return Alert.alert("Error", "No se pudo subir la imagen promocional.");
      }
      promoUrl = uploadedUrl;
    }

    const payload = {
      name: sponsorName,
      level: sponsorLevel,
      description: sponsorDesc,
      contact_name: sponsorContact,
      logo_url: publicUrl,
      website: sponsorWebsite.trim() || null,
      promo_image_url: promoUrl,
    };

    let error;
    if (editingSponsorId) {
      const { error: err } = await supabase.from("sponsors").update(payload).eq("id", editingSponsorId);
      error = err;
    } else {
      const { error: err } = await supabase.from("sponsors").insert(payload);
      error = err;
    }

    setUploading(false);
    if (!error) {
      Alert.alert("Éxito", editingSponsorId ? "Patrocinador actualizado." : "Patrocinador registrado.");
      setSponsorName(""); setSponsorDesc(""); setSponsorContact(""); setSponsorLogo(null); setSponsorWebsite(""); setSponsorPromoImage(null); setEditingSponsorId(null);
      loadAdminContent();
    } else {
      console.log(error);
      Alert.alert("Error", "No se pudo guardar el patrocinador.");
    }
  };

  const handleCreateStaffAccount = async () => {
    if (!canManageUsers) return Alert.alert("Sin permisos", "Solo admin puede crear usuarios.");
    if (!staffName || !staffEmail || !staffPassword) return Alert.alert("Incompleto", "Faltan datos.");
    if (staffPassword.length < 6) return Alert.alert("Error", "Mínimo 6 caracteres en contraseña.");

    setUploading(true);
    try {
      const normalizedEmail = staffEmail.trim().toLowerCase();
      const isolatedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      });

      const { data: authData, error: authError } = await isolatedSupabase.auth.signUp({
        email: normalizedEmail,
        password: staffPassword,
        options: { data: { name: staffName.trim(), phone: staffPhone.trim() || null, role: staffRole } },
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error("Sin ID retornado.");

      const { error: profileError } = await supabase.from("users").upsert({
        id: authData.user.id,
        name: staffName.trim(),
        email: normalizedEmail,
        phone: staffPhone.trim() || null,
        role: staffRole,
      });

      if (profileError) throw profileError;

      await refreshProfile();
      Alert.alert("Cuenta creada", `Se registró a ${staffName.trim()}.`);
      setStaffName(""); setStaffEmail(""); setStaffPhone(""); setStaffPassword(""); setStaffRole("comunicacion");
      setActiveTab("dashboard");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Fallo en creación.");
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
          <Text style={styles.headerTitle}>Panel de Control</Text>
          <Text style={styles.headerRole}>{ROLE_LABELS[currentRole] ?? "Usuario interno"}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.backBtn}>
          <Feather name="log-out" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* CUSTOM TABS (SCROLLABLE) */}
      <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {availableTabs.map((tab) => {
            const label: Record<AdminTab, string> = {
              dashboard: "Resumen",
              news: "Noticias",
              photos: "Galería",
              sponsors: "Patrocinios",
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
        </ScrollView>
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
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {editingNewsId ? "Editar Noticia" : "Publicar Nueva Noticia"}
            </Text>
            
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
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingNewsId ? "Guardar Cambios" : "Publicar Noticia"}</Text>}
            </Pressable>
            
            {editingNewsId && (
              <Pressable style={{ alignItems: "center", marginTop: 10 }} onPress={() => { setEditingNewsId(null); setNewsTitle(""); setNewsContent(""); setNewsImage(null); setNewsSummary(""); }}>
                <Text style={{ color: colors.primary }}>Cancelar edición</Text>
              </Pressable>
            )}

            <View style={styles.listContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 10 }]}>Noticias Recientes</Text>
              {recentNews.map(item => (
                <Pressable key={item.id} style={[styles.listItem, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => selectNewsForEdit(item)}>
                  <Image source={{ uri: item.image_url }} style={styles.listImg} />
                  <View style={styles.listInfo}>
                    <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.listDate, { color: colors.mutedForeground }]}>{item.category}</Text>
                  </View>
                  <View style={[styles.editIconBtn, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ================= TAB 3: GALERIA ================= */}
        {activeTab === "photos" && canPublishContent && (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {editingGalleryId ? "Editar multimedia: " + editingGalleryId : "Crear elemento multimedia"}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Título</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Ej. Torneo de Verano" placeholderTextColor={colors.mutedForeground} value={photoTitle} onChangeText={setPhotoTitle} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Contexto (Opcional)</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="¿Qué sucedió en estas fotos?" placeholderTextColor={colors.mutedForeground} value={photoDesc} onChangeText={setPhotoDesc} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Tipo</Text>
              <View style={styles.roleGrid}>
                {(["imagen", "video"] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: galleryType === type ? colors.primary : colors.card,
                        borderColor: galleryType === type ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setGalleryType(type);
                      setGalleryImages([]);
                      setVideoUrl("");
                    }}
                  >
                    <Text style={[styles.roleChipText, { color: galleryType === type ? "#FFFFFF" : colors.foreground }]}>
                      {type === "imagen" ? "Imagen" : "Video"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {galleryType === "video" && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>URL de YouTube o externa</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="https://..."
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="url"
                  autoCapitalize="none"
                  value={videoUrl}
                  onChangeText={setVideoUrl}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                {galleryType === "imagen" ? `Fotografías (${galleryImages.length})` : "Archivo de video"}
              </Text>

              {galleryImages.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                  {galleryImages.map((uri, index) => (
                    <View key={index} style={styles.thumbnailContainer}>
                      {galleryType === "imagen" ? (
                        <Image source={{ uri }} style={styles.thumbnailImage} />
                      ) : (
                        <View style={[styles.thumbnailImage, { backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }]}>
                          <Feather name="play-circle" size={26} color={colors.primary} />
                        </View>
                      )}
                      <Pressable style={styles.removeBadge} onPress={() => removeGalleryImage(index)}>
                        <Feather name="x" size={14} color="#FFF" />
                      </Pressable>
                    </View>
                  ))}
                  
                  {galleryType === "imagen" && (
                    <Pressable style={[styles.addMoreBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => pickImage("gallery")}>
                    <Feather name="plus" size={24} color={colors.mutedForeground} />
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>Añadir más</Text>
                    </Pressable>
                  )}
                </ScrollView>
              ) : (
                <Pressable style={[styles.imageBtn, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => pickImage("gallery")}>
                  <Feather name={galleryType === "imagen" ? "image" : "video"} size={32} color={colors.mutedForeground} />
                  <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>
                    {galleryType === "imagen" ? "Tocar para seleccionar fotos" : "Tocar para seleccionar video"}
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.7 : 1 }]} onPress={handleUploadPhoto} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingGalleryId ? "Actualizar" : "Publicar"}</Text>}
            </Pressable>

            {editingGalleryId && (
              <Pressable style={{ alignItems: "center", marginTop: 10 }} onPress={() => { setEditingGalleryId(null); setPhotoTitle(""); setPhotoDesc(""); setGalleryImages([]); setVideoUrl(""); setGalleryType("imagen"); setOriginalGalleryMapping({}); }}>
                <Text style={{ color: colors.primary }}>Cancelar edición</Text>
              </Pressable>
            )}

            <View style={styles.listContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 10 }]}>Multimedia reciente</Text>
              {recentPhotos.map((item, i) => (
                <Pressable key={i} style={[styles.listItem, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => selectGalleryForEdit(item)}>
                  {item.type === "video" || item.media_type === "video" ? (
                    <View style={[styles.listImg, { alignItems: "center", justifyContent: "center", backgroundColor: colors.primary + "15" }]}>
                      <Feather name="play-circle" size={20} color={colors.primary} />
                    </View>
                  ) : (
                    <Image source={{ uri: item.image_url || item.media_url }} style={styles.listImg} />
                  )}
                  <View style={styles.listInfo}>
                    <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[styles.listDate, { color: colors.mutedForeground }]}>{item.type === "video" || item.media_type === "video" ? "Video" : "Foto"} · {item.description || 'Sin descripción'}</Text>
                  </View>
                  <View style={[styles.editIconBtn, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ================= TAB 4: PATROCINADORES ================= */}
        {activeTab === "sponsors" && canPublishContent && (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {editingSponsorId ? "Editar Patrocinador" : "Nuevo Patrocinador"}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nivel de Patrocinio</Text>
              <View style={styles.roleGrid}>
                {SPONSOR_LEVELS.map((lvl) => (
                  <Pressable 
                    key={lvl} 
                    style={[
                      styles.roleChip, 
                      { 
                        backgroundColor: sponsorLevel === lvl ? colors.primary : colors.card, 
                        borderColor: sponsorLevel === lvl ? colors.primary : colors.border 
                      }
                    ]} 
                    onPress={() => setSponsorLevel(lvl)}
                  >
                    <Text style={[styles.roleChipText, { color: sponsorLevel === lvl ? "#FFFFFF" : colors.foreground }]}>{lvl}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre Comercial *</Text>
              <TextInput 
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} 
                placeholder="Ej. Empresa SA de CV" 
                placeholderTextColor={colors.mutedForeground} 
                value={sponsorName} 
                onChangeText={setSponsorName} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre del Contacto *</Text>
              <TextInput 
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} 
                placeholder="Ej. Juan Pérez" 
                placeholderTextColor={colors.mutedForeground} 
                value={sponsorContact} 
                onChangeText={setSponsorContact} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Sitio web</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="https://empresa.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="url"
                autoCapitalize="none"
                value={sponsorWebsite}
                onChangeText={setSponsorWebsite}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Leyenda o Descripción</Text>
              <TextInput 
                style={[styles.inputArea, { color: colors.foreground, borderColor: colors.border, height: 80 }]} 
                placeholder="Aparecerá en la tarjeta pública..." 
                placeholderTextColor={colors.mutedForeground} 
                multiline 
                textAlignVertical="top" 
                value={sponsorDesc} 
                onChangeText={setSponsorDesc} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Logo de la Empresa</Text>
              <Pressable 
                style={[styles.imageBtn, { borderColor: colors.border, backgroundColor: colors.card, height: 140 }]} 
                onPress={() => pickImage("sponsor")}
              >
                {sponsorLogo ? (
                  <Image source={{ uri: sponsorLogo }} style={styles.previewImage} resizeMode="contain" />
                ) : (
                  <>
                    <Feather name="image" size={32} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>Tocar para subir logo</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Imagen promocional</Text>
              <Pressable
                style={[styles.imageBtn, { borderColor: colors.border, backgroundColor: colors.card, height: 140 }]}
                onPress={() => pickImage("sponsorPromo")}
              >
                {sponsorPromoImage ? (
                  <Image source={{ uri: sponsorPromoImage }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <>
                    <Feather name="image" size={32} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>Tocar para subir imagen promocional</Text>
                  </>
                )}
              </Pressable>
            </View>

            <Pressable 
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.7 : 1 }]} 
              onPress={handleSaveSponsor} 
              disabled={uploading}
            >
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingSponsorId ? "Actualizar" : "Guardar Patrocinador"}</Text>}
            </Pressable>

            {editingSponsorId && (
              <Pressable style={{ alignItems: "center", marginTop: 10 }} onPress={() => { setEditingSponsorId(null); setSponsorName(""); setSponsorDesc(""); setSponsorContact(""); setSponsorLogo(null); setSponsorWebsite(""); setSponsorPromoImage(null); }}>
                <Text style={{ color: colors.primary }}>Cancelar edición</Text>
              </Pressable>
            )}

            <View style={styles.listContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 10 }]}>Patrocinadores Recientes</Text>
              {recentSponsors.map(item => (
                <Pressable key={item.id} style={[styles.listItem, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={() => selectSponsorForEdit(item)}>
                  {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} style={styles.listImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.listImg, { alignItems: "center", justifyContent: "center", backgroundColor: colors.primary + "20" }]}>
                      <Feather name="award" size={20} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.listInfo}>
                    <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.listDate, { color: colors.primary }]}>{item.level}</Text>
                  </View>
                  <View style={[styles.editIconBtn, { backgroundColor: colors.primary + "15" }]}>
                    <Feather name="edit-2" size={16} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
            </View>

          </View>
        )}

        {/* ================= TAB 5: CUENTAS ================= */}
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
  
  // Custom Tabs Horizontal
  tabContainer: { flexDirection: "row", paddingHorizontal: 10 },
  tab: { paddingHorizontal: 16, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
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
  
  // Estilos de la lista de edición
  listContainer: { marginTop: 12, gap: 10 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 10, borderWidth: 1, borderRadius: 12, gap: 12 },
  listImg: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#ccc" },
  listInfo: { flex: 1, gap: 4 },
  listTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  listDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  editIconBtn: { padding: 8, borderRadius: 8 },
});
