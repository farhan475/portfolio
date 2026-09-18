// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Dipakai untuk canonical URL, OpenGraph, dan sitemap. Di Vercel, nilai ini
// terisi otomatis dari domain produksi bila PUBLIC_SITE_URL tidak diset.

/**
 * Environment variable yang ada tapi kosong bukan hal yang sama dengan tidak
 * diset. `??` hanya menangkap null dan undefined, sedangkan variabel yang
 * dibuat di dashboard Vercel tanpa mengisi nilainya sampai ke sini sebagai
 * string kosong, lalu gagal di Astro dengan pesan "Invalid URL" yang tidak
 * menyebut variabel mana penyebabnya.
 *
 * @param {string | undefined} value
 * @returns {string | undefined}
 */
function envUrl(value) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  // Domain tanpa protokol adalah salah tulis yang paling sering terjadi.
  // Melengkapinya lebih berguna daripada menggagalkan seluruh build.
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    console.warn(
      `[astro.config] PUBLIC_SITE_URL="${trimmed}" bukan URL yang sah dan diabaikan. ` +
        'Canonical URL akan memakai origin dari request.',
    );
    return undefined;
  }
}

const site =
  envUrl(process.env.PUBLIC_SITE_URL) ?? envUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);

// https://astro.build/config
export default defineConfig({
  site,
  output: 'server',
  adapter: vercel(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
