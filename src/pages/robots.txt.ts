import type { APIRoute } from 'astro';

export const GET: APIRoute = (context) => {
  const origin = context.site?.origin ?? context.url.origin;

  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${origin}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
