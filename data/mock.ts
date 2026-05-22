export type NewsCategory =
  | "Fundación"
  | "Club Gallos Blancos"
  | "Beneficiarios"
  | "Eventos"
  | "Comunicados oficiales"
  | "Patrocinadores"
  | "Historias de impacto"
  | "Apoyos entregados";

export interface NewsArticle {
  id: string;
  title: string;
  category: NewsCategory;
  date: string;
  author: string;
  summary: string;
  content: string;
  image: string;
}

export type CommPriority = "importante" | "informativo" | "urgente";

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
  | "Apoyo en especie";

export interface Sponsor {
  id: string;
  name: string;
  level: SponsorLevel;
  description: string;
  contact: string;
  phone: string;
  email: string;
  status: "activo" | "inactivo";
  beneficiaries: number;
  startDate: string;
}

export type BeneficiaryStatus =
  | "pendiente"
  | "en_revision"
  | "aprobado"
  | "rechazado"
  | "activo"
  | "inactivo";

export interface Beneficiary {
  id: string;
  folio: string;
  name: string;
  birthDate: string;
  age: number;
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
  tutorId: string;
  tutorName: string;
  registrationDate: string;
  photo?: string;
  supportType: string;
  notes?: string;
}

export type DocStatus = "pendiente" | "validado" | "rechazado" | "requiere_correccion";

