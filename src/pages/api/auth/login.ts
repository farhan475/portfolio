import type { APIRoute } from 'astro';
import { loginSchema } from '../../../lib/schemas';

export const POST: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  if (!supabase) {
    return context.redirect('/admin/login?error=config', 303);
  }

  const form = await context.request.formData();
  const parsed = loginSchema.safeParse({
    email: String(form.get('email') ?? ''),
    password: String(form.get('password') ?? ''),
  });

  if (!parsed.success) {
    return context.redirect('/admin/login?error=invalid', 303);
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return context.redirect('/admin/login?error=credentials', 303);
  }

  // Sesi sah belum tentu admin. Tolak di sini juga, jangan hanya di middleware.
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
  if (rpcError || isAdmin !== true) {
    await supabase.auth.signOut();
    return context.redirect('/admin/login?error=forbidden', 303);
  }

  return context.redirect('/admin', 303);
};

/** Buka /api/auth/login langsung lewat browser: kembalikan ke form. */
export const GET: APIRoute = (context) => context.redirect('/admin/login', 303);
