import { z } from 'zod';

/**
 * Sumber kebenaran struktur jsonb. Dipakai dua arah:
 * - sebelum dirender di halaman publik
 * - sebelum disimpan lewat form admin
 */

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const hexColor = z
  .string()
  .trim()
  .regex(HEX_COLOR, 'Warna harus berformat hex, misal #0a0a0a');

/** URL absolut maupun path relatif, keduanya sah untuk aset. */
const assetUrl = z.string().trim().min(1, 'URL tidak boleh kosong');

const optionalAssetUrl = assetUrl.optional().nullable();

const optionalText = z.string().trim().optional().nullable();

// ---------------------------------------------------------------------------
// site_settings.theme
// ---------------------------------------------------------------------------

export const themeSchema = z.object({
  primary: hexColor.default('#3b82f6'),
  accent: hexColor.default('#22d3ee'),
  background: hexColor.default('#0a0a0a'),
  foreground: hexColor.default('#fafafa'),
  font_heading: z.string().trim().min(1).default('Inter'),
  font_body: z.string().trim().min(1).default('Inter'),
  /**
   * Mode saat pengunjung belum pernah menekan tombol mode.
   * `system` mengikuti prefers-color-scheme perangkat pengunjung.
   */
  default_mode: z.enum(['system', 'dark', 'light']).default('system'),
});

export type Theme = z.infer<typeof themeSchema>;

export const DEFAULT_THEME: Theme = themeSchema.parse({});

// ---------------------------------------------------------------------------
// site_settings.nav_items
// ---------------------------------------------------------------------------

export const navItemSchema = z.object({
  label: z.string().trim().min(1, 'Label wajib diisi'),
  href: z.string().trim().min(1, 'Href wajib diisi'),
});

export const navItemsSchema = z.array(navItemSchema);

export type NavItem = z.infer<typeof navItemSchema>;

// ---------------------------------------------------------------------------
// sections.content per type
// ---------------------------------------------------------------------------

const ctaSchema = z.object({
  label: z.string().trim().min(1),
  href: z.string().trim().min(1),
});

export type Cta = z.infer<typeof ctaSchema>;

export const heroContentSchema = z.object({
  greeting: optionalText,
  name: z.string().trim().min(1).default('Nama Kamu'),
  role: optionalText,
  description: optionalText,
  image_url: optionalAssetUrl,
  cta_primary: ctaSchema.optional().nullable(),
  cta_secondary: ctaSchema.optional().nullable(),
});

export const aboutContentSchema = z.object({
  body: optionalText,
  image_url: optionalAssetUrl,
  highlights: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim().min(1),
      }),
    )
    .default([]),
});

export const skillsContentSchema = z.object({
  /** Kelompokkan kartu skill berdasarkan kolom category. */
  group_by_category: z.boolean().default(true),
});

export const projectsContentSchema = z.object({
  show_filter: z.boolean().default(true),
  limit: z.number().int().positive().max(50).default(6),
  /** Tampilkan hanya proyek dengan featured = true. */
  featured_only: z.boolean().default(false),
  /**
   * Tata letak daftar proyek. `carousel` menggeser per halaman (3 kartu di
   * desktop, 1 di ponsel), `grid` memakai kisi statis seperti versi lama.
   * Bawaannya carousel supaya baris lama yang belum punya key ini ikut berubah.
   */
  layout: z.enum(['carousel', 'grid']).default('carousel'),
});

export const experienceContentSchema = z.object({
  /** Tampilkan garis waktu, bukan daftar biasa. */
  timeline: z.boolean().default(true),
});

export const contactContentSchema = z.object({
  body: optionalText,
  email: z.string().trim().optional().nullable(),
  cta_label: z.string().trim().min(1).default('Kirim Email'),
});

export const customContentSchema = z.object({
  /** Isi bebas dalam Markdown. */
  body: optionalText,
});

export const sectionContentSchemas = {
  hero: heroContentSchema,
  about: aboutContentSchema,
  skills: skillsContentSchema,
  projects: projectsContentSchema,
  experience: experienceContentSchema,
  contact: contactContentSchema,
  custom: customContentSchema,
} as const;

