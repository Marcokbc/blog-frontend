import type { IncomingMessage, ServerResponse } from 'node:http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import draftinHandler, { _clearCacheForTests } from './draftin';
import sitemapHandler from './sitemap';

interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  writeHead: (status: number, headers?: Record<string, string>) => void;
  end: (chunk?: string) => void;
}

function createMockResponse(): MockResponse & ServerResponse {
  const res: MockResponse = {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(status: number, headers?: Record<string, string>) {
      res.statusCode = status;
      if (headers) Object.assign(res.headers, headers);
    },
    end(chunk?: string) {
      if (chunk) res.body += chunk;
    },
  };
  return res as unknown as MockResponse & ServerResponse;
}

describe('Vercel Serverless Functions (/api)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    _clearCacheForTests();
    process.env = {
      ...originalEnv,
      DRAFTIN_API_KEY: 'dra_test_key_vercel',
      DRAFTIN_BASE_URL: 'https://api.draftin.io',
      SITE_URL: 'https://blog-frontend-topaz-kappa.vercel.app',
    };
  });

  it('deve delegar a rota /api/draftin/version corretamente', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
      text: async () => JSON.stringify({ success: true, data: { version: '1.0.0' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = {
      method: 'GET',
      url: '/api/draftin?__path=version',
      headers: {
        host: 'blog-frontend-topaz-kappa.vercel.app',
        'x-forwarded-proto': 'https',
      },
    } as unknown as IncomingMessage;

    const res = createMockResponse();

    await draftinHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      success: true,
      data: { version: '1.0.0' },
    });
  });

  it('deve propagar parâmetros de busca (query) no proxy do Vercel', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
      text: async () => JSON.stringify({ success: true, data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = {
      method: 'GET',
      url: '/api/draftin?__path=public/posts&status=PUBLISHED&limit=20&offset=0',
      headers: {
        host: 'blog-frontend-topaz-kappa.vercel.app',
        'x-forwarded-proto': 'https',
      },
    } as unknown as IncomingMessage;

    const res = createMockResponse();

    await draftinHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.draftin.io/public/posts?status=PUBLISHED&limit=20&offset=0',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': 'dra_test_key_vercel',
        }),
      }),
    );
  });

  it('deve retornar 503 com mensagem clara se DRAFTIN_API_KEY não estiver no env', async () => {
    delete process.env.DRAFTIN_API_KEY;

    const req = {
      method: 'GET',
      url: '/api/draftin?__path=public/posts',
      headers: {
        host: 'blog-frontend-topaz-kappa.vercel.app',
      },
    } as unknown as IncomingMessage;

    const res = createMockResponse();

    await draftinHandler(req, res);

    expect(res.statusCode).toBe(503);
    const parsed = JSON.parse(res.body);
    expect(parsed.error.code).toBe('CONFIGURATION_ERROR');
    expect(parsed.error.message).toContain('DRAFTIN_API_KEY não configurada');
  });

  it('deve retornar 404 para caminhos de upstream não autorizados', async () => {
    const req = {
      method: 'GET',
      url: '/api/draftin?__path=admin/secret',
      headers: {
        host: 'blog-frontend-topaz-kappa.vercel.app',
      },
    } as unknown as IncomingMessage;

    const res = createMockResponse();

    await draftinHandler(req, res);

    expect(res.statusCode).toBe(404);
    const parsed = JSON.parse(res.body);
    expect(parsed.error.code).toBe('NOT_FOUND');
  });

  it('deve gerar /sitemap.xml via Serverless Function', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({
        data: [
          {
            slug: 'artigo-exemplo',
            status: 'PUBLISHED',
            updatedAt: '2026-11-10T12:00:00Z',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = {
      method: 'GET',
      url: '/sitemap.xml',
      headers: {
        host: 'blog-frontend-topaz-kappa.vercel.app',
        'x-forwarded-proto': 'https',
      },
    } as unknown as IncomingMessage;

    const res = createMockResponse();

    await sitemapHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('xml');
    expect(res.body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(res.body).toContain('<loc>https://blog-frontend-topaz-kappa.vercel.app/artigos/artigo-exemplo</loc>');
  });
});
