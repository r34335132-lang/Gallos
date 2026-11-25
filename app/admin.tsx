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
import { isHeicUrl } from "@/lib/heic";
import { reuploadHeicAsJpeg, runWithConcurrency, uploadMedia } from "@/lib/mediaUpload";
import { DEFAULT_SITE_SETTINGS } from "@/lib/publicContent";
import { supabase, supabaseAnonKey, supabaseUrl } from "@/lib/supabase";

const ADMIN_SECTIONS = [
  { icon: "check-square" as const, label: "Pasar asistencia", desc: "Lista por sede para entrenadores", route: "/asistencia", color: "#0891B2" },
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
  entrenador: "Entrenador",
};

const TAB_PERMISSIONS: Record<AdminTab, string[]> = {
  dashboard: ["admin", "capturista", "validador", "comunicacion", "entrenador"],
  news: ["admin", "comunicacion"],
  photos: ["admin", "comunicacion"],
  sponsors: ["admin", "comunicacion"],
  users: ["admin"],
};

const SECTION_PERMISSIONS: Record<string, string[]> = {
  "/asistencia": ["admin", "capturista", "validador", "entrenador"],
  "/(tabs)/registrar": ["admin", "capturista"],
  "/(tabs)/expedientes": ["admin", "capturista", "validador"],
  "/(tabs)/noticias": ["admin", "comunicacion"],
  "/galeria": ["admin", "comunicacion"],
  "/patrocinadores": ["admin"],
  "/estadisticas": ["admin"],
};

const SPONSOR_LEVELS = ["Oro", "Plata", "Bronce", "Benefactor principal", "Apoyo en especie"];
const MAX_GALLERY_VIDEO_SIZE_MB = 50;
const MAX_GALLERY_VIDEO_SIZE_BYTES = MAX_GALLERY_VIDEO_SIZE_MB * 1024 * 1024;
const MAX_PREVIEW_THUMBS = 24;
const UPLOAD_CONCURRENCY = 3;
const GALLERY_ADMIN_COLUMNS = "id, title, description, type, media_url, image_url, video_url, event_name, upload_date";

type GalleryMediaDraft = { uri: string; type: "imagen" | "video"; name?: string; mimeType?: string; size?: number; file?: File };
type ExistingMedia = { id: string; url: string; type: "imagen" | "video"; removed: boolean };
type AdminAlbum = { key: string; title: string; description: string; rows: any[]; coverUrl: string | null; photoCount: number; videoCount: number; heicCount: number };

const rowMediaUrl = (row: any): string => row.media_url || row.video_url || row.image_url || "";
const rowMediaType = (row: any): "imagen" | "video" => {
  const url = rowMediaUrl(row);
  return row.type === "video" || /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(url) || /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(url) ? "video" : "imagen";
};
const albumKeyForRow = (row: any): string => String(row.event_name || row.title || "Sin título").trim();

