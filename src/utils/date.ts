import { blogConfig } from '../config/blog.config';

export function parseValidDate(isoDate?: string | null): Date | null {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatEditorialDate(
  isoDate?: string | null,
  locale = blogConfig.locale,
): string | null {
  const date = parseValidDate(isoDate);
  if (!date) return null;

  const formatted = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace(/\./g, '')
    .replace(/\s+de\s+/gi, ' ');

  return formatted;
}

export function formatMonthYearKey(isoDate?: string | null): string {
  const date = parseValidDate(isoDate);
  if (!date) return 'unknown';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthYearHeading(
  isoDate?: string | null,
  locale = blogConfig.locale,
): string {
  const date = parseValidDate(isoDate);
  if (!date) return 'Arquivo';

  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .replace(/\s+de\s+/gi, ' ')
    .toUpperCase();
}

export function formatLongDate(
  isoDate?: string | null,
  locale = blogConfig.locale,
): string | null {
  const date = parseValidDate(isoDate);
  if (!date) return null;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getTimestamp(
  primaryDate?: string | null,
  fallbackDate?: string | null,
): number {
  const date = parseValidDate(primaryDate) ?? parseValidDate(fallbackDate);
  return date ? date.getTime() : 0;
}

