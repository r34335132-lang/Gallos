export function isHeicUrl(url?: string | null) {
  return Boolean(url && /\.(heic|heif)(\?.*)?$/i.test(url));
}

export async function convertHeicToJpeg(_blob: Blob, _name?: string): Promise<Blob | null> {
  return null;
}
