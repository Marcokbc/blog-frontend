export type ContentFormat = 'html' | 'markdown';

const DEFAULT_WORDS_PER_MINUTE = 200;
const DEFAULT_ASSETS_BASE_URL = 'https://api.draftin.io';

/**
 * Detecta se o conteúdo retornado pelo editor do DraftIn está em HTML ou Markdown.
 * Remove blocos de código fenced antes da inspeção para evitar falsos positivos
 * em artigos Markdown que contenham exemplos de código HTML.
 */
export function detectContentFormat(content: string): ContentFormat {
  const trimmed = content.trim();
  if (!trimmed) return 'markdown';

  const withoutCodeFences = trimmed
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .trim();

  if (!withoutCodeFences) return 'markdown';

  if (
    /^<(p|h[1-6]|div|section|article|header|figure|blockquote|ul|ol|pre|table|hr)\b[^>]*>/i.test(
      withoutCodeFences,
    )
  ) {
    return 'html';
  }

  const blockClosingMatches = withoutCodeFences.match(
    /<\/(p|h[1-6]|div|section|article|figure|blockquote|ul|ol|pre|table)>/gi,
  );
  if (blockClosingMatches && blockClosingMatches.length >= 2) {
    return 'html';
  }

  return 'markdown';
}

/**
 * Converte HTML ou Markdown em texto limpo para cálculo de tempo de leitura e resumo SEO.
 */
export function extractPlainText(
  content: string,
  format: ContentFormat = detectContentFormat(content),
): string {
  if (!content.trim()) return '';

  if (format === 'html') {
    return content
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+>]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~]+/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateReadingTimeMinutes(
  content: string,
  format: ContentFormat = detectContentFormat(content),
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE,
): number {
  const plainText = extractPlainText(content, format);
  if (!plainText) return 1;
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min de leitura`;
}

export function createExcerpt(
  subtitle: string | undefined | null,
  content: string,
  format: ContentFormat = detectContentFormat(content),
  maxLength = 165,
): string {
  const cleanSubtitle = subtitle?.trim();
  if (cleanSubtitle) {
    return cleanSubtitle.length > maxLength
      ? `${cleanSubtitle.slice(0, maxLength - 1).trimEnd()}…`
      : cleanSubtitle;
  }

  const plain = extractPlainText(content, format);
  if (!plain) return '';
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Normaliza URLs de imagens/assets vindas do conteúdo do CMS.
 * - Bloqueia protocolos perigosos (javascript:, vbscript:, data:text/html, etc.)
 * - Resolve caminhos relativos (/uploads/...) usando a base configurada.
 */
export function resolveAssetUrl(
  rawUrl?: string | null,
  assetsBaseUrl = DEFAULT_ASSETS_BASE_URL,
): string | undefined {
  if (!rawUrl) return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  if (/^(javascript|vbscript):/i.test(trimmed)) {
    return undefined;
  }

  if (/^data:/i.test(trimmed)) {
    return /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(trimmed)
      ? trimmed
      : undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  try {
    return new URL(trimmed, assetsBaseUrl).toString();
  } catch {
    return undefined;
  }
}

export function extractFirstImageUrl(
  content: string,
  format: ContentFormat = detectContentFormat(content),
  assetsBaseUrl = DEFAULT_ASSETS_BASE_URL,
): string | undefined {
  if (!content.trim()) return undefined;

  if (format === 'html') {
    const match = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
    return resolveAssetUrl(match?.[1], assetsBaseUrl);
  }

  const mdMatch = content.match(/!\[[^\]]*\]\(([^\s)]+)(?:\s+["'][^"']*["'])?\)/);
  if (mdMatch?.[1]) {
    return resolveAssetUrl(mdMatch[1], assetsBaseUrl);
  }

  const htmlFallback = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return resolveAssetUrl(htmlFallback?.[1], assetsBaseUrl);
}
