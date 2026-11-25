import { router } from "expo-router";

// En web, al abrir una pantalla directo (recargar, link compartido) no hay historial
// y router.back() no hace nada; en ese caso mandamos a una ruta conocida.
export function goBack(fallback = "/") {
  if (router.canGoBack()) router.back();
  else router.replace(fallback as any);
}
