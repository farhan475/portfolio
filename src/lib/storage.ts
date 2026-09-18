import type { TypedSupabaseClient } from './supabase';

export const ASSETS_BUCKET = 'portfolio-assets';

/** Batas dan tipe yang sama dengan yang ditegakkan bucket di schema-portfolio.sql. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'application/pdf',
] as const;

/**
 * Mengubah public URL menjadi path di dalam bucket.
 * URL di luar bucket kita (misal placehold.co) menghasilkan null, jadi aman
 * dipakai untuk menyaring mana yang boleh dihapus.
 */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const marker = `/storage/v1/object/public/${ASSETS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  const [path] = url.slice(index + marker.length).split('?');
  if (!path) return null;

  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * Menghapus berkas yang tadinya dipakai sebuah baris tapi sudah tidak lagi.
 * Dipanggil SETELAH update database berhasil, supaya berkas tidak hilang
 * ketika admin membatalkan form.
 */
export async function removeOrphanAssets(
  supabase: TypedSupabaseClient,
  previousUrls: readonly (string | null | undefined)[],
  nextUrls: readonly (string | null | undefined)[],
): Promise<void> {
  const keep = new Set(
    nextUrls.map(storagePathFromUrl).filter((path): path is string => path !== null),
  );

  const orphans = [
    ...new Set(previousUrls.map(storagePathFromUrl).filter((path): path is string => path !== null)),
  ].filter((path) => !keep.has(path));

  if (orphans.length === 0) return;

  const { error } = await supabase.storage.from(ASSETS_BUCKET).remove(orphans);
  if (error) {
    // Bukan alasan untuk menggagalkan penyimpanan: datanya sudah tersimpan,
    // yang tersisa hanya berkas menganggur.
    console.warn('[storage] gagal menghapus aset yatim:', error.message);
  }
}

/** Semua URL aset milik sebuah proyek. */
export function projectAssetUrls(project: {
  image_url?: string | null;
  gallery?: string[];
}): (string | null | undefined)[] {
  return [project.image_url, ...(project.gallery ?? [])];
}
