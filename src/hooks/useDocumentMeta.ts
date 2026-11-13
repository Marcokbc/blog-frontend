import { useEffect } from 'react';
import { blogConfig } from '../config/blog.config';

export interface DocumentMetaOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  imageUrl?: string;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  noIndex?: boolean;
}

function upsertMeta(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string | undefined,
) {
  const selector = `meta[${attrName}="${attrValue}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.content = content;
    return;
  }

  const meta = document.createElement('meta');
  meta.setAttribute(attrName, attrValue);
  meta.content = content;
  document.head.appendChild(meta);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function useDocumentMeta(options: DocumentMetaOptions) {
  useEffect(() => {
    const description =
      options.description?.trim() || blogConfig.tagline || blogConfig.title;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const canonicalUrl = `${origin}${options.canonicalPath ?? window.location.pathname}`;
    const ogType = options.ogType ?? 'website';

    document.title = options.title;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', options.noIndex ? 'noindex, nofollow' : undefined);
    upsertCanonical(canonicalUrl);

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', options.title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', options.imageUrl);
    upsertMeta(
      'property',
      'article:published_time',
      ogType === 'article' && options.publishedTime ? options.publishedTime : undefined,
    );
    upsertMeta(
      'property',
      'article:modified_time',
      ogType === 'article' && options.modifiedTime ? options.modifiedTime : undefined,
    );

    upsertMeta(
      'name',
      'twitter:card',
      options.imageUrl ? 'summary_large_image' : 'summary',
    );
    upsertMeta('name', 'twitter:title', options.title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', options.imageUrl);
  }, [
    options.title,
    options.description,
    options.canonicalPath,
    options.ogType,
    options.imageUrl,
    options.publishedTime,
    options.modifiedTime,
    options.noIndex,
  ]);
}