function groupAdminAlbums(rows: any[]): AdminAlbum[] {
  const grouped = new Map<string, any[]>();
  for (const row of rows) {
    const key = albumKeyForRow(row);
    grouped.set(key, [...(grouped.get(key) || []), row]);
  }
  return Array.from(grouped.entries()).map(([key, albumRows]) => {
    const photos = albumRows.filter((row) => rowMediaType(row) === "imagen");
    const coverRow = photos.find((row) => !isHeicUrl(rowMediaUrl(row))) || photos[0];
    return {
      key,
      title: key,
      description: albumRows.find((row) => row.description)?.description || "",
      rows: albumRows,
      coverUrl: coverRow ? rowMediaUrl(coverRow) : null,
      photoCount: photos.length,
      videoCount: albumRows.filter((row) => rowMediaType(row) === "video").length,
      heicCount: photos.filter((row) => isHeicUrl(rowMediaUrl(row))).length,
    };
  });
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const currentRole = profile?.role || "";
  const canManageUsers = profile?.role === "admin";
  const canPublishContent = currentRole === "admin" || currentRole === "comunicacion";
  const canAccessAdmin = ["admin", "capturista", "validador", "comunicacion", "entrenador"].includes(currentRole);
  
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
  const [newsVideoUrl, setNewsVideoUrl] = useState("");

  // Estados para Galería
  const [galleryRows, setGalleryRows] = useState<any[]>([]);
  const [galleryMode, setGalleryMode] = useState<"list" | "form">("list");
  const [editingAlbumKey, setEditingAlbumKey] = useState<string | null>(null);
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoDesc, setPhotoDesc] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [galleryMediaItems, setGalleryMediaItems] = useState<GalleryMediaDraft[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number; failed: number; label?: string } | null>(null);
  const adminAlbums = groupAdminAlbums(galleryRows);

  // Enlace de Moni (site_settings.moni_url)
  const [moniUrl, setMoniUrl] = useState("");

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
    if (authLoading) return;
    if (!profile || !canAccessAdmin) {
      router.replace("/login" as any);
      return;
    }
    loadStats();
    loadAdminContent();
  }, [authLoading, profile?.id, currentRole]);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab("dashboard");
    }
  }, [activeTab, availableTabs]);

  const loadStats = async () => {
    const { data, error } = await supabase.from("app_stats").select("*").maybeSingle();
    if (data && !error) setStats(data);
  };

  const loadGalleryRows = async () => {
    const { data, error } = await supabase.from("gallery_photos").select(GALLERY_ADMIN_COLUMNS).order("upload_date", { ascending: false }).limit(5000);
    if (error) {
      console.error("Error cargando galería:", error);
      return null;
    }
    setGalleryRows(data || []);
    return data || [];
  };

  const loadAdminContent = async () => {
    const role = profile?.role || "";
    if (role !== "admin" && role !== "comunicacion") return;

    const { data: newsData } = await supabase.from("news").select("*").order("created_at", { ascending: false }).limit(20);
    if (newsData) setRecentNews(newsData);

    await loadGalleryRows();

    const { data: sponsorData } = await supabase.from("sponsors").select("*").order("created_at", { ascending: false }).limit(30);
    if (sponsorData) setRecentSponsors(sponsorData);

    const { data: moniRow } = await supabase.from("site_settings").select("value").eq("key", "moni_url").maybeSingle();
    setMoniUrl(moniRow?.value || DEFAULT_SITE_SETTINGS.moniUrl);
  };

  const uploadImageToStorage = async (fileUri: string, compress = true): Promise<string | null> => {
    try {
      return await uploadMedia({ uri: fileUri, type: "imagen" }, { compress });
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      return null;
    }
  };

  const pickImage = async (type: "news" | "gallery" | "sponsor" | "sponsorPromo") => {
    const isGallery = type === "gallery";
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isGallery ? ["images", "videos"] : ["images"],
      allowsEditing: !isGallery, 
      allowsMultipleSelection: isGallery, 
      quality: 0.8,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      videoExportPreset: ImagePicker.VideoExportPreset.MediumQuality,
    });

    if (!result.canceled && result.assets.length > 0) {
      if (type === "news") {
        setNewsImage(result.assets[0].uri);
      } else if (type === "gallery") {
        const newItems: GalleryMediaDraft[] = result.assets
          .filter((asset) => Boolean(asset.uri))
          .map((asset) => {
            const inferredType =
              asset.type === "video" || asset.mimeType?.startsWith("video/") || /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(asset.uri)
                ? "video"
                : "imagen";
            return {
              uri: asset.uri,
              type: inferredType,
              name: asset.fileName ?? undefined,
              mimeType: asset.mimeType,
              size: asset.fileSize,
              file: asset.file,
            };
          });
        setGalleryMediaItems((prev) => [...prev, ...newItems]);
      } else if (type === "sponsor") {
        setSponsorLogo(result.assets[0].uri);
      } else if (type === "sponsorPromo") {
        setSponsorPromoImage(result.assets[0].uri);
      }
    }
  };

  const removeGalleryImage = (indexToRemove: number) => {
    setGalleryMediaItems(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewsTitle("");
    setNewsSummary("");
    setNewsContent("");
    setNewsCategory("Fundación");
    setNewsImage(null);
    setNewsVideoUrl("");
  };

  const selectNewsForEdit = (item: any) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title || "");
    setNewsSummary(item.summary || "");
    setNewsContent(item.content || "");
    setNewsCategory(item.category || "Fundación");
    setNewsImage(item.image_url || null);
    setNewsVideoUrl(item.video_url || "");
  };

  const fillAlbumForm = (album: AdminAlbum) => {
    setEditingAlbumKey(album.key);
    setPhotoTitle(album.title);
    setPhotoDesc(album.description);
    setVideoUrl("");
    setExistingMedia(
      album.rows
        .filter((row) => rowMediaUrl(row))
        .map((row) => ({ id: String(row.id), url: rowMediaUrl(row), type: rowMediaType(row), removed: false }))
    );
  };

  const startNewAlbum = () => {
    setEditingAlbumKey(null);
    setPhotoTitle("");
    setPhotoDesc("");
    setVideoUrl("");
    setExistingMedia([]);
    setGalleryMediaItems([]);
    setGalleryMode("form");
  };

  const openAlbumForEdit = (album: AdminAlbum) => {
    fillAlbumForm(album);
    setGalleryMediaItems([]);
    setGalleryMode("form");
  };

  const closeAlbumForm = () => {
    setEditingAlbumKey(null);
    setPhotoTitle("");
    setPhotoDesc("");
    setVideoUrl("");
    setExistingMedia([]);
    setGalleryMediaItems([]);
    setGalleryMode("list");
  };

  const toggleExistingMedia = (id: string) => {
    setExistingMedia((prev) => prev.map((item) => (item.id === id ? { ...item, removed: !item.removed } : item)));
  };

  const heicMedia = existingMedia.filter((item) => item.type === "imagen" && !item.removed && isHeicUrl(item.url));

  const handleConvertHeic = async () => {
    if (!canPublishContent) return Alert.alert("Sin permisos", "Tu rol no puede modificar la galería.");
    const pending = heicMedia;
    if (pending.length === 0) return;

    setUploading(true);
    let done = 0;
    let failed = 0;
    const converted = new Map<string, string>();
    setUploadProgress({ done, total: pending.length, failed, label: "Convirtiendo" });

    await runWithConcurrency(pending, 2, async (item) => {
      try {
        const newUrl = await reuploadHeicAsJpeg(item.url);
        const { data, error } = await supabase
          .from("gallery_photos")
          .update({ media_url: newUrl, image_url: newUrl })
          .eq("id", item.id)
          .select("id");
        if (error) throw error;
        if (!data?.length) throw new Error("Sin permiso para editar la galería.");
        converted.set(item.id, newUrl);
      } catch (error) {
        console.error("Error convirtiendo foto HEIC:", error);
        failed++;
      }
      done++;
      setUploadProgress({ done, total: pending.length, failed, label: "Convirtiendo" });
    });

    setExistingMedia((prev) => prev.map((item) => (converted.has(item.id) ? { ...item, url: converted.get(item.id)! } : item)));
    await loadGalleryRows();
    setUploading(false);
    setUploadProgress(null);

    if (failed === 0) {
      Alert.alert("Listo", `Se convirtieron ${converted.size} foto(s) a JPG. Ya se ven en cualquier celular o navegador.`);
    } else {
      Alert.alert(
        "Conversión incompleta",
        `Se convirtieron ${converted.size} y fallaron ${failed}. Vuelve a intentarlo; si sigue fallando, aplica la migración 202611110001_admin_gallery_attendance.sql.`
      );
    }
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
      video_url: newsVideoUrl.trim() || null,
    };

    let error;
    if (editingNewsId) {
      const { data, error: updateError } = await supabase.from("news").update(payload).eq("id", editingNewsId).select("id");
      error = updateError || (data?.length === 0 ? { message: "Tu usuario no tiene permiso para editar noticias. Aplica la migración 202611110001_admin_gallery_attendance.sql." } : null);
    } else {
      const { error: insertError } = await supabase.from("news").insert({ ...payload, author: "Administración Gallos" });
      error = insertError;
    }

    setUploading(false);
    if (!error) {
      Alert.alert("Éxito", editingNewsId ? "Noticia actualizada." : "Noticia publicada.");
      resetNewsForm();
      loadAdminContent();
    } else {
      Alert.alert("Error", error.message || "No se pudo guardar la noticia.");
    }
  };

  const handleSaveAlbum = async () => {
    if (!canPublishContent) return Alert.alert("Sin permisos", "Tu rol no puede subir multimedia.");
    const title = photoTitle.trim();
    const description = photoDesc.trim() || null;
    if (!title) return Alert.alert("Falta el nombre", "Escribe el nombre del álbum (por ejemplo, el torneo).");

    const videoUrls = videoUrl
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);
    const kept = existingMedia.filter((item) => !item.removed);
    const removed = existingMedia.filter((item) => item.removed);
    const drafts = galleryMediaItems;

    if (kept.length === 0 && drafts.length === 0 && videoUrls.length === 0) {
      return Alert.alert(
        "Álbum vacío",
        editingAlbumKey ? "Si quieres quitar todo el álbum usa el botón \"Eliminar álbum\"." : "Agrega fotos, videos o links de video al álbum."
      );
    }

    const oversizedVideo = drafts.find((item) => item.type === "video" && item.size && item.size > MAX_GALLERY_VIDEO_SIZE_BYTES);
    if (oversizedVideo) {
      return Alert.alert("Video demasiado pesado", `Un video seleccionado pesa más de ${MAX_GALLERY_VIDEO_SIZE_MB} MB. Para videos pesados usa YouTube o un link externo.`);
    }

    const permissionError = "Tu usuario no tiene permiso para modificar la galería. Aplica la migración 202611110001_admin_gallery_attendance.sql.";
    setUploading(true);
    const total = drafts.length + videoUrls.length;
    let done = 0;
    let failed = 0;
    const failedDrafts: GalleryMediaDraft[] = [];
    if (total > 0) setUploadProgress({ done, total, failed });

    try {
      if (removed.length > 0) {
        const { data, error } = await supabase.from("gallery_photos").delete().in("id", removed.map((item) => item.id)).select("id");
        if (error) throw error;
        if ((data?.length || 0) < removed.length) throw new Error(permissionError);
      }

      if (editingAlbumKey && kept.length > 0) {
        const { data, error } = await supabase
          .from("gallery_photos")
          .update({ title, description, event_name: title })
          .in("id", kept.map((item) => item.id))
          .select("id");
        if (error) throw error;
        if ((data?.length || 0) < kept.length) throw new Error(permissionError);
      }

      const insertRow = async (mediaUrl: string, mediaType: "imagen" | "video") => {
        const { error } = await supabase.from("gallery_photos").insert({
          title,
          description,
          type: mediaType,
          media_url: mediaUrl,
          video_url: mediaType === "video" ? mediaUrl : null,
          image_url: mediaUrl,
          event_name: title,
        });
        if (error) throw error;
      };

      await runWithConcurrency(drafts, UPLOAD_CONCURRENCY, async (draft) => {
        try {
          const mediaUrl = await uploadMedia(draft);
          await insertRow(mediaUrl, draft.type);
        } catch (error) {
          console.error("Error subiendo archivo de galería:", error);
          failedDrafts.push(draft);
          failed++;
        }
        done++;
        setUploadProgress({ done, total, failed });
      });

      for (const url of videoUrls) {
        try {
          await insertRow(url, "video");
        } catch (error) {
          console.error("Error guardando link de video:", error);
          failed++;
        }
        done++;
        setUploadProgress({ done, total, failed });
      }

      const freshRows = await loadGalleryRows();
      const uploaded = total - failed;

      if (failed === 0) {
        Alert.alert("Álbum guardado", total > 0 ? `Se agregaron ${uploaded} archivo(s) a "${title}".` : `"${title}" se actualizó.`);
        closeAlbumForm();
        return;
      }

      const savedAlbum = freshRows ? groupAdminAlbums(freshRows).find((album) => album.key === title) : undefined;
      if (savedAlbum) fillAlbumForm(savedAlbum);
      setGalleryMediaItems(failedDrafts);
      Alert.alert(
        "Algunos archivos no se subieron",
        `Se subieron ${uploaded} de ${total}. Los ${failed} que fallaron siguen en la lista: revisa tu conexión y toca "Guardar álbum" para reintentar.`
      );
    } catch (error: any) {
      console.error("Error al guardar álbum:", error);
      Alert.alert("Error", error?.message || "No se pudo guardar el álbum.");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const deleteAlbum = (album: AdminAlbum) => {
    Alert.alert("Eliminar álbum", `¿Eliminar "${album.title}" con sus ${album.rows.length} archivo(s)? Esta acción no se puede deshacer.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setUploading(true);
          const ids = album.rows.map((row) => row.id);
          const { data, error } = await supabase.from("gallery_photos").delete().in("id", ids).select("id");
          setUploading(false);
          if (error || (data?.length || 0) < ids.length) {
            Alert.alert("Error", error?.message || "Tu usuario no tiene permiso para eliminar. Aplica la migración 202611110001_admin_gallery_attendance.sql.");
          } else {
            Alert.alert("Álbum eliminado", `"${album.title}" ya no aparece en la galería.`);
            if (editingAlbumKey === album.key) closeAlbumForm();
          }
          loadGalleryRows();
        },
      },
    ]);
  };

  const handleSaveMoniUrl = async () => {
    const value = moniUrl.trim();
    if (value && !/^https?:\/\//i.test(value)) return Alert.alert("Link inválido", "El link debe empezar con https://");
    setUploading(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "moni_url", value, description: "Link para descargar Moni", is_public: true }, { onConflict: "key" });
    setUploading(false);
    if (error) Alert.alert("Error", error.message || "No se pudo guardar el link de Moni.");
    else Alert.alert("Listo", value ? "El botón de Moni ya aparece en la página principal y en Apoyar." : "Se quitó el botón de Moni.");
  };

  const handleSaveSponsor = async () => {
    if (!canPublishContent) return Alert.alert("Sin permisos", "Tu rol no puede administrar patrocinadores.");
    if (!sponsorName.trim()) return Alert.alert("Falta el nombre", "Escribe el nombre del patrocinador.");
    
    setUploading(true);
    let publicUrl = sponsorLogo;
    let promoUrl = sponsorPromoImage;

    if (sponsorLogo && !sponsorLogo.startsWith("http")) {
      const uploadedUrl = await uploadImageToStorage(sponsorLogo, false);
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
      name: sponsorName.trim(),
      level: sponsorLevel,
      description: sponsorDesc,
      contact_name: sponsorContact.trim() || null,
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
      Alert.alert("Error", error.message || "No se pudo guardar el patrocinador.");
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
            {canPublishContent && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>¿Qué quieres publicar?</Text>
                <View style={styles.quickGrid}>
                  <Pressable
                    style={[styles.quickBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      resetNewsForm();
                      setActiveTab("news");
                    }}
                  >
                    <Feather name="file-plus" size={22} color="#FFFFFF" />
                    <Text style={styles.quickBtnText}>Publicar noticia</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickBtn, { backgroundColor: "#EC4899" }]}
                    onPress={() => {
                      startNewAlbum();
                      setActiveTab("photos");
                    }}
                  >
                    <Feather name="folder-plus" size={22} color="#FFFFFF" />
                    <Text style={styles.quickBtnText}>Crear álbum</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickBtn, { backgroundColor: "#7C3AED" }]}
                    onPress={() => {
                      closeAlbumForm();
                      setActiveTab("photos");
                    }}
                  >
                    <Feather name="image" size={22} color="#FFFFFF" />
                    <Text style={styles.quickBtnText}>Editar álbumes / agregar fotos</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {currentRole !== "entrenador" && (
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
            )}

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
            <View style={styles.tabHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, flex: 1 }]}>
                {editingNewsId ? "Editar noticia" : "Publicar nueva noticia"}
              </Text>
              {editingNewsId && (
                <Pressable style={[styles.smallBtn, { backgroundColor: colors.primary }]} onPress={resetNewsForm}>
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <Text style={styles.smallBtnText}>Nueva noticia</Text>
                </Pressable>
              )}
            </View>
            
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

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Video de la noticia</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="URL de YouTube, Vimeo o video externo"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="url"
                autoCapitalize="none"
                value={newsVideoUrl}
                onChangeText={setNewsVideoUrl}
              />
            </View>

            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.7 : 1 }]} onPress={handlePublishNews} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingNewsId ? "Guardar Cambios" : "Publicar Noticia"}</Text>}
            </Pressable>
            
            {editingNewsId && (
              <Pressable style={{ alignItems: "center", marginTop: 10 }} onPress={resetNewsForm}>
                <Text style={{ color: colors.primary }}>Cancelar edición</Text>
              </Pressable>
            )}

            <View style={styles.listContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 10 }]}>Noticias publicadas (toca una para editarla)</Text>
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
        {activeTab === "photos" && canPublishContent && galleryMode === "list" && (
          <View style={styles.formSection}>
            <View style={styles.tabHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Álbumes de la galería</Text>
                <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                  Cada álbum aparece como una tarjeta en la galería pública. Toca "Editar" para cambiar el nombre, agregar más fotos o quitar algunas.
                </Text>
              </View>
              <Pressable style={[styles.smallBtn, { backgroundColor: colors.primary }]} onPress={startNewAlbum}>
                <Feather name="folder-plus" size={16} color="#FFFFFF" />
                <Text style={styles.smallBtnText}>Nuevo álbum</Text>
              </Pressable>
            </View>

            {adminAlbums.length === 0 && (
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Aún no hay álbumes. Crea el primero con "Nuevo álbum".</Text>
            )}

            {adminAlbums.map((album) => (
              <View key={album.key} style={[styles.albumCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {album.coverUrl && !(Platform.OS === "web" && isHeicUrl(album.coverUrl)) ? (
                  <Image source={{ uri: album.coverUrl }} style={styles.albumCover} />
                ) : (
                  <View style={[styles.albumCover, { alignItems: "center", justifyContent: "center", backgroundColor: colors.primary + "15" }]}>
                    <Feather name={album.photoCount > 0 ? "image" : "play-circle"} size={26} color={colors.primary} />
                  </View>
                )}
                <View style={styles.albumInfo}>
                  <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={2}>{album.title}</Text>
                  <Text style={[styles.listDate, { color: colors.mutedForeground }]}>
                    {album.photoCount} foto(s){album.videoCount ? ` · ${album.videoCount} video(s)` : ""}
                  </Text>
                  {album.heicCount > 0 && Platform.OS === "web" && (
                    <Text style={[styles.listDate, { color: "#B45309" }]}>{album.heicCount} foto(s) HEIC no se ven en Android/Chrome: entra a Editar para convertirlas.</Text>
                  )}
                  <View style={styles.albumActions}>
                    <Pressable style={[styles.albumActionBtn, { backgroundColor: colors.primary }]} onPress={() => openAlbumForEdit(album)}>
                      <Feather name="edit-2" size={14} color="#FFFFFF" />
                      <Text style={styles.smallBtnText}>Editar / agregar fotos</Text>
                    </Pressable>
                    <Pressable style={[styles.albumActionBtn, { backgroundColor: "#FEE2E2" }]} onPress={() => deleteAlbum(album)} disabled={uploading}>
                      <Feather name="trash-2" size={14} color="#B91C1C" />
                      <Text style={[styles.smallBtnText, { color: "#B91C1C" }]}>Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "photos" && canPublishContent && galleryMode === "form" && (
          <View style={styles.formSection}>
            <Pressable style={styles.backLink} onPress={closeAlbumForm} disabled={uploading}>
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Volver a los álbumes</Text>
            </Pressable>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {editingAlbumKey ? `Editar álbum: ${editingAlbumKey}` : "Nuevo álbum"}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre del álbum *</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="Ej. Torneo Nacional Querétaro 2026" placeholderTextColor={colors.mutedForeground} value={photoTitle} onChangeText={setPhotoTitle} />
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                Si le pones exactamente el mismo nombre que otro álbum, se juntan en uno solo.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Descripción (opcional)</Text>
              <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} placeholder="¿Qué sucedió en este torneo o evento?" placeholderTextColor={colors.mutedForeground} value={photoDesc} onChangeText={setPhotoDesc} />
            </View>

            {existingMedia.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  Fotos actuales ({existingMedia.filter((item) => !item.removed).length})
                </Text>
                <Text style={[styles.helperText, { color: colors.mutedForeground }]}>Toca una foto para marcarla y quitarla al guardar. Tócala otra vez para conservarla.</Text>
                {heicMedia.length > 0 && Platform.OS === "web" && (
                  <View style={styles.heicBox}>
                    <Text style={styles.heicTitle}>{heicMedia.length} foto(s) están en formato HEIC de iPhone</Text>
                    <Text style={styles.heicText}>
                      Ese formato no se ve en Chrome ni en Android (salen en blanco). Conviértelas a JPG una sola vez para que todos las vean.
                    </Text>
                    <Pressable style={[styles.albumActionBtn, { backgroundColor: "#B45309", alignSelf: "flex-start" }]} onPress={handleConvertHeic} disabled={uploading}>
                      <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                      <Text style={styles.smallBtnText}>Convertir {heicMedia.length} a JPG</Text>
                    </Pressable>
                  </View>
                )}
                <View style={styles.thumbGrid}>
                  {existingMedia.map((item) => (
                    <Pressable key={item.id} style={styles.thumbnailContainer} onPress={() => toggleExistingMedia(item.id)}>
                      {item.type === "imagen" && Platform.OS === "web" && isHeicUrl(item.url) ? (
                        <View style={[styles.thumbnailImage, { backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center", opacity: item.removed ? 0.25 : 1 }]}>
                          <Text style={styles.heicTag}>HEIC</Text>
                        </View>
                      ) : item.type === "imagen" ? (
                        <Image source={{ uri: item.url }} style={[styles.thumbnailImage, item.removed && { opacity: 0.25 }]} />
                      ) : (
                        <View style={[styles.thumbnailImage, { backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center", opacity: item.removed ? 0.25 : 1 }]}>
                          <Feather name="play-circle" size={26} color={colors.primary} />
                        </View>
                      )}
                      <View style={[styles.removeBadge, { backgroundColor: item.removed ? "#059669" : "#EF4444" }]}>
                        <Feather name={item.removed ? "rotate-ccw" : "x"} size={14} color="#FFF" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                {editingAlbumKey ? "Fotos y videos nuevos" : "Fotos y videos"} ({galleryMediaItems.length})
              </Text>
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                Puedes seleccionar muchas a la vez. Las fotos se reducen automáticamente para que suban rápido, y después siempre puedes volver a este álbum para agregar más.
              </Text>

              {galleryMediaItems.length > 0 && (
                <View style={styles.thumbGrid}>
                  {galleryMediaItems.slice(0, MAX_PREVIEW_THUMBS).map((item, index) => (
                    <View key={`${item.uri}-${index}`} style={styles.thumbnailContainer}>
                      {item.type === "imagen" ? (
                        <Image source={{ uri: item.uri }} style={styles.thumbnailImage} />
                      ) : (
                        <View style={[styles.thumbnailImage, { backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }]}>
                          <Feather name="play-circle" size={26} color={colors.primary} />
                          {item.size ? (
                            <Text style={[styles.videoSizeText, { color: colors.primary }]}>
                              {(item.size / 1024 / 1024).toFixed(1)} MB
                            </Text>
                          ) : null}
                        </View>
                      )}
                      {!uploading && (
                        <Pressable style={styles.removeBadge} onPress={() => removeGalleryImage(index)}>
                          <Feather name="x" size={14} color="#FFF" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                  {galleryMediaItems.length > MAX_PREVIEW_THUMBS && (
                    <View style={[styles.thumbnailContainer, styles.moreThumb, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>+{galleryMediaItems.length - MAX_PREVIEW_THUMBS}</Text>
                    </View>
                  )}
                </View>
              )}

              <Pressable
                style={[styles.imageBtn, { height: galleryMediaItems.length > 0 ? 90 : 160, borderColor: colors.border, backgroundColor: colors.card }]}
                onPress={() => pickImage("gallery")}
                disabled={uploading}
              >
                <Feather name="plus-circle" size={28} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>
                  {galleryMediaItems.length > 0 ? "Agregar más fotos o videos" : "Toca para seleccionar fotos y videos"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Links de video (opcional)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="https://youtube.com/... (separa varios con coma)"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="url"
                autoCapitalize="none"
                value={videoUrl}
                onChangeText={setVideoUrl}
              />
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                Recomendado para videos pesados. Los archivos de video deben pesar menos de {MAX_GALLERY_VIDEO_SIZE_MB} MB.
              </Text>
            </View>

            {uploadProgress && (
              <View style={[styles.progressBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {uploadProgress.label || "Subiendo"} {uploadProgress.done} de {uploadProgress.total}...
                  {uploadProgress.failed > 0 ? ` (${uploadProgress.failed} con error)` : ""}
                </Text>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.round((uploadProgress.done / Math.max(uploadProgress.total, 1)) * 100)}%` }]} />
                </View>
                <Text style={[styles.helperText, { color: colors.mutedForeground }]}>No cierres esta página hasta que termine.</Text>
              </View>
            )}

            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.7 : 1 }]} onPress={handleSaveAlbum} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingAlbumKey ? "Guardar álbum" : "Publicar álbum"}</Text>}
            </Pressable>

            {editingAlbumKey && (
              <Pressable
                style={{ alignItems: "center", marginTop: 6 }}
                disabled={uploading}
                onPress={() => {
                  const album = adminAlbums.find((item) => item.key === editingAlbumKey);
                  if (album) deleteAlbum(album);
                }}
              >
                <Text style={{ color: "#B91C1C", fontFamily: "Inter_600SemiBold" }}>Eliminar álbum</Text>
              </Pressable>
            )}
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
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Nombre del contacto (interno, opcional)</Text>
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
              <Text style={[styles.inputLabel, { color: colors.foreground, marginTop: 10 }]}>Patrocinadores (toca uno para editarlo)</Text>
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

            <View style={[styles.moniBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Botón "Descargar Moni"</Text>
              <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                Pega el link de descarga de Moni. El botón aparece en "¿Quieres apoyar a Gallos Smiling?" y en la página Apoyar. Déjalo vacío para ocultarlo.
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="https://..."
                placeholderTextColor={colors.mutedForeground}
                keyboardType="url"
                autoCapitalize="none"
                value={moniUrl}
                onChangeText={setMoniUrl}
              />
              <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.7 : 1 }]} onPress={handleSaveMoniUrl} disabled={uploading}>
                <Text style={styles.submitBtnText}>Guardar link de Moni</Text>
              </Pressable>
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
  helperText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
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
  videoSizeText: { fontSize: 11, fontFamily: "Inter_700Bold", marginTop: 4 },
  removeBadge: { position: "absolute", top: -6, right: -6, backgroundColor: "#EF4444", width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  thumbGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 6 },
  moreThumb: { borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: { flexGrow: 1, flexBasis: 150, minHeight: 84, borderRadius: 14, padding: 14, gap: 8, justifyContent: "center" },
  quickBtnText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_700Bold" },
  tabHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  smallBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 },
  albumCard: { flexDirection: "row", gap: 12, padding: 10, borderWidth: 1, borderRadius: 14 },
  albumCover: { width: 96, height: 96, borderRadius: 10, backgroundColor: "#ccc" },
  albumInfo: { flex: 1, gap: 4, justifyContent: "center" },
  albumActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  albumActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  progressBox: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 },
  progressTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5 },
  moniBox: { marginTop: 20, borderWidth: 1, borderRadius: 14, padding: 16, gap: 10 },
  heicBox: { borderWidth: 1, borderColor: "#FCD34D", backgroundColor: "#FFFBEB", borderRadius: 12, padding: 12, gap: 8, marginBottom: 10 },
  heicTitle: { color: "#92400E", fontFamily: "Inter_700Bold", fontSize: 14 },
  heicText: { color: "#92400E", fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18 },
  heicTag: { color: "#B45309", fontFamily: "Inter_700Bold", fontSize: 12 },
  
  // Estilos de la lista de edición
  listContainer: { marginTop: 12, gap: 10 },
  listItem: { flexDirection: "row", alignItems: "center", padding: 10, borderWidth: 1, borderRadius: 12, gap: 12 },
  listImg: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#ccc" },
  listInfo: { flex: 1, gap: 4 },
  listTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  listDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  editIconBtn: { padding: 8, borderRadius: 8 },
});

