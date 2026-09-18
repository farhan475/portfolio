-- =====================================================================
-- SKEMA PORTOFOLIO FULL KUSTOM (Astro + Supabase)
-- Jalankan seluruh file ini di Supabase SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. FUNGSI BANTU: updated_at otomatis
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. ADMINS: hanya user di tabel ini yang boleh mengedit konten
-- ---------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 2. SITE SETTINGS: satu baris saja (id selalu 1)
-- ---------------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_title text not null,
  meta_description text,
  og_image_url text,
  favicon_url text,
  logo_text text,
  logo_url text,
  -- warna dan font tema, dibaca Astro lalu dipasang sebagai CSS variable.
  -- default_mode menentukan tampilan sebelum pengunjung menekan tombol mode:
  --   system = ikut setelan gelap/terang perangkat pengunjung
  --   dark   = selalu gelap
  --   light  = selalu terang
  -- Struktur lengkapnya divalidasi Zod di src/lib/schemas.ts.
  theme jsonb not null default '{
    "primary": "#3b82f6",
    "accent": "#22d3ee",
    "background": "#0a0a0a",
    "foreground": "#fafafa",
    "font_heading": "Inter",
    "font_body": "Inter",
    "default_mode": "system"
  }'::jsonb,
  -- menu navbar: [{ "label": "...", "href": "..." }]
  nav_items jsonb not null default '[]'::jsonb,
  footer_text text,
  resume_url text,
  updated_at timestamptz not null default now()
);

create trigger trg_site_settings_updated
before update on public.site_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. SECTIONS: blok halaman utama, urutan dan isi bisa diubah
-- ---------------------------------------------------------------------
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,                 -- id anchor, misal 'hero'
  type text not null check (type in (
    'hero', 'about', 'skills', 'projects', 'experience', 'contact', 'custom'
  )),
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb, -- struktur tergantung type, validasi dengan Zod
  sort_order int not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create index idx_sections_order on public.sections (sort_order);

create trigger trg_sections_updated
before update on public.sections
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. PROJECTS
-- ---------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  slug varchar(255) unique not null,
  description text not null,
  content text,                              -- detail proyek dalam Markdown
  category text,
  image_url text,
  gallery text[] not null default '{}',
  tech_stack text[] not null default '{}',
  github_url text,
  demo_url text,
  featured boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_order on public.projects (sort_order);

create trigger trg_projects_updated
before update on public.projects
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. SKILLS
-- ---------------------------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Lainnya',  -- misal Backend, Database, Tools
  icon text,                                  -- nama ikon Lucide atau URL gambar
  sort_order int not null default 0,
  is_visible boolean not null default true
);

-- ---------------------------------------------------------------------
-- 6. EXPERIENCES
-- ---------------------------------------------------------------------
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  company text not null,
  company_url text,
  location text,
  start_date date not null,
  end_date date,                              -- null berarti masih berjalan
  description text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  check (end_date is null or end_date >= start_date)
);

-- ---------------------------------------------------------------------
-- 7. SOCIAL LINKS
-- ---------------------------------------------------------------------
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  icon text,
  sort_order int not null default 0,
  is_visible boolean not null default true
);

-- ---------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- Publik hanya bisa membaca data yang tampil. Admin bisa semuanya.
-- ---------------------------------------------------------------------
alter table public.admins        enable row level security;
alter table public.site_settings enable row level security;
alter table public.sections      enable row level security;
alter table public.projects      enable row level security;
alter table public.skills        enable row level security;
alter table public.experiences   enable row level security;
alter table public.social_links  enable row level security;

-- admins: user hanya bisa melihat status dirinya sendiri
create policy "admin lihat diri sendiri" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- site_settings
create policy "publik baca settings" on public.site_settings
  for select using (true);
create policy "admin kelola settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- sections
create policy "publik baca section tampil" on public.sections
  for select using (is_visible or public.is_admin());
create policy "admin kelola sections" on public.sections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- projects
create policy "publik baca project terbit" on public.projects
  for select using (is_published or public.is_admin());
create policy "admin kelola projects" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- skills
create policy "publik baca skill tampil" on public.skills
  for select using (is_visible or public.is_admin());
create policy "admin kelola skills" on public.skills
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- experiences
create policy "publik baca pengalaman tampil" on public.experiences
  for select using (is_visible or public.is_admin());
create policy "admin kelola experiences" on public.experiences
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- social_links
create policy "publik baca sosmed tampil" on public.social_links
  for select using (is_visible or public.is_admin());
create policy "admin kelola social_links" on public.social_links
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 9. STORAGE BUCKET untuk gambar
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-assets',
  'portfolio-assets',
  true,
  2097152, -- batas 2 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do nothing;

create policy "publik baca aset" on storage.objects
  for select using (bucket_id = 'portfolio-assets');
create policy "admin upload aset" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-assets' and public.is_admin());
create policy "admin ubah aset" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-assets' and public.is_admin());
create policy "admin hapus aset" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-assets' and public.is_admin());

