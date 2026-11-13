import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { blogConfig } from '../config/blog.config';
import type { ArticleSummary, ArticleTerm, PostsPage } from '../domain/post';
import { postsRepository } from '../services/cms/posts.repository';
import { sortArticlesNewestFirst } from '../services/draftin/posts.mapper';

export const ARTICLE_QUERY_KEYS = {
  all: ['articles'] as const,
  feed: (batchSize: number) => ['articles', 'feed', batchSize] as const,
  detail: (slug: string) => ['articles', 'detail', slug] as const,
};

export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
};

export const TAG_QUERY_KEYS = {
  all: ['tags'] as const,
};

function mergeUniqueArticles(pages: PostsPage[] | undefined): ArticleSummary[] {
  if (!pages || pages.length === 0) return [];
  const seen = new Set<string>();
  const combined: ArticleSummary[] = [];

  for (const page of pages) {
    for (const item of page.items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
  }

  return sortArticlesNewestFirst(combined);
}

export function useInfiniteArticles(
  batchSize = blogConfig.postsPerBatch,
  enabled = true,
) {
  const query = useInfiniteQuery<
    PostsPage,
    Error,
    InfiniteData<PostsPage, number>,
    ReturnType<typeof ARTICLE_QUERY_KEYS.feed>,
    number
  >({
    queryKey: ARTICLE_QUERY_KEYS.feed(batchSize),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      postsRepository.listPostsPage({
        limit: batchSize,
        offset: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const articles = useMemo(
    () => mergeUniqueArticles(query.data?.pages),
    [query.data?.pages],
  );

  return {
    ...query,
    articles,
  };
}

export function useArticleBySlug(slug: string | undefined) {
  const cleanSlug = slug?.trim() || '';

  return useQuery({
    queryKey: ARTICLE_QUERY_KEYS.detail(cleanSlug),
    queryFn: ({ signal }) => postsRepository.getPostBySlug(cleanSlug, signal),
    enabled: Boolean(cleanSlug),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

/**
 * Reutiliza o feed em cache (ou busca o primeiro lote compartilhado) para oferecer
 * navegação discreta para artigo anterior (mais antigo) e próximo (mais recente)
 * sem disparar requisições duplicadas.
 */
export function useAdjacentArticles(
  currentSlug: string | undefined,
  enabled = true,
) {
  const { articles } = useInfiniteArticles(blogConfig.postsPerBatch, enabled);

  return useMemo(() => {
    if (!currentSlug || articles.length === 0) {
      return { previousArticle: null, nextArticle: null };
    }

    const index = articles.findIndex((item) => item.slug === currentSlug);
    if (index === -1) {
      return { previousArticle: null, nextArticle: null };
    }

    // Ordenado do mais recente (0) para o mais antigo (length - 1)
    return {
      nextArticle: index > 0 ? articles[index - 1] : null,
      previousArticle: index < articles.length - 1 ? articles[index + 1] : null,
    };
  }, [articles, currentSlug]);
}

export function useCategories(enabled = true) {
  return useQuery<ArticleTerm[]>({
    queryKey: CATEGORY_QUERY_KEYS.all,
    queryFn: ({ signal }) =>
      postsRepository.listCategories
        ? postsRepository.listCategories(signal)
        : Promise.resolve([]),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useTags(enabled = true) {
  return useQuery<ArticleTerm[]>({
    queryKey: TAG_QUERY_KEYS.all,
    queryFn: ({ signal }) =>
      postsRepository.listTags ? postsRepository.listTags(signal) : Promise.resolve([]),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
