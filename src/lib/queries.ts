import type { TypedSupabaseClient } from './supabase';
import type {
  ExperienceRow,
  ProjectRow,
  SectionRow,
  SiteSettingsRow,
  SkillRow,
  SocialLinkRow,
} from '../types/database';
import {
  DEFAULT_THEME,
  navItemsSchema,
  sectionContentSchemas,
  themeSchema,
  type NavItem,
  type SectionContent,
  type Theme,
} from './schemas';

/**
 * Satu-satunya tempat query Supabase. Komponen tidak boleh memanggil Supabase
 * langsung. Semua nilai yang dikembalikan sudah lolos validasi Zod.
 */

export interface SiteSettings extends Omit<SiteSettingsRow, 'theme' | 'nav_items'> {
  theme: Theme;
  nav_items: NavItem[];
}

export type Section = Omit<SectionRow, 'content'> & SectionContent;

export type Project = ProjectRow;
export type Skill = SkillRow;
export type Experience = ExperienceRow;
export type SocialLink = SocialLinkRow;

function warn(scope: string, detail: unknown): void {
  console.warn(`[queries] ${scope}:`, detail);
}

// ---------------------------------------------------------------------------

export async function getSiteSettings(supabase: TypedSupabaseClient): Promise<SiteSettings | null> {
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();

  if (error) {
    warn('getSiteSettings', error.message);
    return null;
  }
  if (!data) return null;

  const theme = themeSchema.safeParse(data.theme);
  if (!theme.success) {
    warn('site_settings.theme tidak valid, memakai tema bawaan', theme.error.issues);
  }

  const navItems = navItemsSchema.safeParse(data.nav_items);
  if (!navItems.success) {
    warn('site_settings.nav_items tidak valid, memakai daftar kosong', navItems.error.issues);
  }

  return {
    ...data,
    theme: theme.success ? theme.data : DEFAULT_THEME,
    nav_items: navItems.success ? navItems.data : [],
  };
}

/** Validasi content sebuah baris sections sesuai type-nya. */
function parseSection(row: SectionRow): Section | null {
  const schema = sectionContentSchemas[row.type];
  if (!schema) {
    warn('type section tidak dikenal', row.type);
    return null;
  }

  const parsed = schema.safeParse(row.content ?? {});
  if (!parsed.success) {
    warn(`content section "${row.key}" tidak valid, section dilewati`, parsed.error.issues);
    return null;
  }

  const { content: _raw, ...rest } = row;
  return { ...rest, type: row.type, content: parsed.data } as Section;
}

export async function getVisibleSections(supabase: TypedSupabaseClient): Promise<Section[]> {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error) {
    warn('getVisibleSections', error.message);
    return [];
  }

  return (data ?? []).map(parseSection).filter((section): section is Section => section !== null);
}

/** Semua section termasuk yang disembunyikan. Hanya untuk halaman admin. */
export async function getAllSections(supabase: TypedSupabaseClient): Promise<Section[]> {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    warn('getAllSections', error.message);
    return [];
  }

  return (data ?? []).map(parseSection).filter((section): section is Section => section !== null);
}

export async function getSectionById(
  supabase: TypedSupabaseClient,
  id: string,
): Promise<SectionRow | null> {
  const { data, error } = await supabase.from('sections').select('*').eq('id', id).maybeSingle();

  if (error) {
    warn('getSectionById', error.message);
    return null;
  }

  return data;
}

export interface GetProjectsOptions {
  limit?: number;
  featuredOnly?: boolean;
  /** Sertakan draft. Hanya berhasil bila sesi yang dipakai adalah admin. */
  includeUnpublished?: boolean;
}

export async function getProjects(
  supabase: TypedSupabaseClient,
  options: GetProjectsOptions = {},
): Promise<Project[]> {
  let query = supabase.from('projects').select('*').order('sort_order', { ascending: true });

  if (!options.includeUnpublished) {
    query = query.eq('is_published', true);
  }
  if (options.featuredOnly) {
    query = query.eq('featured', true);
  }
  if (options.limit !== undefined) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    warn('getProjects', error.message);
    return [];
  }

  return data ?? [];
}

export async function getProjectBySlug(
  supabase: TypedSupabaseClient,
  slug: string,
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    warn('getProjectBySlug', error.message);
    return null;
  }

  return data;
}

export async function getSkills(
  supabase: TypedSupabaseClient,
  options: { includeHidden?: boolean } = {},
): Promise<Skill[]> {
  let query = supabase.from('skills').select('*').order('sort_order', { ascending: true });
  if (!options.includeHidden) {
    query = query.eq('is_visible', true);
  }

  const { data, error } = await query;

  if (error) {
    warn('getSkills', error.message);
    return [];
  }

  return data ?? [];
}

export async function getExperiences(
  supabase: TypedSupabaseClient,
  options: { includeHidden?: boolean } = {},
): Promise<Experience[]> {
  let query = supabase.from('experiences').select('*').order('sort_order', { ascending: true });
  if (!options.includeHidden) {
    query = query.eq('is_visible', true);
  }

  const { data, error } = await query;

  if (error) {
    warn('getExperiences', error.message);
    return [];
  }

  return data ?? [];
}

export async function getSocialLinks(
  supabase: TypedSupabaseClient,
  options: { includeHidden?: boolean } = {},
): Promise<SocialLink[]> {
  let query = supabase.from('social_links').select('*').order('sort_order', { ascending: true });
  if (!options.includeHidden) {
    query = query.eq('is_visible', true);
  }

  const { data, error } = await query;

  if (error) {
    warn('getSocialLinks', error.message);
    return [];
  }

  return data ?? [];
}

/** Dipakai dashboard admin. */
export async function getAdminStats(supabase: TypedSupabaseClient): Promise<{
  projects: number;
  skills: number;
  experiences: number;
  socialLinks: number;
  lastUpdated: string | null;
}> {
  const [projects, skills, experiences, socialLinks, settings] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('skills').select('*', { count: 'exact', head: true }),
    supabase.from('experiences').select('*', { count: 'exact', head: true }),
    supabase.from('social_links').select('*', { count: 'exact', head: true }),
    supabase.from('site_settings').select('updated_at').eq('id', 1).maybeSingle(),
  ]);

  return {
    projects: projects.count ?? 0,
    skills: skills.count ?? 0,
    experiences: experiences.count ?? 0,
    socialLinks: socialLinks.count ?? 0,
    lastUpdated: settings.data?.updated_at ?? null,
  };
}

/** Kategori unik dari proyek terbit, untuk filter di ProjectsSection. */
export function collectCategories(projects: Project[]): string[] {
  const set = new Set<string>();
  for (const project of projects) {
    if (project.category) set.add(project.category);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'id'));
}
