import type { IncomingMessage, ServerResponse } from 'node:http';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const host =
    (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const origin = `${proto}://${host}`;

  const apiKey = process.env.DRAFTIN_API_KEY?.trim();
  const baseUrl = (
    process.env.DRAFTIN_BASE_URL?.trim() || 'https://api.draftin.io'
  ).replace(/\/$/, '');
  const siteUrl = (process.env.SITE_URL?.trim() || origin).replace(/\/$/, '');

  try {
    const slugs: Array<{ slug: string; updatedAt?: string }> = [];

    if (apiKey) {
      const limit = 100;
      for (let offset = 0; ; offset += limit) {
        const upstreamRes = await fetch(
          `${baseUrl}/public/posts?status=PUBLISHED&limit=${limit}&offset=${offset}`,
          {
            headers: {
              Accept: 'application/json',
              'X-API-Key': apiKey,
            },
          },
        );

        if (upstreamRes.status !== 200) break;
        const json = (await upstreamRes.json()) as {
          data?: Array<{
            slug?: string;
            status?: string;
            updatedAt?: string;
            publishedAt?: string;
          }>;
        };
        const items = Array.isArray(json.data) ? json.data : [];
        for (const item of items) {
          if (item.status === 'PUBLISHED' && item.slug) {
            slugs.push({
              slug: item.slug,
              updatedAt: item.updatedAt || item.publishedAt,
            });
          }
        }
        if (items.length < limit) break;
      }
    }

    const urls = [
      `  <url>\n    <loc>${escapeXml(siteUrl)}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
      ...slugs.map((post) => {
        const lastmod = post.updatedAt
          ? `\n    <lastmod>${escapeXml(new Date(post.updatedAt).toISOString())}</lastmod>`
          : '';
        return `  <url>\n    <loc>${escapeXml(siteUrl)}/artigos/${encodeURIComponent(post.slug)}</loc>${lastmod}\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
      }),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

    res.writeHead(200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    });
    res.end(xml);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erro ao gerar sitemap.');
  }
}