export interface Document {
  id: string;
  beneficiaryId: string;
  name: string;
  type: string;
  status: DocStatus;
  uploadDate?: string;
  adminComment?: string;
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

export const NEWS: NewsArticle[] = [
  {
    id: "n1",
    title: "Gallos Blancos entrega apoyos a 30 familias queretanas",
    category: "Apoyos entregados",
    date: "12 May 2026",
    author: "Comunicación Gallos Smiling",
    summary:
      "En un emotivo evento en el Estadio La Corregidora, el equipo y la fundación hicieron entrega de apoyos económicos y en especie a 30 familias beneficiarias.",
    content:
      "En un emotivo evento celebrado en las instalaciones del Estadio La Corregidora, jugadores y directivos del Club Gallos Blancos, junto con la Fundación Gallos Smiling, hicieron entrega de apoyos económicos y en especie a 30 familias queretanas en situación de vulnerabilidad.\n\nLos apoyos incluyeron despensas, sillas de ruedas, prótesis auditivas y becas educativas para niños con discapacidad. El evento contó con la presencia de patrocinadores principales y autoridades municipales.\n\n\"Este es el verdadero partido que ganamos cada día\", declaró el director de la fundación. \"Cada familia que apoyamos representa nuestra mayor victoria.\"\n\nLa fundación tiene programado continuar con jornadas de apoyo durante los próximos meses, con el objetivo de alcanzar a 100 familias antes de fin de año.",
    image: "news_1",
  },
  {
    id: "n2",
    title: "Nueva campaña de registro para niños con discapacidad motriz",
    category: "Fundación",
    date: "8 May 2026",
    author: "Área de Comunicación",
    summary:
      "La Fundación Gallos Smiling abre su período de registro para beneficiarios con discapacidad motriz en los municipios de Querétaro, El Marqués y Corregidora.",
    content:
      "La Fundación Gallos Smiling anuncia la apertura de su nueva campaña de registro para niños y jóvenes con discapacidad motriz en los municipios de Querétaro, El Marqués y Corregidora.\n\nEl proceso de registro es completamente gratuito y puede realizarse directamente en la aplicación móvil Gallos Smiling o en las oficinas de la fundación ubicadas en el centro histórico de Querétaro.\n\nLos documentos necesarios incluyen acta de nacimiento, CURP, comprobante médico del diagnóstico y comprobante de domicilio. Los tutores o padres de familia pueden iniciar el proceso en esta misma aplicación.\n\nLa campaña estará abierta durante todo el mes de mayo. Los expedientes serán revisados y los beneficiarios seleccionados recibirán notificación directa.",
    image: "news_2",
  },
  {
    id: "n3",
    title: "Gallos Blancos gana 2-0 y dedica victoria a sus beneficiarios",
    category: "Club Gallos Blancos",
    date: "5 May 2026",
    author: "Prensa Deportiva",
    summary:
      "En un partido memorable, el equipo dedicó su victoria al trabajo de la fundación y convocó a los aficionados a sumarse como donadores.",
    content:
      "Los Gallos Blancos de Querétaro derrotaron 2-0 al Club América en un partido vibrante que fue dedicado especialmente a los niños beneficiarios de la Fundación Gallos Smiling.\n\nAl finalizar el encuentro, el capitán del equipo portó una camiseta con el logo de la fundación y convocó a los aficionados presentes a sumarse como donadores o voluntarios.\n\n\"Cuando uno ve a esos niños sonreír, entiende para qué se juega al futbol\", expresó el delantero al término del partido.\n\nLa campaña de donación lanzada en redes sociales tras el partido recaudó en 24 horas más de 150,000 pesos que serán destinados al programa de apoyos.",
    image: "news_1",
  },
  {
    id: "n4",
    title: "Historia de impacto: Valentina, de la silla a la cancha",
    category: "Historias de impacto",
    date: "1 May 2026",
    author: "Área de Comunicación",
    summary:
      "Valentina, de 9 años, recibió su silla de ruedas adaptada gracias a la Fundación Gallos Smiling y hoy practica básquetbol adaptado.",
    content:
      "Valentina tiene 9 años y una sonrisa que ilumina cualquier habitación. Hace un año, su familia no tenía los recursos para adquirir una silla de ruedas adaptada que le permitiera moverse con independencia. Hoy, gracias a la Fundación Gallos Smiling, Valentina no solo tiene su silla: practica básquetbol adaptado dos veces por semana.\n\n\"El día que llegó su silla fue el día más feliz de nuestra vida\", recuerda su mamá, María. \"Valentina entró llorando y nosotros también. Fue un momento que nunca vamos a olvidar.\"\n\nLa historia de Valentina es una de las 47 que la fundación ha podido transformar este año. Cada caso lleva consigo documentos, seguimiento y un equipo de personas comprometidas con hacer la diferencia.\n\nSi quieres ser parte de estas historias, puedes registrar un beneficiario o convertirte en patrocinador desde esta aplicación.",
    image: "news_2",
  },
  {
    id: "n5",
    title: "Grupo Industrial del Norte renueva su patrocinio por tercer año",
    category: "Patrocinadores",
    date: "28 Apr 2026",
    author: "Área de Patrocinadores",
    summary:
      "El Grupo Industrial del Norte reafirma su compromiso con la fundación y eleva su nivel de patrocinio a Oro por tercer año consecutivo.",
    content:
      "En una ceremonia especial celebrada en las oficinas de la fundación, el Grupo Industrial del Norte firmó la renovación de su contrato de patrocinio por tercer año consecutivo, esta vez elevando su nivel al máximo: Patrocinador Oro.\n\nEsta renovación representa una aportación anual de más de 500,000 pesos destinados íntegramente a la compra de equipamiento médico y apoyos en especie para niños con discapacidad.\n\nEl director del Grupo declaró: \"Invertir en el futuro de los niños queretanos es la mejor decisión que hemos tomado como empresa. Los resultados hablan por sí solos.\"\n\nLa Fundación Gallos Smiling invita a más empresas a sumarse como patrocinadores y ser parte del cambio.",
    image: "news_1",
  },
];

export const COMMUNICATIONS: Communication[] = [
  {
    id: "c1",
    title: "Convocatoria para nuevos beneficiarios — Mayo 2026",
    date: "10 May 2026",
    category: "Fundación",
    priority: "importante",
    content:
      "Se abre el periodo de registro para nuevos beneficiarios durante el mes de mayo. Los tutores deben completar el expediente digital en la app antes del 31 de mayo. Para mayor información contactar a la fundación.",
  },
  {
    id: "c2",
    title: "Cambio de horario en oficinas — Semana Santa",
    date: "5 May 2026",
    category: "Administrativo",
    priority: "informativo",
    content:
      "Se informa que durante la semana del 12 al 16 de mayo, las oficinas de la fundación operarán en horario reducido de 9:00 a 14:00 hrs. La atención digital permanece disponible las 24 horas.",
  },
  {
    id: "c3",
    title: "URGENTE: Solicitud de documentos faltantes",
    date: "3 May 2026",
    category: "Expedientes",
    priority: "urgente",
    content:
      "Se notifica a los tutores con expedientes en estado Pendiente que deben completar su documentación antes del 15 de mayo. Los expedientes incompletos serán archivados temporalmente.",
  },
  {
    id: "c4",
    title: "Nuevo proceso de validación de documentos",
    date: "28 Apr 2026",
    category: "Administrativo",
    priority: "informativo",
    content:
      "A partir del 1 de mayo, el proceso de validación de documentos se realizará en un plazo máximo de 5 días hábiles. Los tutores recibirán notificación directa sobre el estado de cada documento.",
  },
  {
    id: "c5",
    title: "Evento de entrega de apoyos — 20 de mayo",
    date: "25 Apr 2026",
    category: "Eventos",
    priority: "importante",
    content:
      "Se informa a tutores y beneficiarios aprobados que el evento de entrega de apoyos se realizará el 20 de mayo en el Estadio La Corregidora a las 11:00 hrs. Es indispensable presentar identificación oficial y folio de expediente.",
  },
];

export const SPONSORS: Sponsor[] = [
  {
    id: "s1",
    name: "Grupo Industrial del Norte",
    level: "Oro",
    description:
      "Empresa líder en manufactura con sede en Querétaro. Patrocinador principal desde 2023.",
    contact: "Ing. Alejandro Torres",
    phone: "442-100-2001",
    email: "torres@grupoindustrial.mx",
    status: "activo",
    beneficiaries: 15,
    startDate: "Enero 2023",
  },
  {
    id: "s2",
    name: "Corporativo Seguros Bajío",
    level: "Oro",
    description:
      "Aseguradora regional con presencia en 8 estados. Apoya con seguros médicos para beneficiarios.",
    contact: "Lic. Patricia Vega",
    phone: "442-200-3002",
    email: "pvega@segurosbajio.mx",
    status: "activo",
    beneficiaries: 12,
    startDate: "Marzo 2024",
  },
  {
    id: "s3",
    name: "Constructora Querétaro SA",
    level: "Plata",
    description:
      "Empresa constructora local comprometida con el desarrollo social de la región.",
    contact: "Arq. Manuel Ríos",
    phone: "442-300-4003",
    email: "mrios@constructoraqro.mx",
    status: "activo",
    beneficiaries: 8,
    startDate: "Junio 2024",
  },
  {
    id: "s4",
    name: "Farmacia San Pablo Querétaro",
    level: "Plata",
    description:
      "Cadena de farmacias regional. Dona medicamentos e insumos médicos a beneficiarios.",
    contact: "Dr. Enrique Medina",
    phone: "442-400-5004",
    email: "emedina@fsanpablo.mx",
    status: "activo",
    beneficiaries: 20,
    startDate: "Febrero 2024",
  },
  {
    id: "s5",
    name: "Familia Ramírez Ortega",
    level: "Benefactor principal",
    description:
      "Familia queretana con larga trayectoria de filantropía y apoyo a causas sociales.",
    contact: "Sr. Eduardo Ramírez",
    phone: "442-500-6005",
    email: "eramirez@personal.mx",
    status: "activo",
    beneficiaries: 5,
    startDate: "Enero 2022",
  },
  {
    id: "s6",
    name: "Tecnológico de Querétaro",
    level: "Apoyo en especie",
    description:
      "Universidad tecnológica que brinda apoyo con terapeutas y estudiantes voluntarios.",
    contact: "Mtro. Jorge Fuentes",
    phone: "442-600-7006",
    email: "jfuentes@tec.mx",
    status: "activo",
    beneficiaries: 30,
    startDate: "Agosto 2023",
  },
];

export const BENEFICIARIES: Beneficiary[] = [
  {
    id: "b1",
    folio: "GS-2026-001",
    name: "Valentina López García",
    birthDate: "15 Mar 2017",
    age: 9,
    curp: "LOGV170315MQRLPLA9",
    gender: "Femenino",
    municipality: "Querétaro",
    zone: "Norte",
    address: "Calle Hidalgo 45, Col. San Francisco",
    school: "Primaria Benito Juárez",
    gradeLevel: "3° Primaria",
    disabilityType: "Motriz",
    diagnosis: "Parálisis cerebral infantil leve",
    needs: "Silla de ruedas, terapia física mensual",
    status: "activo",
    tutorId: "t1",
    tutorName: "María López Hernández",
    registrationDate: "10 Ene 2026",
    supportType: "Equipo médico",
    photo: undefined,
  },
  {
    id: "b2",
    folio: "GS-2026-002",
    name: "Emilio Ramírez Torres",
    birthDate: "22 Jun 2018",
    age: 7,
    curp: "RATE180622HQRMRMA4",
    gender: "Masculino",
    municipality: "El Marqués",
    zone: "Sur",
    address: "Av. Constitución 120, Col. Centro",
    school: "CAM No. 12",
    gradeLevel: "1° Primaria",
    disabilityType: "Auditiva",
    diagnosis: "Sordera bilateral severa",
    needs: "Audífonos, terapia de lenguaje",
    status: "aprobado",
    tutorId: "t2",
    tutorName: "José Ramírez Castro",
    registrationDate: "15 Ene 2026",
    supportType: "Auxiliar auditivo",
    photo: undefined,
  },
  {
    id: "b3",
    folio: "GS-2026-003",
    name: "Sofía Hernández Vega",
    birthDate: "8 Sep 2016",
    age: 9,
    curp: "HEVS160908MQRRSGF2",
    gender: "Femenino",
    municipality: "Corregidora",
    zone: "Este",
    address: "Blvd. Carranza 88, Col. Lomas",
    school: "Primaria Ignacio Allende",
    gradeLevel: "4° Primaria",
    disabilityType: "Visual",
    diagnosis: "Baja visión congénita",
    needs: "Lentes especiales, material educativo braille",
    status: "en_revision",
    tutorId: "t3",
    tutorName: "Ana Vega Morales",
    registrationDate: "20 Ene 2026",
    supportType: "Material educativo",
    photo: undefined,
  },
  {
    id: "b4",
    folio: "GS-2026-004",
    name: "Mateo García Sánchez",
    birthDate: "3 Dec 2019",
    age: 6,
    curp: "GASM191203HQRRTNA8",
    gender: "Masculino",
    municipality: "Querétaro",
    zone: "Centro",
    address: "Calle Libertad 33, Centro Histórico",
    school: "CENDI Querétaro",
    gradeLevel: "Preescolar",
    disabilityType: "Intelectual",
    diagnosis: "Síndrome de Down",
    needs: "Terapia ocupacional, integración escolar",
    status: "activo",
    tutorId: "t4",
    tutorName: "Laura Sánchez Pérez",
    registrationDate: "5 Feb 2026",
    supportType: "Terapia",
    photo: undefined,
  },
  {
    id: "b5",
    folio: "GS-2026-005",
    name: "Isabella Moreno Cruz",
    birthDate: "17 May 2015",
    age: 11,
    curp: "MOCI150517MQRRSRA6",
    gender: "Femenino",
    municipality: "Huimilpan",
    zone: "Oeste",
    address: "Calle Principal 12, Huimilpan Centro",
    school: "Secundaria Técnica No. 5",
    gradeLevel: "1° Secundaria",
    disabilityType: "Motriz",
    diagnosis: "Espina bífida",
    needs: "Silla de ruedas eléctrica, adaptaciones escolares",
    status: "pendiente",
    tutorId: "t5",
    tutorName: "Pedro Moreno Jiménez",
    registrationDate: "10 Feb 2026",
    supportType: "Equipo médico",
    photo: undefined,
  },
  {
    id: "b6",
    folio: "GS-2026-006",
    name: "Alejandro Ruiz López",
    birthDate: "29 Aug 2017",
    age: 8,
    curp: "RULOA170829HQRPXLA3",
    gender: "Masculino",
    municipality: "Pedro Escobedo",
    zone: "Norte",
    address: "Av. Juárez 67, Col. Agrícola",
    school: "Primaria Cuauhtémoc",
    gradeLevel: "2° Primaria",
    disabilityType: "Motriz",
    diagnosis: "Hidrocefalia",
    needs: "Seguimiento neurológico, apoyo escolar",
    status: "aprobado",
    tutorId: "t6",
    tutorName: "Carmen López Ruiz",
    registrationDate: "15 Feb 2026",
    supportType: "Apoyo médico",
    photo: undefined,
  },
  {
    id: "b7",
    folio: "GS-2026-007",
    name: "Camila Torres Mendoza",
    birthDate: "11 Jan 2018",
    age: 8,
    curp: "TOMC180111MQRRNMA7",
    gender: "Femenino",
    municipality: "Querétaro",
    zone: "Sur",
    address: "Calle Morelos 156, Col. Constituyentes",
    school: "CAM No. 8",
    gradeLevel: "2° Primaria",
    disabilityType: "Comunicación",
    diagnosis: "Autismo grado 2",
    needs: "Terapia del lenguaje, integración sensorial",
    status: "activo",
    tutorId: "t7",
    tutorName: "Diego Torres Vargas",
    registrationDate: "1 Mar 2026",
    supportType: "Terapia",
    photo: undefined,
  },
  {
    id: "b8",
    folio: "GS-2026-008",
    name: "Sebastián Flores Ramos",
    birthDate: "25 Oct 2016",
    age: 9,
    curp: "FORS161025HQRRLBA5",
    gender: "Masculino",
    municipality: "Corregidora",
    zone: "Este",
    address: "Fracc. Los Pinos 23, Corregidora",
    school: "Primaria Lázaro Cárdenas",
    gradeLevel: "4° Primaria",
    disabilityType: "Auditiva",
    diagnosis: "Hipoacusia moderada bilateral",
    needs: "Audífonos, terapia auditiva verbal",
    status: "rechazado",
    tutorId: "t8",
    tutorName: "Elena Ramos Gutiérrez",
    registrationDate: "10 Mar 2026",
    supportType: "Auxiliar auditivo",
    notes: "Documentación incompleta. Se solicitó corrección.",
    photo: undefined,
  },
  {
    id: "b9",
    folio: "GS-2026-009",
    name: "Lucía Martínez Ortiz",
    birthDate: "7 Apr 2020",
    age: 6,
    curp: "MAOL200407MQRRTRA8",
    gender: "Femenino",
    municipality: "El Marqués",
    zone: "Norte",
    address: "Calle Guerrero 89, Col. San Juan",
    school: "CENDI El Marqués",
    gradeLevel: "Preescolar",
    disabilityType: "Motriz",
    diagnosis: "Distrofia muscular",
    needs: "Fisioterapia semanal, equipo de movilidad",
    status: "en_revision",
    tutorId: "t9",
    tutorName: "Gabriela Ortiz Delgado",
    registrationDate: "15 Mar 2026",
    supportType: "Terapia y equipo",
    photo: undefined,
  },
  {
    id: "b10",
    folio: "GS-2026-010",
    name: "Daniel Gutiérrez Ríos",
    birthDate: "19 Jul 2014",
    age: 11,
    curp: "GURD140719HQRTRNA2",
    gender: "Masculino",
    municipality: "Querétaro",
    zone: "Centro",
    address: "Av. 5 de Febrero 234, Centro",
    school: "Secundaria General No. 1",
    gradeLevel: "2° Secundaria",
    disabilityType: "Intelectual",
    diagnosis: "Discapacidad intelectual leve",
    needs: "Apoyo psicopedagógico, integración laboral futura",
    status: "activo",
    tutorId: "t10",
    tutorName: "Fernando Gutiérrez León",
    registrationDate: "20 Mar 2026",
    supportType: "Apoyo educativo",
    photo: undefined,
  },
];

export const DOCUMENTS: Document[] = [
  { id: "d1", beneficiaryId: "b1", name: "Acta de nacimiento", type: "acta", status: "validado", uploadDate: "12 Ene 2026" },
  { id: "d2", beneficiaryId: "b1", name: "CURP", type: "curp", status: "validado", uploadDate: "12 Ene 2026" },
  { id: "d3", beneficiaryId: "b1", name: "Comprobante de domicilio", type: "domicilio", status: "validado", uploadDate: "13 Ene 2026" },
  { id: "d4", beneficiaryId: "b1", name: "Identificación oficial del tutor", type: "id_tutor", status: "validado", uploadDate: "13 Ene 2026" },
  { id: "d5", beneficiaryId: "b1", name: "Diagnóstico médico", type: "diagnostico", status: "validado", uploadDate: "14 Ene 2026" },
  { id: "d6", beneficiaryId: "b1", name: "Comprobante escolar", type: "escolar", status: "validado", uploadDate: "14 Ene 2026" },
  { id: "d7", beneficiaryId: "b1", name: "Fotografía del beneficiario", type: "foto", status: "validado", uploadDate: "15 Ene 2026" },
  { id: "d8", beneficiaryId: "b2", name: "Acta de nacimiento", type: "acta", status: "validado", uploadDate: "16 Ene 2026" },
  { id: "d9", beneficiaryId: "b2", name: "CURP", type: "curp", status: "validado", uploadDate: "16 Ene 2026" },
  { id: "d10", beneficiaryId: "b2", name: "Diagnóstico médico", type: "diagnostico", status: "pendiente" },
  { id: "d11", beneficiaryId: "b3", name: "Acta de nacimiento", type: "acta", status: "validado", uploadDate: "21 Ene 2026" },
  { id: "d12", beneficiaryId: "b3", name: "Diagnóstico médico", type: "diagnostico", status: "requiere_correccion", uploadDate: "22 Ene 2026", adminComment: "El documento está incompleto, falta firma del médico tratante." },
  { id: "d13", beneficiaryId: "b5", name: "Acta de nacimiento", type: "acta", status: "pendiente" },
  { id: "d14", beneficiaryId: "b5", name: "CURP", type: "curp", status: "pendiente" },
  { id: "d15", beneficiaryId: "b8", name: "Diagnóstico médico", type: "diagnostico", status: "rechazado", uploadDate: "11 Mar 2026", adminComment: "Documento ilegible. Por favor vuelva a subir." },
];

export const STATS: Stats = {
  totalBeneficiaries: 10,
  disabledChildren: 10,
  activeRecords: 4,
  pendingRequests: 2,
  approvedRequests: 2,
  rejectedRequests: 1,
  pendingDocuments: 4,
  activeSponsors: 6,
  activeDonors: 3,
  supportDelivered: 47,
  familiesHelped: 38,
};

export const MUNICIPALITIES = [
  "Querétaro",
  "El Marqués",
  "Corregidora",
  "San Juan del Río",
  "Huimilpan",
  "Pedro Escobedo",
  "Cadereyta de Montes",
  "Tequisquiapan",
];

export const ZONES = ["Norte", "Sur", "Este", "Oeste", "Centro"];

export const DISABILITY_TYPES = [
  "Motriz",
  "Auditiva",
  "Visual",
  "Intelectual",
  "Comunicación",
  "Múltiple",
  "Psicosocial",
  "Otra",
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
