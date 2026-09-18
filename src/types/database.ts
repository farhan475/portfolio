/**
 * Tipe database hasil pemetaan manual dari supabase/schema-portfolio.sql.
 * Ganti dengan keluaran `supabase gen types typescript` bila sudah tersedia.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SectionType =
  | 'hero'
  | 'about'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'contact'
  | 'custom';

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          site_title: string;
          meta_description: string | null;
          og_image_url: string | null;
          favicon_url: string | null;
          logo_text: string | null;
          logo_url: string | null;
          theme: Json;
          nav_items: Json;
          footer_text: string | null;
          resume_url: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          site_title: string;
          meta_description?: string | null;
          og_image_url?: string | null;
          favicon_url?: string | null;
          logo_text?: string | null;
          logo_url?: string | null;
          theme?: Json;
          nav_items?: Json;
          footer_text?: string | null;
          resume_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          site_title?: string;
          meta_description?: string | null;
          og_image_url?: string | null;
          favicon_url?: string | null;
          logo_text?: string | null;
          logo_url?: string | null;
          theme?: Json;
          nav_items?: Json;
          footer_text?: string | null;
          resume_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sections: {
        Row: {
          id: string;
          key: string;
          type: SectionType;
          title: string | null;
          subtitle: string | null;
          content: Json;
          sort_order: number;
          is_visible: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          type: SectionType;
          title?: string | null;
          subtitle?: string | null;
          content?: Json;
          sort_order?: number;
          is_visible?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          type?: SectionType;
          title?: string | null;
          subtitle?: string | null;
          content?: Json;
          sort_order?: number;
          is_visible?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          content: string | null;
          category: string | null;
          image_url: string | null;
          gallery: string[];
          tech_stack: string[];
          github_url: string | null;
          demo_url: string | null;
          featured: boolean;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          content?: string | null;
          category?: string | null;
          image_url?: string | null;
          gallery?: string[];
          tech_stack?: string[];
          github_url?: string | null;
          demo_url?: string | null;
          featured?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          content?: string | null;
          category?: string | null;
          image_url?: string | null;
          gallery?: string[];
          tech_stack?: string[];
          github_url?: string | null;
          demo_url?: string | null;
          featured?: boolean;
          is_published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          name: string;
          category: string;
          icon: string | null;
          sort_order: number;
          is_visible: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          icon?: string | null;
          sort_order?: number;
          is_visible?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          icon?: string | null;
          sort_order?: number;
          is_visible?: boolean;
        };
        Relationships: [];
      };
      experiences: {
        Row: {
          id: string;
          role: string;
          company: string;
          company_url: string | null;
          location: string | null;
          start_date: string;
          end_date: string | null;
          description: string | null;
          sort_order: number;
          is_visible: boolean;
        };
        Insert: {
          id?: string;
          role: string;
          company: string;
          company_url?: string | null;
          location?: string | null;
          start_date: string;
          end_date?: string | null;
          description?: string | null;
          sort_order?: number;
          is_visible?: boolean;
        };
        Update: {
          id?: string;
          role?: string;
          company?: string;
          company_url?: string | null;
          location?: string | null;
          start_date?: string;
          end_date?: string | null;
          description?: string | null;
          sort_order?: number;
          is_visible?: boolean;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          id: string;
          platform: string;
          url: string;
          icon: string | null;
          sort_order: number;
          is_visible: boolean;
        };
        Insert: {
          id?: string;
          platform: string;
          url: string;
          icon?: string | null;
          sort_order?: number;
          is_visible?: boolean;
        };
        Update: {
          id?: string;
          platform?: string;
          url?: string;
          icon?: string | null;
          sort_order?: number;
          is_visible?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];

export type SiteSettingsRow = Tables<'site_settings'>;
export type SectionRow = Tables<'sections'>;
export type ProjectRow = Tables<'projects'>;
export type SkillRow = Tables<'skills'>;
export type ExperienceRow = Tables<'experiences'>;
export type SocialLinkRow = Tables<'social_links'>;
