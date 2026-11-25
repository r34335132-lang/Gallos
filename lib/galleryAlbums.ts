import { Platform } from "react-native";
import type { GalleryItem } from "@/lib/appData";
import { isHeicUrl } from "@/lib/heic";

export type GalleryAlbum = {
  id: string;
  title: string;
  description: string;
  cover: GalleryItem;
  items: GalleryItem[];
  photoCount: number;
  videoCount: number;
};

export const GALLERY_COLUMNS =
  "id, title, description, type, media_url, image_url, video_url, thumbnail_url, album_id, event_id, event_name, upload_date";

export function albumKeyOf(item: GalleryItem) {
  return item.albumId || item.eventId || item.albumName || item.eventName || item.tournamentName || item.title || "Galeria";
}

// Recibe los elementos ordenados del mas reciente al mas antiguo, asi el album
// con la subida mas reciente queda primero.
export function groupGalleryAlbums(items: GalleryItem[]): GalleryAlbum[] {
  const grouped = new Map<string, GalleryItem[]>();
  for (const item of items) {
    const key = albumKeyOf(item);
    grouped.set(key, [...(grouped.get(key) || []), item]);
  }

  return Array.from(grouped.entries()).map(([key, group]) => {
    const cover =
      group.find((item) => item.type === "imagen" && !isHeicUrl(item.thumbnailUrl || item.mediaUrl)) ||
      group.find((item) => item.type === "imagen") ||
      group[0];
    const photoCount = group.filter((item) => item.type === "imagen").length;
    const videoCount = group.filter((item) => item.type === "video").length;
    return {
      id: key,
      title: cover.albumName || cover.eventName || cover.tournamentName || cover.title || key,
      description: group.find((item) => item.description)?.description || `${group.length} elemento(s) multimedia`,
      cover,
      items: group,
      photoCount,
      videoCount,
    };
  });
}

export function albumCoverUri(album: Pick<GalleryAlbum, "cover">) {
  const { cover } = album;
  const uri = cover.thumbnailUrl || (cover.type === "imagen" ? cover.mediaUrl : null);
  if (!uri || (Platform.OS === "web" && isHeicUrl(uri))) return null;
  return uri;
}

export function albumCountLabel(album: Pick<GalleryAlbum, "photoCount" | "videoCount">) {
  const parts = [`${album.photoCount} foto${album.photoCount === 1 ? "" : "s"}`];
  if (album.videoCount > 0) parts.push(`${album.videoCount} video${album.videoCount === 1 ? "" : "s"}`);
  return parts.join(" · ");
}
