import { blogConfig } from '../../config/blog.config';
import type { Article, ArticleSummary, ArticleTerm } from '../../domain/post';
import {
  calculateReadingTimeMinutes,
  createExcerpt,
  detectContentFormat,
  extractFirstImageUrl,
  resolveAssetUrl,
} from '../../utils/content';
import { getTimestamp } from '../../utils/date';
import type { DraftinCategory, DraftinPost, DraftinTag } from './posts.types';

function mapTerms(items: Array<DraftinCategory | DraftinTag> | undefined): ArticleTerm[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => Boolean(item?.id && item?.name?.trim()))
    .map((item) => ({
      id: item.id,
      name: item.name.trim(),
    }));
}

function resolveAuthorName(post: DraftinPost): string | undefined {
  const apiAuthor = post.author?.name?.trim();
  if (apiAuthor) return apiAuthor;

  const mappedAuthor = post.authorId
    ? blogConfig.authorsById?.[post.authorId]?.trim()
    : undefined;
  if (mappedAuthor) return mappedAuthor;

  return blogConfig.authorName?.trim() || undefined;
}

export function isPublishedPost(post: DraftinPost | null | undefined): post is DraftinPost {
  return Boolean(post && post.status === 'PUBLISHED');
}

export function mapDraftinPostToSummary(post: DraftinPost): ArticleSummary {
  const content = typeof post.content === 'string' ? post.content : '';
  const format = detectContentFormat(content);
  const subtitle = post.subtitle?.trim() || undefined;
  const rawBannerUrl = post.coverUrl ?? post.bannerUrl ?? post.coverImage;
  const bannerImageUrl = resolveAssetUrl(rawBannerUrl, blogConfig.assetsBaseUrl);
  const coverImageUrl =
    bannerImageUrl ??
    extractFirstImageUrl(content, format, blogConfig.assetsBaseUrl);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title?.trim() || 'Sem título',
    subtitle,
    excerpt: createExcerpt(subtitle, content, format),
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    readingTimeMinutes: calculateReadingTimeMinutes(
      content,
      format,
      blogConfig.wordsPerMinute,
    ),
    authorName: resolveAuthorName(post),
    categories: mapTerms(post.categories),
    tags: mapTerms(post.tags),
    bannerImageUrl,
    coverImageUrl,
  };
}

export function mapDraftinPostToArticle(post: DraftinPost): Article {
  const content = typeof post.content === 'string' ? post.content : '';
  const format = detectContentFormat(content);

  return {
    ...mapDraftinPostToSummary(post),
    content,
    contentFormat: format,
  };
}

export function sortArticlesNewestFirst<T extends Pick<ArticleSummary, 'publishedAt' | 'createdAt'>>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const timeB = getTimestamp(b.publishedAt, b.createdAt);
    const timeA = getTimestamp(a.publishedAt, a.createdAt);
    return timeB - timeA;
  });
}
