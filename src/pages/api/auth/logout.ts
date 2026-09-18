import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  await context.locals.supabase?.auth.signOut();
  return context.redirect('/admin/login?notice=logout', 303);
};

export const GET: APIRoute = (context) => context.redirect('/admin/login', 303);
