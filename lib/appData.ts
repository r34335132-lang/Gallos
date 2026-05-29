export type UserRole =
  | "admin"
  | "capturista"
  | "validador"
  | "comunicacion"
  | "tutor"
  | "patrocinador"
  | "visitante";

export const ADMIN_ROLES: UserRole[] = [
  "admin",
  "capturista",
  "validador",
  "comunicacion",
];

export const STAFF_ROLES: { value: Exclude<UserRole, "tutor" | "patrocinador" | "visitante">; label: string }[] = [
  { value: "comunicacion", label: "Comunicación" },
  { value: "capturista", label: "Capturista" },
  { value: "validador", label: "Validador" },
  { value: "admin", label: "Administrador" },
];

export type NewsCategory =
  | "Fundación"
  | "Club Gallos Blancos"
  | "Beneficiarios"
  | "Eventos"
  | "Comunicados oficiales"
  | "Patrocinadores"
  | "Historias de impacto"
  | "Apoyos entregados"
  | string;

export interface NewsArticle {
  id: string;
  title: string;
  category: NewsCategory;
  date: string;
  author: string;
  summary: string;
  content: string;
  image?: string | null;
}

export type CommPriority = "importante" | "informativo" | "urgente" | string;

export interface Communication {
  id: string;
  title: string;
  date: string;
  category: string;
  priority: CommPriority;
  content: string;
}

export type SponsorLevel =
  | "Oro"
  | "Plata"
  | "Bronce"
  | "Donador recurrente"
  | "Donador único"
  | "Benefactor principal"
  | "Apoyo en especie"
  | string;

export interface Sponsor {
  id: string;
  name: string;
  level: SponsorLevel;
  description: string;
  contact: string;
  phone: string;
  email: string;
  status: "activo" | "inactivo" | string;
  beneficiaries: number;
  startDate: string;
  logo?: string | null;
}

export type BeneficiaryStatus =
  | "pendiente"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "activo"
  | "inactivo"
  | string;

export interface Beneficiary {
  id: string;
  folio: string;
  name: string;
  birthDate: string;
  age: number | null;
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
  status: BeneficiaryStatus;
  tutorId: string | null;
  tutorName: string;
  registrationDate: string;
  photo?: string | null;
  supportType: string;
  notes?: string | null;
}

export type DocStatus =
  | "pendiente"
  | "validado"
  | "aprobado"
  | "rechazado"
  | "requiere_correccion"
  | "faltante"
  | string;

export interface AppDocument {
  id: string;
  beneficiaryId: string;
  name: string;
  type: string;
  status: DocStatus;
  uploadDate?: string | null;
  adminComment?: string | null;
}

export interface Stats {
  totalBeneficiaries: number;
  disabledChildren: number;
  activeRecords: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingDocuments: number;
  activeSponsors: number;
  activeDonors: number;
  supportDelivered: number;
  familiesHelped: number;
}

