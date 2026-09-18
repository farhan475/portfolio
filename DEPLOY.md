# Catatan Deploy

## 1. Environment variable di Vercel

Project Settings → Environment Variables (isi untuk Production, Preview, dan Development):

| Nama | Nilai | Wajib |
| --- | --- | --- |
| `PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | ya |
| `PUBLIC_SUPABASE_ANON_KEY` | publishable key (`sb_publishable_...`) atau legacy anon key | ya |
| `PUBLIC_SITE_URL` | `https://domainmu.com` | tidak |

`PUBLIC_SITE_URL` boleh dikosongkan di Vercel: domain produksi terbaca otomatis
dari `VERCEL_PROJECT_PRODUCTION_URL`. Isi manual kalau memakai domain kustom yang
berbeda dari domain produksi Vercel.

**Jangan pernah** memasang `service_role` atau secret key di sini. Keduanya bisa
melewati seluruh RLS, dan variabel berawalan `PUBLIC_` ikut terkirim ke browser.

## 2. Pengaturan Supabase Auth

Authentication → URL Configuration:

- **Site URL**: `https://domainmu.com`
- **Redirect URLs**: tambahkan semuanya
  - `https://domainmu.com/**`
  - `https://<nama-project>.vercel.app/**` (untuk preview deployment)
  - `http://localhost:4321/**` (untuk pengembangan lokal)

## 3. Menyiapkan database

1. SQL Editor → tempel seluruh isi `supabase/schema-portfolio.sql` → Run.
2. Authentication → Users → Add user, isi email dan password admin.
3. SQL Editor → jalankan, ganti emailnya:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'email-admin-kamu@contoh.com';
   ```

Tanpa langkah 3, login akan ditolak dengan pesan "Akun ini bukan admin" — itu
memang perilaku yang diharapkan.

## 4. Storage

Bucket `portfolio-assets` dibuat oleh file SQL di atas, bersama policy-nya:
publik boleh membaca, hanya admin yang boleh menulis. Batas ukuran 2 MB per file
ditegakkan di dua tempat: di bucket dan di `ImageUploader.tsx`.

## 5. Deploy

```bash
pnpm install
pnpm check     # type check, harus 0 error
pnpm build     # menghasilkan .vercel/output
```

Di Vercel, framework preset terdeteksi sebagai Astro. Build command `pnpm build`,
tidak ada output directory yang perlu diisi manual.

## 6. Setelah deploy, periksa manual

- `/` tampil dengan data dari Supabase, bukan pesan "Belum ada section".
- `/admin` mengalihkan ke `/admin/login` saat belum masuk.
- Login sebagai admin berhasil dan dashboard menampilkan angka yang benar.
- Login sebagai user non-admin ditolak dan sesinya dicabut.
- `/sitemap.xml` dan `/robots.txt` memakai domain yang benar.
- Header `Cache-Control` di `/` bernilai `public, s-maxage=60, stale-while-revalidate=300`,
  sedangkan di `/admin/*` bernilai `no-store`.
