import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient, hasSupabaseEnv } from './lib/supabase';

/** Halaman di bawah /admin yang boleh diakses tanpa sesi. */
const PUBLIC_ADMIN_PATHS = new Set(['/admin/login']);

export const onRequest = defineMiddleware(async (context, next) => {
  const authHeaders: Record<string, string> = {};

  context.locals.supabase = hasSupabaseEnv()
    ? createSupabaseServerClient({
        request: context.request,
        cookies: context.cookies,
        onAuthHeaders: (headers) => Object.assign(authHeaders, headers),
      })
    : null;
  context.locals.user = null;
  context.locals.isAdmin = false;

  const pathname = context.url.pathname.replace(/\/+$/, '') || '/';
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAuthApi = pathname.startsWith('/api/auth/');
  const isAdminApi = pathname.startsWith('/api/admin/');
  const needsSession = isAdminArea || isAuthApi || isAdminApi;

  const supabase = context.locals.supabase;

  if (supabase && needsSession) {
    // getUser() memvalidasi token ke server Supabase, tidak percaya isi cookie.
    const { data } = await supabase.auth.getUser();
    context.locals.user = data.user ?? null;

    if (context.locals.user) {
      const { data: isAdmin, error } = await supabase.rpc('is_admin');
      context.locals.isAdmin = error ? false : isAdmin === true;
    }
  }

  // Endpoint admin dipanggil lewat fetch, jadi balas JSON, bukan redirect.
  if (isAdminApi) {
    if (!supabase) {
      return Response.json({ message: 'Supabase belum dikonfigurasi.' }, { status: 500 });
    }
    if (!context.locals.user || !context.locals.isAdmin) {
      return Response.json({ message: 'Kamu tidak punya akses admin.' }, { status: 403 });
    }
  }

  if (isAdminArea && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    if (!supabase) {
      return context.redirect('/admin/login?error=config');
    }
    if (!context.locals.user) {
      return context.redirect('/admin/login?error=auth');
    }
    if (!context.locals.isAdmin) {
      // Sesi sah tapi bukan admin: cabut sesinya, jangan biarkan menggantung.
      await supabase.auth.signOut();
      return context.redirect('/admin/login?error=forbidden');
    }
  }

  // Sudah admin tapi membuka halaman login: langsung ke dashboard.
  if (pathname === '/admin/login' && context.locals.isAdmin) {
    return context.redirect('/admin');
  }

  const response = await next();

  if (isAdminArea || isAuthApi || isAdminApi) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
  }
  for (const [key, value] of Object.entries(authHeaders)) {
    response.headers.set(key, value);
  }

  return response;
});
