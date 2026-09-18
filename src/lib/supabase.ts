import { createBrowserClient, createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import type { Database } from '../types/database';

export type TypedSupabaseClient = SupabaseClient<Database, 'public'>;

/** Hanya anon key yang dipakai. service_role tidak pernah digunakan di proyek ini. */
function readEnv(): { url: string; anonKey: string } {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_ANON_KEY belum diisi. Salin .env.example menjadi .env lalu isi nilainya.',
    );
  }

  return { url, anonKey };
}

/** Benar bila kedua environment variable Supabase tersedia. */
export function hasSupabaseEnv(): boolean {
  return Boolean(import.meta.env.PUBLIC_SUPABASE_URL && import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
}

export interface ServerClientContext {
  request: Request;
  cookies: AstroCookies;
  /**
   * Dipanggil saat Supabase menulis ulang cookie sesi. Header yang diberikan
   * melarang CDN menyimpan respons tersebut, jadi wajib dipasang ke Response.
   */
  onAuthHeaders?: (headers: Record<string, string>) => void;
}

/**
 * Client sisi server berbasis cookie. Buat instance baru untuk tiap request,
 * jangan pernah dipakai ulang antar request.
 */
export function createSupabaseServerClient(context: ServerClientContext): TypedSupabaseClient {
  const { url, anonKey } = readEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        const header = context.request.headers.get('Cookie') ?? '';
        return parseCookieHeader(header)
          .filter((cookie): cookie is { name: string; value: string } => cookie.value !== undefined)
          .map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          context.cookies.set(name, value, {
            domain: options.domain,
            expires: options.expires,
            httpOnly: options.httpOnly,
            maxAge: options.maxAge,
            path: options.path ?? '/',
            sameSite: options.sameSite,
            secure: options.secure,
          });
        }

        if (Object.keys(headers).length > 0) {
          context.onAuthHeaders?.(headers);
        }
      },
    },
  });
}

/** Client sisi browser, dipakai di React island. */
export function createSupabaseBrowserClient(): TypedSupabaseClient {
  const { url, anonKey } = readEnv();
  return createBrowserClient<Database>(url, anonKey);
}
