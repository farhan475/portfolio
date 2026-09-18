# Portfolio Full Kustom

Web portofolio satu halaman. Semua konten (teks, gambar, urutan section, tema, SEO) diambil dari Supabase dan bisa diubah lewat /admin. Tidak ada blog.

## Stack
- Astro (output: server) + TypeScript strict, adapter Vercel
- Tailwind CSS, mobile-first
- React islands hanya untuk bagian interaktif (Framer Motion, form admin)
- Supabase: Postgres, Auth, Storage (bucket `portfolio-assets`)
- `@supabase/ssr` untuk sesi berbasis cookie, `zod` untuk validasi
- Package manager: pnpm

## Sumber kebenaran
- Skema database: `supabase/schema-portfolio.sql`. Jangan mengubah skema tanpa bertanya.
- Tipe database: `src/types/database.ts` (hasil `supabase gen types`).
- Struktur konten jsonb tiap section: `src/lib/schemas.ts`. Setiap data dari tabel `sections` wajib divalidasi Zod sebelum dirender dan sebelum disimpan.

## Aturan arsitektur
- Halaman utama merender section dari tabel `sections` sesuai `sort_order` dan `is_visible`, lewat `SectionRenderer.astro`. Jangan hardcode urutan section.
- Tidak ada teks atau gambar konten yang di-hardcode di komponen. Nilai fallback hanya untuk kondisi data kosong.
- Warna dan font dari `site_settings.theme` dipasang sebagai CSS variable di `BaseLayout.astro`. Tailwind memakai variable tersebut.
- Semua query ada di `src/lib/queries.ts`. Komponen tidak memanggil Supabase langsung.
- Hanya gunakan anon key. Dilarang memakai atau meminta service_role key.
- Keamanan mengandalkan RLS dan fungsi `is_admin()`. Middleware `/admin/*` memeriksa sesi DAN status admin, bukan hanya sesi.
- Halaman publik mengirim header `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`. Halaman admin tidak di-cache.
- Gambar dari Storage dimuat dengan `loading="lazy"`, ukuran eksplisit, dan `alt` yang diisi.

## Gaya UI
- Minimal dan bersih. Hindari shadow tebal, gradient berlebihan, dan border-radius besar.
- Dark mode default, bisa diganti lewat toggle.
- Animasi halus dan hormati `prefers-reduced-motion`.
- Target Lighthouse di atas 90 untuk Performance, Accessibility, dan SEO.

## Cara kerja
- Kerjakan hanya fase yang diminta. Jangan loncat ke fase lain.
- Sebelum menulis kode, jelaskan rencana singkat berisi file yang akan dibuat atau diubah.
- Setelah selesai, jalankan `pnpm astro check` dan `pnpm build`. Perbaiki semua error sebelum melapor selesai.
- Jangan menambah dependency baru tanpa menyebutkan alasannya.
- Jangan membaca atau menampilkan isi `.env`.
- Bahasa komunikasi: Bahasa Indonesia.
