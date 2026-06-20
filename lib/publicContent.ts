import { formatDisplayDate, mapGalleryItem, mapNews, mapSponsor, type GalleryItem, type NewsArticle, type Sponsor } from "@/lib/appData";
import { supabase } from "@/lib/supabase";

export type PublicStatus = "borrador" | "publicada" | "archivada" | "activa" | "pausada" | "finalizada" | string;

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  imageUrl?: string | null;
  status: PublicStatus;
  goal?: string | null;
  date: string;
  isFeatured: boolean;
}

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  eventDate: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  status: PublicStatus;
  isFeatured: boolean;
}

export interface SiteSettings {
  impactBeneficiaries: number;
  impactCampaigns: number;
  impactEvents: number;
  aboutStory: string;
  mission: string;
  vision: string;
  values: string[];
  whatsappUrl: string;
  email: string;
  phone: string;
  serviceArea: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  impactBeneficiaries: 0,
  impactCampaigns: 0,
  impactEvents: 0,
  aboutStory:
    "Gallos Smiling acompana a beneficiarios y familias con actividades, comunicacion institucional y seguimiento basico de documentacion.",
  mission:
    "Impulsar oportunidades, comunidad y bienestar mediante programas institucionales, deportivos y de acompanamiento.",
  vision:
    "Ser una fundacion cercana, transparente y confiable para familias, aliados y patrocinadores.",
  values: ["Transparencia", "Cercania", "Respeto", "Comunidad", "Responsabilidad"],
  whatsappUrl: "https://wa.me/524421234567",
  email: "contacto@gallossmiling.org",
  phone: "+52 442 123 4567",
  serviceArea: "Queretaro y zona metropolitana",
};

export const FALLBACK_CAMPAIGNS: Campaign[] = [
  {
    id: "programa-institucional",
    title: "Programa institucional Gallos Smiling",
    slug: "programa-institucional",
    description: "Acompanamiento, actividades y seguimiento basico para beneficiarios vinculados a la fundacion.",
    content: "Un programa permanente para mantener comunicacion clara con tutores, beneficiarios y equipo interno.",
    imageUrl: null,
    status: "activa",
    goal: "Fortalecer la continuidad de cada beneficiario.",
    date: "Activa",
    isFeatured: true,
  },
  {
    id: "comunidad-y-actividades",
    title: "Comunidad y actividades",
    slug: "comunidad-y-actividades",
    description: "Eventos, convivencia y contenido publico para compartir el impacto de Gallos Smiling.",
    content: "Campana enfocada en visibilizar actividades, eventos y aliados de la fundacion.",
    imageUrl: null,
    status: "activa",
    goal: "Crear una comunidad informada y participativa.",
    date: "Activa",
    isFeatured: false,
  },
];

export const FALLBACK_EVENTS: PublicEvent[] = [
  {
    id: "agenda-gallos-smiling",
    title: "Agenda Gallos Smiling",
    slug: "agenda-gallos-smiling",
    description: "Consulta proximamente las actividades publicas, campanas y encuentros de la fundacion.",
    location: "Queretaro",
    eventDate: "Proximamente",
    imageUrl: null,
    videoUrl: null,
    status: "activa",
    isFeatured: true,
  },
];

function mapCampaign(row: any): Campaign {
  return {
    id: String(row.id),
    title: row.title ?? row.name ?? "Campana",
    slug: row.slug ?? String(row.id),
    description: row.description ?? row.summary ?? "",
    content: row.content ?? row.description ?? "",
    imageUrl: row.image_url ?? row.storage_path ?? null,
    status: row.status ?? "activa",
    goal: row.goal ?? row.objective ?? null,
    date: formatDisplayDate(row.start_date ?? row.created_at),
    isFeatured: Boolean(row.is_featured),
  };
}

function mapPublicEvent(row: any): PublicEvent {
  return {
    id: String(row.id),
    title: row.title ?? row.name ?? "Evento",
    slug: row.slug ?? String(row.id),
    description: row.description ?? row.content ?? "",
    location: row.location ?? row.venue ?? "",
    eventDate: formatDisplayDate(row.event_date ?? row.date ?? row.created_at),
    imageUrl: row.image_url ?? row.storage_path ?? null,
    videoUrl: row.video_url ?? null,
    status: row.status ?? "publicada",
    isFeatured: Boolean(row.is_featured),
  };
}

function mapSiteSettings(rows: any[] | null | undefined): SiteSettings {
  const settings = { ...DEFAULT_SITE_SETTINGS };
  for (const row of rows || []) {
    const key = row.key ?? row.name;
    const value = row.value ?? row.content;
    if (key === "impact_beneficiaries") settings.impactBeneficiaries = Number(value || 0);
    if (key === "impact_campaigns") settings.impactCampaigns = Number(value || 0);
    if (key === "impact_events") settings.impactEvents = Number(value || 0);
    if (key === "about_story") settings.aboutStory = String(value || settings.aboutStory);
    if (key === "mission") settings.mission = String(value || settings.mission);
    if (key === "vision") settings.vision = String(value || settings.vision);
    if (key === "values") settings.values = String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    if (key === "whatsapp_url") settings.whatsappUrl = String(value || settings.whatsappUrl);
    if (key === "email") settings.email = String(value || settings.email);
    if (key === "phone") settings.phone = String(value || settings.phone);
    if (key === "service_area") settings.serviceArea = String(value || settings.serviceArea);
  }
  return settings;
}

export async function loadPublicBundle() {
  const [newsRes, galleryRes, sponsorsRes, campaignsRes, eventsRes, settingsRes] = await Promise.all([
    supabase.from("news").select("*").order("created_at", { ascending: false }).limit(6),
    supabase.from("gallery_photos").select("*, tournaments(name)").order("upload_date", { ascending: false }).limit(8),
    supabase.from("sponsors").select("*").limit(8),
    supabase.from("campaigns").select("*").in("status", ["activa", "publicada"]).order("created_at", { ascending: false }).limit(6),
    supabase.from("events").select("*").order("event_date", { ascending: true }).limit(6),
    supabase.from("site_settings").select("*"),
  ]);

  return {
    news: (newsRes.data || []).map(mapNews) as NewsArticle[],
    gallery: (galleryRes.data || []).map(mapGalleryItem).filter((item: GalleryItem) => Boolean(item.mediaUrl)),
    sponsors: (sponsorsRes.data || []).map(mapSponsor) as Sponsor[],
    campaigns: campaignsRes.error ? FALLBACK_CAMPAIGNS : (campaignsRes.data || []).map(mapCampaign),
    events: eventsRes.error ? FALLBACK_EVENTS : (eventsRes.data || []).map(mapPublicEvent),
    settings: settingsRes.error ? DEFAULT_SITE_SETTINGS : mapSiteSettings(settingsRes.data),
  };
}

export async function loadCampaigns() {
  const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
  return error ? FALLBACK_CAMPAIGNS : (data || []).map(mapCampaign);
}

export async function loadEvents() {
  const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
  return error ? FALLBACK_EVENTS : (data || []).map(mapPublicEvent);
}

export async function loadSettings() {
  const { data, error } = await supabase.from("site_settings").select("*");
  return error ? DEFAULT_SITE_SETTINGS : mapSiteSettings(data);
}
