// Modelos oficiais da API pública do DraftIn (v1.0.0)
// Referência: https://draftin.io/pt/docs/data-models/

export type DraftinPostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

export interface DraftinPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DraftinEnvelope<T> {
  success: true;
  data: T;
  meta?: { pagination?: DraftinPaginationMeta };
  message?: string;
}

export interface DraftinApiErrorEnvelope {
  success: false;
  error: {
    message: string;
    code: string;
    type: string;
    statusCode: number;
    timestamp: string;
    retryable: boolean;
    retryDelay?: number;
    details?: Record<string, unknown> | null;
    path: string;
    requestId: string;
    docs: string;
  };
}

export interface DraftinCategory {
  id: string;
  name: string;
  description: string;
  blogId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { posts: number };
}

export interface DraftinTag {
  id: string;
  name: string;
  blogId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { posts: number };
}

export interface DraftinPost {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  slug: string;
  status: DraftinPostStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  blogId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  categories: DraftinCategory[];
  tags: DraftinTag[];
  /** Campos aditivos opcionais tratados defensivamente conforme guia de versionamento */
  coverUrl?: string | null;
  bannerUrl?: string | null;
  coverImage?: string | null;
  author?: {
    id?: string;
    name?: string | null;
  } | null;
}