export interface AppNotification {
  id: string;
  type: "success" | "error" | "info" | "warning" | string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export const EMPTY_STATS: Stats = {
  totalBeneficiaries: 0,
  disabledChildren: 0,
  activeRecords: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  pendingDocuments: 0,
  activeSponsors: 0,
  activeDonors: 0,
  supportDelivered: 0,
  familiesHelped: 0,
};

export const MUNICIPALITIES = [
  "Querétaro",
  "El Marqués",
  "Corregidora",
  "San Juan del Río",
  "Tequisquiapan",
];

export const ZONES = ["Norte", "Sur", "Este", "Oeste", "Centro"];

// --- TIPOS DE DISCAPACIDAD LIMITADOS A 2 ---
export const DISABILITY_TYPES = [
  "Síndrome de Down",
  "Intelectual",
];

export const SUPPORT_TYPES = [
  "Equipo médico",
  "Auxiliar auditivo",
  "Material educativo",
  "Terapia",
  "Apoyo económico",
  "Apoyo en especie",
  "Apoyo médico",
  "Terapia y equipo",
  "Apoyo educativo",
];

export const REQUIRED_DOC_TYPES = [
  "Firma carta responsiva",
  "Carta de uso de imagen",
  "Acta de nacimiento",
  "Certificado médico",
  "Identificación papá o tutor",
  "Comprobante domicilio",
  "Foto del hijo/hija"
];

export const CONSENT_DOCUMENTS = [] as const;

export const ALL_DOC_TYPES = [
  ...REQUIRED_DOC_TYPES
];

export function isAdminRole(role?: string | null) {
  return ADMIN_ROLES.includes(role as UserRole);
}

export function getConsentByNameOrType(value?: string | null) {
  return CONSENT_DOCUMENTS.find((doc) => (doc as any).name === value || (doc as any).type === value);
}

export function formatDisplayDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function mapNews(row: any): NewsArticle {
  return {
    id: String(row.id),
    title: row.title ?? "Sin título",
    category: row.category ?? "Fundación",
    date: formatDisplayDate(row.published_at ?? row.publication_date ?? row.created_at ?? row.date),
    author: row.author ?? "Comunicación Gallos Smiling",
    summary: row.summary ?? row.excerpt ?? "",
    content: row.content ?? row.body ?? row.summary ?? "",
    image: row.image_url ?? row.image ?? null,
  };
}

export function mapCommunication(row: any): Communication {
  return {
    id: String(row.id),
    title: row.title ?? "Comunicado",
    date: formatDisplayDate(row.published_at ?? row.created_at ?? row.date),
    category: row.category ?? "General",
    priority: row.priority ?? "informativo",
    content: row.content ?? row.body ?? "",
  };
}

export function mapSponsor(row: any): Sponsor {
  return {
    id: String(row.id),
    name: row.name ?? "Patrocinador",
    level: row.level ?? "Apoyo en especie",
    description: row.description ?? "",
    contact: row.contact ?? row.contact_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    status: row.status ?? "activo",
    beneficiaries: Number(row.beneficiaries ?? row.beneficiary_count ?? 0),
    startDate: row.startDate ?? row.start_date ?? formatDisplayDate(row.created_at),
    logo: row.logo_url ?? row.logo ?? null,
  };
}

export function mapBeneficiary(row: any): Beneficiary {
  return {
    id: String(row.id),
    folio: row.folio ?? "",
    name: row.name ?? "Beneficiario",
    birthDate: row.birthDate ?? row.birth_date ?? "",
    age: typeof row.age === "number" ? row.age : row.age ? Number(row.age) : null,
    curp: row.curp ?? "",
    gender: row.gender ?? "",
    municipality: row.municipality ?? "",
    zone: row.zone ?? "",
    address: row.address ?? "",
    school: row.school ?? "",
    gradeLevel: row.gradeLevel ?? row.grade_level ?? "",
    disabilityType: row.disabilityType ?? row.disability_type ?? "",
    diagnosis: row.diagnosis ?? "",
    needs: row.needs ?? "",
    status: row.status ?? "pendiente",
    tutorId: row.tutorId ?? row.tutor_id ?? null,
    tutorName: row.tutorName ?? row.tutor_name ?? "",
    registrationDate: row.registrationDate ?? row.registration_date ?? formatDisplayDate(row.created_at),
    photo: row.photo ?? row.photo_url ?? null,
    supportType: row.supportType ?? row.support_type ?? "",
    notes: row.notes ?? null,
  };
}

export function mapDocument(row: any): AppDocument {
  return {
    id: String(row.id),
    beneficiaryId: row.beneficiaryId ?? row.beneficiary_id ?? "",
    name: row.name ?? row.document_type ?? "Documento",
    type: row.type ?? row.document_type ?? row.name ?? "",
    status: row.status ?? "pendiente",
    uploadDate: row.uploadDate ?? row.upload_date ?? null,
    adminComment: row.adminComment ?? row.admin_comment ?? null,
  };
}

export function mapStats(row: any): Stats {
  return {
    totalBeneficiaries: Number(row?.total_beneficiaries ?? row?.totalBeneficiaries ?? 0),
    disabledChildren: Number(row?.disabled_children ?? row?.disabledChildren ?? 0),
    activeRecords: Number(row?.active_records ?? row?.activeRecords ?? 0),
    pendingRequests: Number(row?.pending_requests ?? row?.pendingRequests ?? 0),
    approvedRequests: Number(row?.approved_requests ?? row?.approvedRequests ?? 0),
    rejectedRequests: Number(row?.rejected_requests ?? row?.rejectedRequests ?? 0),
    pendingDocuments: Number(row?.pending_documents ?? row?.pendingDocuments ?? 0),
    activeSponsors: Number(row?.active_sponsors ?? row?.activeSponsors ?? 0),
    activeDonors: Number(row?.active_donors ?? row?.activeDonors ?? 0),
    supportDelivered: Number(row?.support_delivered ?? row?.supportDelivered ?? 0),
    familiesHelped: Number(row?.families_helped ?? row?.familiesHelped ?? 0),
  };
}

export function deriveStats(
  beneficiaries: Beneficiary[],
  documents: AppDocument[] = [],
  sponsors: Sponsor[] = []
): Stats {
  const approved = beneficiaries.filter((b) => b.status === "aprobado" || b.status === "activo");
  const activeSponsors = sponsors.filter((s) => s.status === "activo").length;
  const pendingDocuments = documents.filter((doc) =>
    ["pendiente", "requiere_correccion", "rechazado"].includes(doc.status)
  ).length;

  return {
    totalBeneficiaries: beneficiaries.length,
    disabledChildren: beneficiaries.length,
    activeRecords: beneficiaries.filter((b) => b.status === "activo").length,
    pendingRequests: beneficiaries.filter((b) => b.status === "pendiente" || b.status === "en_revision").length,
    approvedRequests: approved.length,
    rejectedRequests: beneficiaries.filter((b) => b.status === "rechazado").length,
    pendingDocuments,
    activeSponsors,
    activeDonors: sponsors.filter((s) => s.status === "activo" && s.level?.toLowerCase().includes("donador")).length,
    supportDelivered: approved.length,
    familiesHelped: new Set(beneficiaries.map((b) => b.tutorId || b.tutorName || b.id)).size,
  };
}

export function mapNotification(row: any): AppNotification {
  return {
    id: String(row.id),
    type: row.type ?? row.level ?? "info",
    title: row.title ?? "Notificación",
    body: row.body ?? row.message ?? row.content ?? "",
    time: formatDisplayDate(row.created_at ?? row.time),
    read: Boolean(row.read ?? row.is_read),
  };
}