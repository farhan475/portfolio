/// <reference types="astro/client" />

// Tanpa import di level atas, supaya file ini tetap ambient (bukan module)
// dan deklarasi `App` benar-benar global.

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    /** Dibuat sekali per request oleh middleware. null bila env Supabase belum diisi. */
    supabase: import('./lib/supabase').TypedSupabaseClient | null;
    /** Sudah diverifikasi ke server Supabase, bukan sekadar dibaca dari cookie. */
    user: import('@supabase/supabase-js').User | null;
    /** Hasil RPC is_admin(). */
    isAdmin: boolean;
  }
}

/**
 * Pilihan mode tampilan. `system` berarti ikut `prefers-color-scheme`
 * perangkat, bukan salah satu warna tetap.
 */
type ThemePreference = 'system' | 'light' | 'dark';

/** Mode yang benar-benar terpasang setelah `system` diterjemahkan. */
type ThemeResolved = 'light' | 'dark';

interface ThemeApi {
  /** Pilihan pengguna, bukan hasil akhirnya. */
  preference(): ThemePreference;
  resolved(): ThemeResolved;
  set(preference: ThemePreference): void;
  /**
   * Keadaan berikutnya dalam siklus tombol. `system` hanya ikut bila
   * `default_mode` situs memang 'system'; kalau tidak, siklusnya cuma
   * terang <-> gelap.
   */
  next(): ThemePreference;
  cycle(): void;
}

interface Window {
  /**
   * Dipasang script inline BaseLayout di dalam <head>, jadi sudah tersedia
   * sebelum body dicat dan sebelum script komponen mana pun berjalan.
   */
  __theme?: ThemeApi;
}

interface WindowEventMap {
  'theme:change': CustomEvent<{
    preference: ThemePreference;
    resolved: ThemeResolved;
    next: ThemePreference;
  }>;
}
