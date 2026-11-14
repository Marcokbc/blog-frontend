export interface BlogConfig {
  /** Nome principal da publicação ou autor exibido no header e SEO */
  title: string;
  /** Descrição curta / tagline opcional exibida no header */
  tagline?: string;
  /** Nome padrão do autor quando a API não fornecer nome legível */
  authorName?: string;
  /** Mapeamento opcional de authorId (DraftIn) para nome de exibição */
  authorsById?: Record<string, string>;
  /** Idioma e locale para formatação de datas */
  locale: string;
  /** Configuração da seção de introdução editorial (fácil de desabilitar ou remover) */
  intro: {
    enabled: boolean;
    kicker?: string;
    heading: string;
    body: string;
  };
  /** Base para resolver URLs relativas de imagens/assets vindas do conteúdo */
  assetsBaseUrl: string;
  /** Quantidade de artigos por lote na paginação incremental */
  postsPerBatch: number;
  /** Velocidade média de leitura (palavras por minuto) */
  wordsPerMinute: number;
  /** Nota discreta de rodapé */
  footerNote?: string;
  /** ID da playlist do YouTube para o player flutuante */
  youtubePlaylistId: string;
}

const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)
    : typeof process !== 'undefined'
      ? process.env
      : {};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() !== 'false' && value !== '0';
}

export const blogConfig: BlogConfig = {
  title: env.VITE_BLOG_TITLE?.trim() || 'Caderno de Notas',
  tagline:
    env.VITE_BLOG_TAGLINE !== undefined
      ? env.VITE_BLOG_TAGLINE.trim() || undefined
      : 'Ensaios sobre tecnologia, arquitetura de software e design editorial.',
  authorName:
    env.VITE_BLOG_AUTHOR !== undefined
      ? env.VITE_BLOG_AUTHOR.trim() || undefined
      : undefined,
  authorsById: {},
  locale: 'pt-BR',
  intro: {
    enabled: parseBoolean(env.VITE_BLOG_INTRO_ENABLED, true),
    heading:
      env.VITE_BLOG_INTRO_HEADING?.trim() || 'Pensamento escrito sem ruído.',
    body:
      env.VITE_BLOG_INTRO_BODY?.trim() ||
      'Um arquivo editorial dedicado a ensaios longos, notas técnicas e reflexões sobre software e forma — sem algoritmos, métricas de vaidade ou distrações.',
  },
  assetsBaseUrl: env.VITE_ASSETS_BASE_URL?.trim() || 'https://api.draftin.io',
  postsPerBatch: Math.max(1, Number(env.VITE_POSTS_PER_BATCH ?? 10) || 10),
  wordsPerMinute: 200,
  footerNote: 'Publicado com foco em leitura e permanência.',
  youtubePlaylistId:
    env.VITE_YOUTUBE_PLAYLIST_ID?.trim() ||
    env.YOUTUBE_PLAYLIST_ID?.trim() ||
    'PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj',
};
