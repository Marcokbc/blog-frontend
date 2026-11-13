import type { Article, ArticleSummary, ArticleTerm, PostsPage, PostsRepository } from '../../domain/post';
import { type DraftinClient, DraftinClientError, draftinClient } from './client';
import {
  isPublishedPost,
  mapDraftinPostToArticle,
  mapDraftinPostToSummary,
  sortArticlesNewestFirst,
} from './posts.mapper';
import type { DraftinCategory, DraftinPost, DraftinTag } from './posts.types';

const MAX_DRAFTIN_LIMIT = 100;

export class DraftinPostsService implements PostsRepository {
  private readonly client: DraftinClient;

  constructor(client: DraftinClient = draftinClient) {
    this.client = client;
  }

  async listPostsPage(params: {
    limit: number;
    offset: number;
    signal?: AbortSignal;
  }): Promise<PostsPage> {
    const safeLimit = Math.min(Math.max(1, Math.floor(params.limit)), MAX_DRAFTIN_LIMIT);
    const safeOffset = Math.max(0, Math.floor(params.offset));

    const rawPosts = await this.client.request<DraftinPost[]>(
      '/public/posts',
      {
        status: 'PUBLISHED',
        limit: safeLimit,
        offset: safeOffset,
      },
      params.signal,
    );

    const published = Array.isArray(rawPosts)
      ? rawPosts.filter(isPublishedPost).map(mapDraftinPostToSummary)
      : [];

    // Como GET /public/posts não retorna contagem total, detecta-se fim da coleção
    // quando o lote traz menos itens do que o limite solicitado.
    const hasMore = Array.isArray(rawPosts) && rawPosts.length >= safeLimit;

    return {
      items: sortArticlesNewestFirst(published),
      hasMore,
      nextOffset: safeOffset + (Array.isArray(rawPosts) ? rawPosts.length : 0),
    };
  }

  async listAllPostSummaries(signal?: AbortSignal): Promise<ArticleSummary[]> {
    const all: ArticleSummary[] = [];

    for (let offset = 0; ; offset += MAX_DRAFTIN_LIMIT) {
      const batch = await this.client.request<DraftinPost[]>(
        '/public/posts',
        {
          status: 'PUBLISHED',
          limit: MAX_DRAFTIN_LIMIT,
          offset,
        },
        signal,
      );

      if (!Array.isArray(batch) || batch.length === 0) break;

      all.push(...batch.filter(isPublishedPost).map(mapDraftinPostToSummary));

      if (batch.length < MAX_DRAFTIN_LIMIT) break;
    }

    return sortArticlesNewestFirst(all);
  }

  async getPostBySlug(slug: string, signal?: AbortSignal): Promise<Article | null> {
    const cleanSlug = slug.trim();
    if (!cleanSlug) return null;

    try {
      const post = await this.client.request<DraftinPost>(
        `/public/posts/slug/${encodeURIComponent(cleanSlug)}`,
        undefined,
        signal,
      );

      if (!isPublishedPost(post)) {
        return null;
      }

      return mapDraftinPostToArticle(post);
    } catch (error) {
      if (error instanceof DraftinClientError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async listCategories(signal?: AbortSignal): Promise<ArticleTerm[]> {
    try {
      const rawCategories = await this.client.request<DraftinCategory[]>(
        '/public/categories',
        undefined,
        signal,
      );
      if (!Array.isArray(rawCategories)) return [];
      return rawCategories.map((category) => ({ id: category.id, name: category.name }));
    } catch {
      return [];
    }
  }

  async listTags(signal?: AbortSignal): Promise<ArticleTerm[]> {
    try {
      const rawTags = await this.client.request<DraftinTag[]>(
        '/public/tags',
        undefined,
        signal,
      );
      if (!Array.isArray(rawTags)) return [];
      return rawTags.map((tag) => ({ id: tag.id, name: tag.name }));
    } catch {
      return [];
    }
  }
}

export const draftinPostsService = new DraftinPostsService();
