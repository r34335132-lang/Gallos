import * as Calendar from "expo-calendar/legacy";
import { Linking, Platform, Share } from "react-native";
import { WEB_PORTAL_URL } from "@/lib/appVariant";

const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

export const CAN_ADD_TO_CALENDAR = Platform.OS === "ios" || Platform.OS === "android";

export async function shareContent({ title, text, path }: { title: string; text?: string; path?: string }) {
  const url = path ? `${WEB_PORTAL_URL}${path}` : undefined;
  const message = [title, text, url].filter(Boolean).join("\n\n");
  try {
    await Share.share({ title, message });
  } catch (error) {
    console.log("No se pudo compartir:", error);
  }
}

// Se abre en Safari / navegador del sistema, fuera de la app.
export function openWebPortal() {
  Linking.openURL(WEB_PORTAL_URL).catch((error) => console.log("No se pudo abrir el portal:", error));
}

export async function addEventToCalendar({
  title,
  startsAt,
  location,
  notes,
}: {
  title: string;
  startsAt: string;
  location?: string;
  notes?: string;
}) {
  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) return false;

  // Antes de iOS 17 el formulario del sistema requiere permiso de calendario.
  if (Platform.OS === "ios" && parseInt(String(Platform.Version), 10) < 17) {
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    if (!granted) return false;
  }

  await Calendar.createEventInCalendarAsync({
    title,
    startDate,
    endDate: new Date(startDate.getTime() + DEFAULT_EVENT_DURATION_MS),
    location: location || undefined,
    notes: notes || undefined,
  });
  return true;
}
