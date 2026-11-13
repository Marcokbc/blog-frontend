import type { IncomingMessage, ServerResponse } from 'node:http';

interface CachedEntry {
  status: number;
  contentType: string;
  body: string;
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

const cache = new Map<string, CachedEntry>();
const inflight = new Map<string, Promise<CachedEntry>>();

export function _clearCacheForTests(): void {
  cache.clear();
  inflight.clear();
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
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
            statusCode: 405,
          },
        }),
      );
      return;
    }

    const host =
      (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost';
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const origin = `${proto}://${host}`;

    const reqUrl = new URL(req.url || '/', origin);

    // 1. Extrair caminho de upstream a partir de __path (rewrite do vercel.json) ou pathname
    const queryPath = reqUrl.searchParams.get('__path');
    reqUrl.searchParams.delete('__path');

    let upstreamPath: string;
    if (queryPath) {
      upstreamPath = queryPath.startsWith('/') ? queryPath : `/${queryPath}`;
    } else {
      const rawPath = reqUrl.pathname.replace(/^\/api\/draftin/, '');
      upstreamPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    }

    // Normalizar caminho
    if (!upstreamPath || upstreamPath === '/') {
      upstreamPath = '/';
    }

    // 2. Validar se o endpoint é permitido
    if (!isAllowedUpstreamPath(upstreamPath)) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          success: false,
          error: {
            message: 'Endpoint não suportado pelo proxy.',
            code: 'NOT_FOUND',
            statusCode: 404,
            path: upstreamPath,
          },
        }),
      );
      return;
    }

    // 3. Obter configurações do ambiente
    const apiKey = process.env.DRAFTIN_API_KEY?.trim();
    const baseUrl = (
      process.env.DRAFTIN_BASE_URL?.trim() || 'https://api.draftin.io'
    ).replace(/\/$/, '');
    const cacheTtlMs = Math.max(
      0,
      Number(process.env.DRAFTIN_CACHE_TTL_MS ?? 60_000) || 60_000,
    );

    const requiresAuth = upstreamPath !== '/version';

    if (requiresAuth && !apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          success: false,
          error: {
            message:
              'DRAFTIN_API_KEY não configurada no servidor Vercel. Acesse o painel da Vercel (Project Settings > Environment Variables) e cadastre a chave DRAFTIN_API_KEY.',
            code: 'CONFIGURATION_ERROR',
            statusCode: 503,
            docs: 'https://draftin.io/pt/docs/authentication/',
          },
        }),
      );
      return;
    }

    // 4. Montar URL de upstream com query params originais
    const upstreamQuery = reqUrl.searchParams.toString();
    const fullUpstreamPath = `${upstreamPath}${upstreamQuery ? `?${upstreamQuery}` : ''}`;
    const targetUrl = `${baseUrl}${fullUpstreamPath}`;

    // 5. Verificar cache em memória na instância ativa
    const now = Date.now();
    const cached = cache.get(fullUpstreamPath);
    if (cached && cached.expiresAt > now) {
      res.writeHead(cached.status, {
        'Content-Type': cached.contentType,
        'Cache-Control': `public, max-age=${Math.floor(cacheTtlMs / 1000)}`,
        'X-Cache': 'HIT',
      });
      res.end(req.method === 'HEAD' ? undefined : cached.body);
      return;
    }

    // 6. Deduplicação de requisições concorrentes
    let promise = inflight.get(fullUpstreamPath);
    if (!promise) {
      promise = (async (): Promise<CachedEntry> => {
        const headers: Record<string, string> = {
          Accept: 'application/json',
        };
        if (requiresAuth && apiKey) {
          headers['X-API-Key'] = apiKey;
        }

        const maxAttempts = 3;
        let lastRes: Response | null = null;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const upstreamRes = await fetch(targetUrl, { method: 'GET', headers });
          lastRes = upstreamRes;

          if (upstreamRes.status === 429) {
            const retryAfterSec = Number(upstreamRes.headers.get('retry-after')) || 1;
            const waitMs = Math.min(Math.max(retryAfterSec * 1000, 500), 3000);
            await new Promise((resolve) => setTimeout(resolve, waitMs));
            continue;
          }

          if (upstreamRes.status >= 500 && attempt < maxAttempts - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 250 * Math.pow(2, attempt)),
            );
            continue;
          }

          break;
        }

        if (!lastRes) {
          throw new Error('Sem resposta do DraftIn');
        }

        const body = await lastRes.text();
        const contentType =
          lastRes.headers.get('content-type') || 'application/json; charset=utf-8';
        const entry: CachedEntry = {
          status: lastRes.status,
          contentType,
          body,
          expiresAt:
            lastRes.status === 200 && cacheTtlMs > 0 ? Date.now() + cacheTtlMs : 0,
        };

        if (entry.expiresAt > 0) {
          cache.set(fullUpstreamPath, entry);
        }

        return entry;
      })();

      inflight.set(fullUpstreamPath, promise);
    }

    let result: CachedEntry;
    try {
      result = await promise;
    } finally {
      inflight.delete(fullUpstreamPath);
    }

    res.writeHead(result.status, {
      'Content-Type': result.contentType,
      'Cache-Control':
        result.status === 200
          ? `public, max-age=${Math.floor(cacheTtlMs / 1000)}`
          : 'no-store',
      'X-Cache': 'MISS',
    });
    res.end(req.method === 'HEAD' ? undefined : result.body);
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
          statusCode: 502,
        },
      }),
    );
  }
}
