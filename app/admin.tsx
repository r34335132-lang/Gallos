import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

type AdminTab = "beneficiaries" | "news" | "photos";

export default function AdminDashboard() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<AdminTab>("beneficiaries");
  const [uploading, setUploading] = useState(false);

  // Estados de carga generales
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

  // Formulario de Noticias
  const [newsTitle, setNewsTitle] = useState("");
  const [newsCategory, setNewsCategory] = useState("Fundación");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsImage, setNewsImage] = useState<string | null>(null);

  // Formulario de Fotos
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoDesc, setPhotoDesc] = useState("");
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);

  useEffect(() => {
    loadBeneficiaries();
    loadTournaments();
  }, []);

  const loadBeneficiaries = async () => {
    const { data } = await supabase
      .from("beneficiaries")
      .select("*")
      .order("registration_date", { ascending: false });
    if (data) setBeneficiaries(data);
  };

  const loadTournaments = async () => {
    const { data } = await supabase.from("tournaments").select("*").eq("is_active", true);
    if (data) setTournaments(data);
  };

  // Función genérica para subir imágenes al Storage bucket 'img'
  const uploadImageToStorage = async (fileUri: string): Promise<string | null> => {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const fileExt = fileUri.split(".").pop() || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("img")
        .upload(filePath, arrayBuffer, { contentType: `image/${fileExt}` });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("img").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error en la subida física del archivo:", error);
      return null;
    }
  };

  const pickImage = async (type: "news" | "gallery") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      if (type === "news") setNewsImage(result.assets[0].uri);
      else setGalleryImage(result.assets[0].uri);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("beneficiaries")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      Alert.alert("Éxito", "Estado de expediente actualizado correctamente.");
      loadBeneficiaries();
    }
  };

  const handlePublishNews = async () => {
    if (!newsTitle || !newsContent) return Alert.alert("Campos vacíos", "Completa los campos.");
    setUploading(true);
    let publicUrl = null;

    if (newsImage) {
      publicUrl = await uploadImageToStorage(newsImage);
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
      setNewsTitle("");
      setNewsSummary("");
      setNewsContent("");
      setNewsImage(null);
    }
  };

  const handleUploadPhoto = async () => {
    if (!galleryImage) return Alert.alert("Falta Imagen", "Selecciona una fotografía.");
    setUploading(true);

    const publicUrl = await uploadImageToStorage(galleryImage);

    if (publicUrl) {
      const { error } = await supabase.from("gallery_photos").insert({
        title: photoTitle,
        description: photoDesc,
        image_url: publicUrl,
        tournament_id: selectedTournament || null,
      });

      if (!error) {
        Alert.alert("Éxito", "Foto subida a la galería global.");
        setPhotoTitle("");
        setPhotoDesc("");
        setGalleryImage(null);
      }
    }
    setUploading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Selector de pestañas */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(["beneficiaries", "news", "photos"] as AdminTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && { borderBottomColor: colors.primary }]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.primary : colors.mutedForeground },
              ]}
            >
              {tab === "beneficiaries" ? "Beneficiarios" : tab === "news" ? "Noticias" : "Subir Fotos"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* PESTAÑA: BENEFICIARIOS */}
        {activeTab === "beneficiaries" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Revisión de Expedientes</Text>
            {beneficiaries.map((b) => (
              <View key={b.id} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{b.name}</Text>
                  <Text style={{ color: colors.mutedForeground }}>Folio: {b.folio} | Estado actuel: {b.status}</Text>
                </View>
                <View style={styles.actionRow}>
                  <Pressable style={[styles.btnAction, { backgroundColor: "#10B981" }]} onPress={() => handleUpdateStatus(b.id, "activo")}>
                    <Text style={styles.btnText}>Aprobar</Text>
                  </Pressable>
                  <Pressable style={[styles.btnAction, { backgroundColor: "#F59E0B" }]} onPress={() => handleUpdateStatus(b.id, "en_revision")}>
                    <Text style={styles.btnText}>Revisar</Text>
                  </Pressable>
                  <Pressable style={[styles.btnAction, { backgroundColor: "#EF4444" }]} onPress={() => handleUpdateStatus(b.id, "rechazado")}>
                    <Text style={styles.btnText}>Rechazar</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PESTAÑA: NOTICIAS */}
        {activeTab === "news" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nueva Noticia</Text>
            <TextInput placeholder="Título" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} value={newsTitle} onChangeText={setNewsTitle} />
            <TextInput placeholder="Resumen corto" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} value={newsSummary} onChangeText={setNewsSummary} />
            <TextInput placeholder="Contenido de la noticia" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, height: 100 }]} multiline value={newsContent} onChangeText={setNewsContent} />
            
            <Pressable style={[styles.imageBtn, { borderColor: colors.border }]} onPress={() => pickImage("news")}>
              {newsImage ? <Image source={{ uri: newsImage }} style={styles.previewImage} /> : <Text style={{ color: colors.mutedForeground }}>Seleccionar Imagen Noticia</Text>}
            </Pressable>

            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handlePublishNews} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Publicar Noticia</Text>}
            </Pressable>
          </View>
        )}

        {/* PESTAÑA: SUBIR FOTOS */}
        {activeTab === "photos" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cargar Foto a Galería</Text>
            <TextInput placeholder="Título de la imagen" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} value={photoTitle} onChangeText={setPhotoTitle} />
            <TextInput placeholder="Descripción o contexto" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} value={photoDesc} onChangeText={setPhotoDesc} />
            
            <Text style={[styles.label, { color: colors.foreground }]}>Asociar a un Torneo Activo (Opcional):</Text>
            <View style={styles.tournamentList}>
              {tournaments.map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.chip, { borderColor: colors.border }, selectedTournament === t.id && { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedTournament(selectedTournament === t.id ? null : t.id)}
                >
                  <Text style={{ color: selectedTournament === t.id ? "#fff" : colors.foreground }}>{t.name}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={[styles.imageBtn, { borderColor: colors.border }]} onPress={() => pickImage("gallery")}>
              {galleryImage ? <Image source={{ uri: galleryImage }} style={styles.previewImage} /> : <Text style={{ color: colors.mutedForeground }}>Seleccionar Fotografía de Dispositivo</Text>}
            </Pressable>

            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleUploadPhoto} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Subir al Álbum Global</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 16 },
  tabBar: { flexDirection: "row", borderWidth: 1, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 14, borderWidth: 2, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderBottomColor: "transparent" },
  tabText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  imageBtn: { height: 160, borderWidth: 1, borderStyle: "dashed", borderRadius: 12, justifyContent: "center", alignItems: "center", overflow: "hidden", marginVertical: 8 },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  submitBtn: { height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 8 },
  submitBtnText: { color: "#FFF", fontSize: 16, fontFamily: "Inter_700Bold" },
  itemCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10, marginBottom: 10 },
  itemName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  actionRow: { flexDirection: "row", gap: 8 },
  btnAction: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  btnText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  tournamentList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 6 },
  chip: { borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
});