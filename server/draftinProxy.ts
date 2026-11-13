import type { IncomingMessage, ServerResponse } from 'node:http';
import type { DraftinPost } from '../src/services/draftin/posts.types';
import {
  createExcerpt,
  detectContentFormat,
  extractFirstImageUrl,
  resolveAssetUrl,
} from '../src/utils/content';

export interface DraftinProxyConfig {
  apiKey?: string;
  baseUrl: string;
  cacheTtlMs: number;
  siteUrl: string;
  blogTitle: string;
  blogDescription: string;
  authorName?: string;
  fetchImpl?: typeof fetch;
}

interface CachedEntry {
  status: number;
  contentType: string;
  body: string;
  requestId?: string;
  expiresAt: number;
}

const ALLOWED_GET_PATTERNS: RegExp[] = [
  /^\/public\/posts$/,
  /^\/public\/posts\/slug\/[^/]+$/,
  /^\/public\/posts\/[^/]+$/,
  /^\/public\/categories$/,
  /^\/public\/tags$/,
  /^\/version$/,
];

function isAllowedUpstreamPath(pathname: string): boolean {
  return ALLOWED_GET_PATTERNS.some((pattern) => pattern.test(pathname));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function loadProxyConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): DraftinProxyConfig {
  const port = env.PORT || '4173';
  return {
    apiKey: env.DRAFTIN_API_KEY?.trim() || undefined,
    baseUrl: (env.DRAFTIN_BASE_URL?.trim() || 'https://api.draftin.io').replace(
      /\/$/,
      '',
    ),
    cacheTtlMs: Math.max(0, Number(env.DRAFTIN_CACHE_TTL_MS ?? 60_000) || 60_000),
    siteUrl: (env.SITE_URL?.trim() || `http://localhost:${port}`).replace(/\/$/, ''),
    blogTitle: env.VITE_BLOG_TITLE?.trim() || 'Caderno de Notas',
    blogDescription:
      env.VITE_BLOG_TAGLINE?.trim() ||
      'Ensaios sobre tecnologia, arquitetura de software e design editorial.',
    authorName: env.VITE_BLOG_AUTHOR?.trim() || undefined,
  };
}

