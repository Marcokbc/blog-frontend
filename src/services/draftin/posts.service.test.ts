import { describe, expect, it, vi } from 'vitest';
import { createDraftinClient, DraftinClientError } from './client';
import { DraftinPostsService } from './posts.service';
import type { DraftinPost } from './posts.types';

function makePost(overrides: Partial<DraftinPost> = {}): DraftinPost {
  return {
    id: 'post_1',
    title: 'Sobre a forma tipográfica',
    subtitle: 'Notas iniciais',
    content: '<p>Um texto editorial denso.</p>',
    slug: 'sobre-a-forma-tipografica',
    status: 'PUBLISHED',
    publishedAt: '2026-06-15T12:00:00.000Z',
    scheduledAt: null,
    blogId: 'blog_1',
    authorId: 'author_1',
    createdAt: '2026-06-14T10:00:00.000Z',
    updatedAt: '2026-06-15T12:00:00.000Z',
    categories: [
      {
        id: 'cat_1',
        name: 'Design',
        description: 'Ensaios visuais',
        blogId: 'blog_1',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ],
    tags: [
      {
        id: 'tag_1',
        name: 'tipografia',
        blogId: 'blog_1',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('services/draftin', () => {
  it('filtra apenas PUBLISHED, ordena do mais recente ao mais antigo e detecta fim da paginação', async () => {
    const older = makePost({
      id: 'old',
      slug: 'antigo',
      title: 'Artigo Antigo',
      publishedAt: '2026-05-01T10:00:00.000Z',
    });
    const newer = makePost({
      id: 'new',
      slug: 'novo',
      title: 'Artigo Novo',
      publishedAt: '2026-07-01T10:00:00.000Z',
    });
    const draftLeak = makePost({
      id: 'draft',
      slug: 'rascunho',
      status: 'DRAFT',
    });

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          success: true,
          data: [older, draftLeak, newer],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createDraftinClient({ fetchImpl: fetchMock, maxRetries: 0 });
    const service = new DraftinPostsService(client);

    const page = await service.listPostsPage({ limit: 10, offset: 0 });
    expect(page.items.map((p) => p.slug)).toEqual(['novo', 'antigo']);
    expect(page.hasMore).toBe(false);
    expect(page.nextOffset).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/draftin/public/posts?status=PUBLISHED&limit=10&offset=0',
      expect.any(Object),
    );
  });

  it('retorna null quando getPostBySlug recebe 404', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Post não encontrado',
            code: 'NOT_FOUND',
            type: 'not_found',
            statusCode: 404,
            timestamp: '2026-07-01T00:00:00.000Z',
            retryable: false,
            path: '/public/posts/slug/inexistente',
            requestId: 'req_1',
            docs: 'https://docs.draftin.io/errors/NOT_FOUND',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createDraftinClient({ fetchImpl: fetchMock, maxRetries: 0 });
    const service = new DraftinPostsService(client);

    const post = await service.getPostBySlug('inexistente');
    expect(post).toBeNull();
  });

  it('mapeia coverUrl como banner sem duplicar imagens inline quando coverUrl está ausente', async () => {
    const withCover = makePost({
      id: 'c1',
      slug: 'com-banner',
      coverUrl: '/uploads/capa.webp',
      author: { id: 'author_1', name: 'Autor Real' },
    });
    const withoutCover = makePost({
      id: 'c2',
      slug: 'sem-banner',
      coverUrl: null,
      content: '<p>Intro</p><img src="https://cdn.example.com/inline.png" alt="inline" />',
    });

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ success: true, data: [withCover, withoutCover] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createDraftinClient({ fetchImpl: fetchMock, maxRetries: 0 });
    const service = new DraftinPostsService(client);
    const page = await service.listPostsPage({ limit: 10, offset: 0 });

    expect(page.items[0].bannerImageUrl).toBe('https://api.draftin.io/uploads/capa.webp');
    expect(page.items[0].authorName).toBe('Autor Real');
    expect(page.items[1].bannerImageUrl).toBeUndefined();
    expect(page.items[1].coverImageUrl).toBe('https://cdn.example.com/inline.png');
  });

  it('trata formato reduzido de 401 sem quebrar', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: 'Use o subdomínio do blog ou informe X-API-Key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createDraftinClient({ fetchImpl: fetchMock, maxRetries: 0 });
    await expect(client.request('/public/posts')).rejects.toBeInstanceOf(
      DraftinClientError,
    );
  });

  it('faz retry em 429 respeitando Retry-After', async () => {
    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls++;
      if (calls === 1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Limite', retryable: true },
          }),
          {
            status: 429,
            headers: { 'Retry-After': '0', 'Content-Type': 'application/json' },
          },
        );
      }
      return new Response(JSON.stringify({ success: true, data: [makePost()] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const client = createDraftinClient({ fetchImpl: fetchMock, maxRetries: 1 });
    const data = await client.request<DraftinPost[]>('/public/posts');
    expect(calls).toBe(2);
    expect(data).toHaveLength(1);
  });

  it('lista categorias do CMS através de /public/categories', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toContain('/public/categories');
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            { id: 'c1', name: 'Design Editorial', description: 'Design' },
            { id: 'c2', name: 'Engenharia', description: 'Tech' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = createDraftinClient({ fetchImpl: fetchMock, maxRetries: 0 });
    const service = new DraftinPostsService(client);
    const categories = await service.listCategories();

    expect(categories).toEqual([
      { id: 'c1', name: 'Design Editorial' },
      { id: 'c2', name: 'Engenharia' },
    ]);
  });

  it('lista tags do CMS através de /public/tags', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      expect(String(input)).toContain('/public/tags');
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            { id: 't1', name: 'Design' },
            { id: 't2', name: 'Arquitetura' },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const client = createDraftinClient({ fetchImpl: fetchMock, maxRetries: 0 });
    const service = new DraftinPostsService(client);
    const tags = await service.listTags();

    expect(tags).toEqual([
      { id: 't1', name: 'Design' },
      { id: 't2', name: 'Arquitetura' },
    ]);
  });
});