export type SectionContentSchemas = typeof sectionContentSchemas;
export type SectionTypeKey = keyof SectionContentSchemas;

export type HeroContent = z.infer<typeof heroContentSchema>;
export type AboutContent = z.infer<typeof aboutContentSchema>;
export type SkillsContent = z.infer<typeof skillsContentSchema>;
export type ProjectsContent = z.infer<typeof projectsContentSchema>;
export type ExperienceContent = z.infer<typeof experienceContentSchema>;
export type ContactContent = z.infer<typeof contactContentSchema>;
export type CustomContent = z.infer<typeof customContentSchema>;

/** Union yang sudah tervalidasi, dipakai SectionRenderer untuk menyempitkan tipe. */
export type SectionContent =
  | { type: 'hero'; content: HeroContent }
  | { type: 'about'; content: AboutContent }
  | { type: 'skills'; content: SkillsContent }
  | { type: 'projects'; content: ProjectsContent }
  | { type: 'experience'; content: ExperienceContent }
  | { type: 'contact'; content: ContactContent }
  | { type: 'custom'; content: CustomContent };

// ---------------------------------------------------------------------------
// Skema baris tabel untuk form admin
// ---------------------------------------------------------------------------

export const siteSettingsFormSchema = z.object({
  site_title: z.string().trim().min(1, 'Judul situs wajib diisi'),
  meta_description: optionalText,
  og_image_url: optionalAssetUrl,
  favicon_url: optionalAssetUrl,
  logo_text: optionalText,
  logo_url: optionalAssetUrl,
  theme: themeSchema,
  nav_items: navItemsSchema,
  footer_text: optionalText,
  resume_url: optionalAssetUrl,
});

export const sectionFormSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Key wajib diisi')
    .regex(/^[a-z0-9-]+$/, 'Key hanya boleh huruf kecil, angka, dan tanda hubung'),
  type: z.enum(['hero', 'about', 'skills', 'projects', 'experience', 'contact', 'custom']),
  title: optionalText,
  subtitle: optionalText,
  content: z.unknown(),
  sort_order: z.number().int(),
  is_visible: z.boolean(),
});

export const projectFormSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi').max(255),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug wajib diisi')
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi'),
  content: optionalText,
  category: optionalText,
  image_url: optionalAssetUrl,
  gallery: z.array(assetUrl).default([]),
  tech_stack: z.array(z.string().trim().min(1)).default([]),
  github_url: optionalAssetUrl,
  demo_url: optionalAssetUrl,
  featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const skillFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  category: z.string().trim().min(1).default('Lainnya'),
  icon: optionalText,
  sort_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
});

export const experienceFormSchema = z
  .object({
    role: z.string().trim().min(1, 'Posisi wajib diisi'),
    company: z.string().trim().min(1, 'Perusahaan wajib diisi'),
    company_url: optionalAssetUrl,
    location: optionalText,
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .optional()
      .nullable(),
    description: optionalText,
    sort_order: z.number().int().default(0),
    is_visible: z.boolean().default(true),
  })
  .refine((value) => !value.end_date || value.end_date >= value.start_date, {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    path: ['end_date'],
  });

export const socialLinkFormSchema = z.object({
  platform: z.string().trim().min(1, 'Platform wajib diisi'),
  url: z.string().trim().min(1, 'URL wajib diisi'),
  icon: optionalText,
  sort_order: z.number().int().default(0),
  is_visible: z.boolean().default(true),
});

export const loginSchema = z.object({
  email: z.email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export type SiteSettingsForm = z.infer<typeof siteSettingsFormSchema>;
export type ProjectForm = z.infer<typeof projectFormSchema>;
export type SkillForm = z.infer<typeof skillFormSchema>;
export type ExperienceForm = z.infer<typeof experienceFormSchema>;
export type SocialLinkForm = z.infer<typeof socialLinkFormSchema>;
