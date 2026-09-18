import type { APIRoute } from 'astro';
import { getProjects } from '../lib/queries';

/**
 * Sitemap dibuat saat request, bukan saat build, supaya proyek baru langsung
 * muncul tanpa perlu deploy ulang.
 */
export const GET: APIRoute = async (context) => {
  const origin = context.site?.origin ?? context.url.origin;
  const supabase = context.locals.supabase;
  const projects = supabase ? await getProjects(supabase) : [];

  const urls = [
    { loc: `${origin}/`, lastmod: null, priority: '1.0' },
    ...projects.map((project) => ({
      loc: `${origin}/projects/${project.slug}`,
      lastmod: project.updated_at,
      priority: '0.8',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url>\n    <loc>${url.loc}</loc>\n${
        url.lastmod ? `    <lastmod>${new Date(url.lastmod).toISOString()}</lastmod>\n` : ''
      }    <priority>${url.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
