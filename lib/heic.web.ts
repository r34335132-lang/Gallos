export function isHeicUrl(url?: string | null) {
  return Boolean(url && /\.(heic|heif)(\?.*)?$/i.test(url));
}

function looksLikeHeic(blob: Blob, name?: string) {
  return /image\/hei[cf]/i.test(blob.type) || /\.(heic|heif)$/i.test(name || "");
}

// Chrome, Edge y Android no pueden mostrar HEIC (formato de fotos de iPhone),
// por eso se convierte a JPG antes de subir. La libreria pesa ~2 MB y solo se
// descarga cuando realmente llega una foto HEIC.
export async function convertHeicToJpeg(blob: Blob, name?: string): Promise<Blob | null> {
  const { heicTo, isHeic } = await import("heic-to");
  const file = blob instanceof File ? blob : new File([blob], name || "foto.heic", { type: blob.type });
  if (!looksLikeHeic(blob, name) && !(await isHeic(file))) return null;
  return heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
}
