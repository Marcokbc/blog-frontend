import { PassThrough } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import { createDraftinServerService } from './draftinProxy';

function createMockReqRes(method: string, urlPath: string) {
  const req = new PassThrough() as unknown as IncomingMessage;
  req.method = method;
  req.url = urlPath;
  req.headers = { host: 'localhost:4173' };

  let statusCode = 200;
  let headers: Record<string, string | string[]> = {};
  const chunks: Buffer[] = [];

  const res = {
    writeHead(status: number, hdrs?: Record<string, string | string[]>) {
      statusCode = status;
      if (hdrs) headers = { ...headers, ...hdrs };
      return res;
    },
    end(chunk?: string | Buffer) {
      if (chunk) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
    },
  } as unknown as ServerResponse;

  return {
    req,
    res,
    url: new URL(urlPath, 'http://localhost:4173'),
    result: () => ({
      statusCode,
      headers,
      body: Buffer.concat(chunks).toString('utf-8'),
    }),
  };
}

describe('server/draftinProxy', () => {
  it('retorna 503 CONFIGURATION_ERROR quando DRAFTIN_API_KEY está ausente', async () => {
    const service = createDraftinServerService({
      baseUrl: 'https://api.draftin.io',
      cacheTtlMs: 60_000,
      siteUrl: 'http://localhost:4173',
      blogTitle: 'Caderno',
      blogDescription: 'Notas',
    });

    const { req, res, url, result } = createMockReqRes(
      'GET',
      '/api/draftin/public/posts',
    );
    await service.handleApiRequest(req, res, url);

    const out = result();
    expect(out.statusCode).toBe(503);
    expect(JSON.parse(out.body).error.code).toBe('CONFIGURATION_ERROR');
  });

  it('injeta X-API-Key no servidor, aplica cache e coalesce de requisições concorrentes', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>)['X-API-Key']).toBe(
        'dra_secret_key',
      );
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 'p1',
              title: 'Post 1',
              subtitle: 'Sub',
              content: '<p>Corpo</p>',
              slug: 'post-1',
              status: 'PUBLISHED',
              publishedAt: '2026-07-01T10:00:00.000Z',
              scheduledAt: null,
              blogId: 'b1',
              authorId: 'a1',
              createdAt: '2026-07-01T10:00:00.000Z',
              updatedAt: '2026-07-01T10:00:00.000Z',
              categories: [],
              tags: [],
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': 'req_123',
          },
        },
      );
    });

    const service = createDraftinServerService({
      apiKey: 'dra_secret_key',
      baseUrl: 'https://api.draftin.io',
      cacheTtlMs: 60_000,
      siteUrl: 'https://meublog.dev',
      blogTitle: 'Caderno',
      blogDescription: 'Notas',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const r1 = createMockReqRes('GET', '/api/draftin/public/posts?limit=10&offset=0');
    const r2 = createMockReqRes('GET', '/api/draftin/public/posts?limit=10&offset=0');

    await Promise.all([
      service.handleApiRequest(r1.req, r1.res, r1.url),
      service.handleApiRequest(r2.req, r2.res, r2.url),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r1.result().statusCode).toBe(200);
    expect(r2.result().headers['X-Request-Id']).toBe('req_123');
  });

  it('bloqueia métodos não permitidos e gera sitemap + SEO HTML dinâmico', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/public/posts/slug/ensaio-1')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              id: 'p1',
              title: 'Ensaio Um',
              subtitle: 'Subtítulo SEO',
              content: '<p>Texto com <img src="https://cdn.site/capa.jpg" /></p>',
              slug: 'ensaio-1',
              status: 'PUBLISHED',
              publishedAt: '2026-07-01T10:00:00.000Z',
              scheduledAt: null,
              blogId: 'b1',
              authorId: 'a1',
              createdAt: '2026-07-01T10:00:00.000Z',
              updatedAt: '2026-07-02T10:00:00.000Z',
              categories: [],
              tags: [],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/public/posts/slug/nao-existe')) {
        return new Response(
          JSON.stringify({ success: false, error: { code: 'NOT_FOUND' } }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              id: 'p1',
              title: 'Ensaio Um',
              subtitle: 'Subtítulo SEO',
              content: '<p>Texto</p>',
              slug: 'ensaio-1',
              status: 'PUBLISHED',
              publishedAt: '2026-07-01T10:00:00.000Z',
              scheduledAt: null,
              blogId: 'b1',
              authorId: 'a1',
              createdAt: '2026-07-01T10:00:00.000Z',
              updatedAt: '2026-07-02T10:00:00.000Z',
              categories: [],
              tags: [],
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const service = createDraftinServerService({
      apiKey: 'dra_secret_key',
      baseUrl: 'https://api.draftin.io',
      cacheTtlMs: 60_000,
      siteUrl: 'https://meublog.dev',
      blogTitle: 'Caderno',
      blogDescription: 'Notas',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    const postReq = createMockReqRes('POST', '/api/draftin/public/posts');
    await service.handleApiRequest(postReq.req, postReq.res, postReq.url);
    expect(postReq.result().statusCode).toBe(405);

    const sitemap = await service.generateSitemapXml();
    expect(sitemap).toContain('<loc>https://meublog.dev/artigos/ensaio-1</loc>');

    const template = '<html><head><title>Old</title></head><body></body></html>';
    const okSeo = await service.renderDocumentWithSeo(
      template,
      new URL('https://meublog.dev/artigos/ensaio-1'),
    );
    expect(okSeo.statusCode).toBe(200);
    expect(okSeo.html).toContain('<title>Ensaio Um · Caderno</title>');
    expect(okSeo.html).toContain('property="og:image" content="https://cdn.site/capa.jpg"');

    const notFoundSeo = await service.renderDocumentWithSeo(
      template,
      new URL('https://meublog.dev/artigos/nao-existe'),
    );
    expect(notFoundSeo.statusCode).toBe(404);
    expect(notFoundSeo.html).toContain('noindex, nofollow');
  });
});