export function createDraftinServerService(config: DraftinProxyConfig) {
  const cache = new Map<string, CachedEntry>();
  const inflight = new Map<string, Promise<CachedEntry>>();
  const fetchFn = config.fetchImpl ?? fetch;

  async function fetchUpstream(
    upstreamPathWithQuery: string,
    requiresAuth: boolean,
  ): Promise<CachedEntry> {
    if (requiresAuth && !config.apiKey) {
      return {
        status: 503,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: false,
          error: {
            message:
              'DRAFTIN_API_KEY não configurada no servidor. Defina a variável em .env para conectar ao DraftIn.',
            code: 'CONFIGURATION_ERROR',
            type: 'configuration',
            statusCode: 503,
            retryable: false,
            path: upstreamPathWithQuery,
            requestId: 'local_missing_key',
            docs: 'https://draftin.io/pt/docs/authentication/',
          },
        }),
        expiresAt: 0,
      };
    }

    const now = Date.now();
    const cached = cache.get(upstreamPathWithQuery);
    if (cached && cached.expiresAt > now) {
      return cached;
    }

    const pending = inflight.get(upstreamPathWithQuery);
    if (pending) {
      return pending;
    }

    const promise = (async (): Promise<CachedEntry> => {
      const targetUrl = `${config.baseUrl}${upstreamPathWithQuery}`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (requiresAuth && config.apiKey) {
        headers['X-API-Key'] = config.apiKey;
      }

      const maxAttempts = 3;
      let lastRes: Response | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const res = await fetchFn(targetUrl, { method: 'GET', headers });
        lastRes = res;

        if (res.status === 429 && attempt < maxAttempts - 1) {
          const retryAfterSec = Number(res.headers.get('Retry-After') ?? 1);
          const delayMs = Math.min(
            Math.max(250, (Number.isFinite(retryAfterSec) ? retryAfterSec : 1) * 1000),
            10_000,
          );
          await sleep(delayMs);
          continue;
        }

        if (res.status >= 500 && attempt < maxAttempts - 1) {
          await sleep(2 ** attempt * 300);
          continue;
        }

        break;
      }

      if (!lastRes) {
        throw new Error('Falha ao consultar DraftIn');
      }

      const body = await lastRes.text();
      const contentType =
        lastRes.headers.get('content-type') || 'application/json; charset=utf-8';
      const requestId = lastRes.headers.get('x-request-id') ?? undefined;

      const entry: CachedEntry = {
        status: lastRes.status,
        contentType,
        body,
        requestId,
        expiresAt:
          lastRes.status === 200 && config.cacheTtlMs > 0
            ? Date.now() + config.cacheTtlMs
            : 0,
      };

      if (entry.expiresAt > 0) {
        cache.set(upstreamPathWithQuery, entry);
      }

      return entry;
    })().finally(() => {
      inflight.delete(upstreamPathWithQuery);
    });

    inflight.set(upstreamPathWithQuery, promise);
    return promise;
  }

  async function handleApiRequest(
    req: IncomingMessage,
    res: ServerResponse,
    reqUrl: URL,
  ): Promise<void> {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {
        'Content-Type': 'application/json; charset=utf-8',
        Allow: 'GET, HEAD',
      });
      res.end(
        JSON.stringify({
          success: false,
          error: {
            message: 'Método não permitido no proxy público.',
            code: 'METHOD_NOT_ALLOWED',
            type: 'method_not_allowed',
            statusCode: 405,
            retryable: false,
            path: reqUrl.pathname,
            requestId: 'local_proxy',
            docs: 'https://draftin.io/pt/docs/http-status-codes/',
          },
        }),
      );
      return;
    }

    const upstreamPath = reqUrl.pathname.replace(/^\/api\/draftin/, '') || '/';
    if (!isAllowedUpstreamPath(upstreamPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          success: false,
          error: {
            message: 'Endpoint não suportado pelo proxy.',
            code: 'NOT_FOUND',
            type: 'not_found',
            statusCode: 404,
            retryable: false,
            path: upstreamPath,
            requestId: 'local_proxy',
            docs: 'https://draftin.io/pt/docs/',
          },
        }),
      );
      return;
    }

    const upstreamQuery = reqUrl.searchParams.toString();
    const fullUpstreamPath = `${upstreamPath}${upstreamQuery ? `?${upstreamQuery}` : ''}`;
    const requiresAuth = upstreamPath !== '/version';

    try {
      const entry = await fetchUpstream(fullUpstreamPath, requiresAuth);
      const responseHeaders: Record<string, string> = {
        'Content-Type': entry.contentType,
        'Cache-Control':
          entry.status === 200
            ? `public, max-age=${Math.floor(config.cacheTtlMs / 1000)}`
            : 'no-store',
      };
      if (entry.requestId) {
        responseHeaders['X-Request-Id'] = entry.requestId;
      }

      res.writeHead(entry.status, responseHeaders);
      res.end(req.method === 'HEAD' ? undefined : entry.body);
    } catch (error) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          success: false,
          error: {
            message:
              error instanceof Error
                ? `Erro ao comunicar com DraftIn: ${error.message}`
                : 'Erro ao comunicar com DraftIn.',
            code: 'UPSTREAM_ERROR',
            type: 'upstream',
            statusCode: 502,
            retryable: true,
            path: upstreamPath,
            requestId: 'local_proxy',
            docs: 'https://draftin.io/pt/docs/',
          },
        }),
      );
    }
  }

  async function fetchAllPublishedPosts(): Promise<DraftinPost[]> {
    if (!config.apiKey) return [];
    const collected: DraftinPost[] = [];
    const limit = 100;

    for (let offset = 0; ; offset += limit) {
      const entry = await fetchUpstream(
        `/public/posts?status=PUBLISHED&limit=${limit}&offset=${offset}`,
        true,
      );
      if (entry.status !== 200) break;

      const parsed = JSON.parse(entry.body) as { data?: DraftinPost[] };
      const batch = Array.isArray(parsed.data) ? parsed.data : [];
      collected.push(...batch.filter((post) => post.status === 'PUBLISHED'));
      if (batch.length < limit) break;
    }

    return collected;
  }

  async function generateSitemapXml(originOverride?: string): Promise<string> {
    const base = (originOverride || config.siteUrl).replace(/\/$/, '');
    let posts: DraftinPost[] = [];
    try {
      posts = await fetchAllPublishedPosts();
    } catch {
      posts = [];
    }

    const urls = [
      `  <url>\n    <loc>${escapeXml(`${base}/`)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
      ...posts.map((post) => {
        const loc = `${base}/artigos/${encodeURIComponent(post.slug)}`;
        const lastmodRaw = post.updatedAt || post.publishedAt || post.createdAt;
        const lastmod = lastmodRaw ? new Date(lastmodRaw).toISOString() : undefined;
        return [
          '  <url>',
          `    <loc>${escapeXml(loc)}</loc>`,
          lastmod ? `    <lastmod>${escapeXml(lastmod)}</lastmod>` : null,
          '    <changefreq>weekly</changefreq>',
          '    <priority>0.8</priority>',
          '  </url>',
        ]
          .filter(Boolean)
          .join('\n');
      }),
    ];

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
      '',
    ].join('\n');
  }

  async function renderDocumentWithSeo(
    templateHtml: string,
    reqUrl: URL,
    originOverride?: string,
  ): Promise<{ html: string; statusCode: number }> {
    const base = (originOverride || config.siteUrl).replace(/\/$/, '');
    const articleMatch = reqUrl.pathname.match(/^\/artigos\/([^/]+)\/?$/);

    if (!articleMatch) {
      const canonical = `${base}${reqUrl.pathname === '/' ? '/' : reqUrl.pathname}`;
      return {
        statusCode: 200,
        html: replaceMetaTags(templateHtml, {
          title: config.blogTitle,
          description: config.blogDescription,
          canonical,
          ogType: 'website',
          twitterCard: 'summary',
        }),
      };
    }

    const slug = decodeURIComponent(articleMatch[1]);
    try {
      const entry = await fetchUpstream(
        `/public/posts/slug/${encodeURIComponent(slug)}`,
        true,
      );

      if (entry.status === 404) {
        return {
          statusCode: 404,
          html: replaceMetaTags(templateHtml, {
            title: `Artigo não encontrado · ${config.blogTitle}`,
            description: 'O artigo solicitado não existe ou não está disponível.',
            canonical: `${base}/artigos/${encodeURIComponent(slug)}`,
            ogType: 'website',
            twitterCard: 'summary',
            robots: 'noindex, nofollow',
          }),
        };
      }

      if (entry.status === 200) {
        const parsed = JSON.parse(entry.body) as { data?: DraftinPost };
        const post = parsed.data;
        if (post && post.status === 'PUBLISHED') {
          const content = post.content || '';
          const format = detectContentFormat(content);
          const description =
            createExcerpt(post.subtitle, content, format, 160) || config.blogDescription;
          const image =
            resolveAssetUrl(
              post.coverUrl ?? post.bannerUrl ?? post.coverImage,
              config.baseUrl,
            ) ?? extractFirstImageUrl(content, format, config.baseUrl);
          const canonical = `${base}/artigos/${encodeURIComponent(post.slug)}`;

          const jsonLd = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description,
            datePublished: post.publishedAt ?? post.createdAt,
            dateModified: post.updatedAt ?? post.publishedAt ?? post.createdAt,
            url: canonical,
            image: image || undefined,
            author: config.authorName
              ? { '@type': 'Person', name: config.authorName }
              : undefined,
          }).replace(/</g, '\\u003c');

          return {
            statusCode: 200,
            html: replaceMetaTags(templateHtml, {
              title: `${post.title} · ${config.blogTitle}`,
              description,
              canonical,
              ogType: 'article',
              image,
              publishedTime: post.publishedAt ?? undefined,
              modifiedTime: post.updatedAt,
              twitterCard: image ? 'summary_large_image' : 'summary',
              jsonLd,
            }),
          };
        }
      }
    } catch {
      // Fallback para meta padrão se upstream estiver indisponível durante renderização SSR de tags
    }

    return {
      statusCode: 200,
      html: replaceMetaTags(templateHtml, {
        title: config.blogTitle,
        description: config.blogDescription,
        canonical: `${base}${reqUrl.pathname}`,
        ogType: 'article',
        twitterCard: 'summary',
      }),
    };
  }

  function clearCache() {
    cache.clear();
  }

  return {
    handleApiRequest,
    generateSitemapXml,
    renderDocumentWithSeo,
    clearCache,
  };
}

function replaceMetaTags(
  html: string,
  meta: {
    title: string;
    description: string;
    canonical: string;
    ogType: 'website' | 'article';
    twitterCard: 'summary' | 'summary_large_image';
    image?: string;
    publishedTime?: string;
    modifiedTime?: string;
    robots?: string;
    jsonLd?: string;
  },
): string {
  const headTags = [
    `<title>${escapeHtmlAttr(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtmlAttr(meta.canonical)}" />`,
    meta.robots
      ? `<meta name="robots" content="${escapeHtmlAttr(meta.robots)}" />`
      : null,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:title" content="${escapeHtmlAttr(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(meta.canonical)}" />`,
    meta.image
      ? `<meta property="og:image" content="${escapeHtmlAttr(meta.image)}" />`
      : null,
    meta.publishedTime
      ? `<meta property="article:published_time" content="${escapeHtmlAttr(meta.publishedTime)}" />`
      : null,
    meta.modifiedTime
      ? `<meta property="article:modified_time" content="${escapeHtmlAttr(meta.modifiedTime)}" />`
      : null,
    `<meta name="twitter:card" content="${meta.twitterCard}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" />`,
    meta.image
      ? `<meta name="twitter:image" content="${escapeHtmlAttr(meta.image)}" />`
      : null,
    meta.jsonLd
      ? `<script type="application/ld+json">${meta.jsonLd}</script>`
      : null,
  ]
    .filter(Boolean)
    .join('\n    ');

  let cleaned = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '');

  return cleaned.replace('</head>', `    ${headTags}\n  </head>`);
}

