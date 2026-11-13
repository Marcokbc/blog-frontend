export interface ArticleTerm {
  id: string;
  name: string;
}

export interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  readingTimeMinutes: number;
  authorName?: string;
  categories: ArticleTerm[];
  tags: ArticleTerm[];
  /** Imagem oficial de banner/capa vinda do CMS */
  bannerImageUrl?: string;
  /** Imagem principal para meta tags sociais (banner ou primeira imagem do conteúdo) */
  coverImageUrl?: string;
}

export interface Article extends ArticleSummary {
  content: string;
  contentFormat: 'html' | 'markdown';
}

export interface PostsPage {
  items: ArticleSummary[];
  hasMore: boolean;
  nextOffset: number;
}

export interface PostsRepository {
  listPostsPage(params: {
    limit: number;
    offset: number;
    signal?: AbortSignal;
  }): Promise<PostsPage>;
  listAllPostSummaries(signal?: AbortSignal): Promise<ArticleSummary[]>;
  getPostBySlug(slug: string, signal?: AbortSignal): Promise<Article | null>;
  listCategories?(signal?: AbortSignal): Promise<ArticleTerm[]>;
  listTags?(signal?: AbortSignal): Promise<ArticleTerm[]>;
}

