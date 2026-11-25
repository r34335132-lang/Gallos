import { Platform } from "react-native";
import { convertHeicToJpeg } from "@/lib/heic";
import { supabase } from "@/lib/supabase";

const BUCKET = "img";
const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

export type UploadableMedia = {
  uri: string;
  type: "imagen" | "video";
  name?: string;
  mimeType?: string;
  file?: Blob;
};

function extensionFrom(name?: string, mimeType?: string, isVideo = false) {
  const fromName = name?.includes(".") ? name.split(".").pop() : "";
  const fromMime = mimeType?.split("/")[1];
  const ext = (fromName || fromMime || (isVideo ? "mp4" : "jpeg")).toLowerCase();
  return ext.replace("quicktime", "mov").replace("jpeg", "jpg");
}

function mimeFrom(ext: string, isVideo: boolean) {
  if (isVideo) return ext === "mov" ? "video/quicktime" : `video/${ext}`;
  return `image/${ext === "jpg" ? "jpeg" : ext}`;
}

function randomPath(folder: string, ext: string) {
  return `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
}

// Las fotos de celular pesan 3-10 MB; reducirlas a 1920 px deja ~300-600 KB y
// permite subir albumes grandes sin que el navegador se quede colgado.
async function compressImageForWeb(blob: Blob): Promise<Blob | null> {
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") return null;
  if (blob.type === "image/gif" || blob.type === "image/svg+xml") return null;
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && blob.size < 1_500_000 && blob.type === "image/jpeg") {
      bitmap.close();
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  } catch {
    return null;
  }
}

export async function uploadMedia(media: UploadableMedia, options: { folder?: string; compress?: boolean } = {}): Promise<string> {
  const folder = options.folder || "uploads";
  const isVideo = media.type === "video";

  if (Platform.OS === "web") {
    let body: Blob = media.file || (await (await fetch(media.uri)).blob());
    let ext = extensionFrom(media.name, body.type || media.mimeType, isVideo);
    let contentType = body.type || media.mimeType || mimeFrom(ext, isVideo);

    if (!isVideo) {
      const jpeg = await convertHeicToJpeg(body, media.name).catch(() => null);
      if (jpeg) {
        body = jpeg;
        ext = "jpg";
        contentType = "image/jpeg";
      }
    }

    if (!isVideo && options.compress !== false) {
      const compressed = await compressImageForWeb(body);
      if (compressed) {
        body = compressed;
        ext = "jpg";
        contentType = "image/jpeg";
      }
    }

    const path = randomPath(folder, ext);
    const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType, cacheControl: "31536000" });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const ext = extensionFrom(media.name || media.uri.split("?")[0].split("/").pop(), media.mimeType, isVideo);
  const path = randomPath(folder, ext);
  const formData = new FormData();
  formData.append("file", { uri: media.uri, name: path.split("/").pop(), type: media.mimeType || mimeFrom(ext, isVideo) } as any);
  const { error } = await supabase.storage.from(BUCKET).upload(path, formData);
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function reuploadHeicAsJpeg(url: string, folder = "uploads"): Promise<string> {
  const blob = await (await fetch(url)).blob();
  const name = url.split("?")[0].split("/").pop() || "foto.heic";
  const jpeg = await convertHeicToJpeg(blob, name);
  if (!jpeg) throw new Error("No se pudo convertir la foto HEIC.");
  return uploadMedia({ uri: url, file: jpeg, name: name.replace(/\.(heic|heif)$/i, ".jpg"), mimeType: "image/jpeg", type: "imagen" }, { folder });
}

export async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}