-- ---------------------------------------------------------------------
-- 10. DATA DUMMY
-- ---------------------------------------------------------------------
insert into public.site_settings (id, site_title, meta_description, og_image_url, logo_text, nav_items, footer_text)
values (
  1,
  'Nama Kamu | Portfolio',
  'Deskripsi singkat tentang dirimu untuk mesin pencari dan preview media sosial.',
  'https://placehold.co/1200x630/0a0a0a/fafafa?text=OG+Image',
  'NamaKamu',
  '[
    {"label": "Tentang", "href": "#about"},
    {"label": "Keahlian", "href": "#skills"},
    {"label": "Proyek", "href": "#projects"},
    {"label": "Pengalaman", "href": "#experience"},
    {"label": "Kontak", "href": "#contact"}
  ]'::jsonb,
  '© 2026 Nama Kamu. Dibuat dengan Astro dan Supabase.'
);

insert into public.sections (key, type, title, subtitle, content, sort_order) values
('hero', 'hero', null, null, '{
  "greeting": "Halo, saya",
  "name": "Nama Kamu",
  "role": "Backend Developer",
  "description": "Tulis satu atau dua kalimat tentang apa yang kamu kerjakan dan masalah apa yang kamu selesaikan.",
  "image_url": "https://placehold.co/600x600/1e293b/fafafa?text=Foto",
  "cta_primary": {"label": "Lihat Proyek", "href": "#projects"},
  "cta_secondary": {"label": "Hubungi Saya", "href": "#contact"}
}'::jsonb, 1),
('about', 'about', 'Tentang Saya', 'Sedikit cerita', '{
  "body": "Paragraf dummy tentang latar belakang, fokus kerja, dan hal yang sedang kamu pelajari.",
  "image_url": "https://placehold.co/800x600/1e293b/fafafa?text=About",
  "highlights": [
    {"label": "Tahun Pengalaman", "value": "2+"},
    {"label": "Proyek Selesai", "value": "10+"}
  ]
}'::jsonb, 2),
('skills', 'skills', 'Keahlian', 'Teknologi yang saya pakai', '{}'::jsonb, 3),
('projects', 'projects', 'Proyek Pilihan', 'Beberapa karya terbaru', '{"show_filter": true, "limit": 6}'::jsonb, 4),
('experience', 'experience', 'Pengalaman', 'Perjalanan karier', '{}'::jsonb, 5),
('contact', 'contact', 'Kontak', 'Mari berdiskusi', '{
  "body": "Kalimat ajakan dummy untuk menghubungi kamu.",
  "email": "email@contoh.com",
  "cta_label": "Kirim Email"
}'::jsonb, 6);

insert into public.projects (title, slug, description, content, category, image_url, tech_stack, github_url, demo_url, featured, sort_order) values
('Proyek Dummy Satu', 'proyek-dummy-satu', 'Deskripsi singkat proyek pertama.', '## Latar Belakang\nIsi detail proyek dalam Markdown.', 'Backend',
 'https://placehold.co/800x500/1e293b/fafafa?text=Proyek+1', array['Node.js', 'PostgreSQL'], 'https://github.com/username/proyek-1', null, true, 1),
('Proyek Dummy Dua', 'proyek-dummy-dua', 'Deskripsi singkat proyek kedua.', '## Latar Belakang\nIsi detail proyek dalam Markdown.', 'Fullstack',
 'https://placehold.co/800x500/1e293b/fafafa?text=Proyek+2', array['Astro', 'Supabase'], 'https://github.com/username/proyek-2', 'https://contoh.com', true, 2),
('Proyek Dummy Tiga', 'proyek-dummy-tiga', 'Deskripsi singkat proyek ketiga.', '## Latar Belakang\nIsi detail proyek dalam Markdown.', 'API',
 'https://placehold.co/800x500/1e293b/fafafa?text=Proyek+3', array['Go', 'Redis'], null, null, false, 3);

insert into public.skills (name, category, icon, sort_order) values
('Node.js', 'Backend', 'server', 1),
('PostgreSQL', 'Database', 'database', 2),
('Docker', 'Tools', 'container', 3),
('TypeScript', 'Bahasa', 'code', 4);

insert into public.experiences (role, company, location, start_date, end_date, description, sort_order) values
('Posisi Dummy', 'Perusahaan A', 'Jakarta', '2024-01-01', null, 'Ringkasan tanggung jawab dan hasil kerja.', 1),
('Posisi Dummy Lama', 'Perusahaan B', 'Remote', '2022-06-01', '2023-12-31', 'Ringkasan tanggung jawab dan hasil kerja.', 2);

insert into public.social_links (platform, url, icon, sort_order) values
('GitHub', 'https://github.com/username', 'github', 1),
('LinkedIn', 'https://linkedin.com/in/username', 'linkedin', 2),
('Email', 'mailto:email@contoh.com', 'mail', 3);

-- =====================================================================
-- 11. DAFTARKAN ADMIN
-- Jalankan TERPISAH setelah membuat user di Authentication > Users.
-- Ganti email di bawah dengan email admin kamu.
-- =====================================================================
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'email-admin-kamu@contoh.com';
