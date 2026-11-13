import type { DraftinEnvelope } from './posts.types';

export class DraftinClientError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly retryDelayMs?: number;
  readonly requestId?: string;

  constructor(params: {
    message: string;
    statusCode: number;
    code: string;
    retryable?: boolean;
    retryDelayMs?: number;
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'DraftinClientError';
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.retryable = Boolean(params.retryable);
    this.retryDelayMs = params.retryDelayMs;
    this.requestId = params.requestId;
  }
}

export interface DraftinClientOptions {
  baseUrl?: string;
  maxRetries?: number;
  fetchImpl?: typeof fetch;
}

function waitWithSignal(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function parseRetryAfterMs(res: Response, bodyRetryDelay?: number): number {
  const retryAfter = res.headers.get('Retry-After');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, 15_000);
    }
  }
  if (typeof bodyRetryDelay === 'number' && Number.isFinite(bodyRetryDelay)) {
    return Math.min(Math.max(bodyRetryDelay, 250), 15_000);
  }
  return 1000;
}

async function parseErrorResponse(res: Response): Promise<DraftinClientError> {
  let code = String(res.status);
  let detail = res.statusText || 'Erro desconhecido';
  let retryable = res.status === 429 || res.status >= 500;
  let retryDelayMs: number | undefined;
  let requestId = res.headers.get('X-Request-Id') ?? undefined;

  try {
    const body = (await res.json()) as Record<string, unknown>;
    if (body && typeof body.error === 'object' && body.error !== null) {
      const errObj = body.error as Record<string, unknown>;
      if (typeof errObj.code === 'string') code = errObj.code;
      if (typeof errObj.message === 'string') detail = errObj.message;
      if (typeof errObj.retryable === 'boolean') retryable = errObj.retryable;
      if (typeof errObj.retryDelay === 'number') retryDelayMs = errObj.retryDelay;
      if (typeof errObj.requestId === 'string') requestId = errObj.requestId;
    } else if (body && typeof body.error === 'string') {
      // Formato reduzido em alguns 401/403 emitidos antes do handler global
      detail = body.error;
      if (res.status === 401) code = 'UNAUTHORIZED';
      if (res.status === 403) code = 'FORBIDDEN';
    }
  } catch {
    // Corpo vazio ou não-JSON: mantém fallback pelo status HTTP
  }

  const humanMessage = (() => {
    switch (code) {
      case 'UNAUTHORIZED':
        return 'Autenticação recusada pela API do DraftIn. Verifique DRAFTIN_API_KEY no servidor.';
      case 'CONFIGURATION_ERROR':
        return detail;
      case 'FORBIDDEN':
        return detail && detail !== 'Forbidden'
          ? `Acesso recusado pelo DraftIn: ${detail}.`
          : 'Acesso não autorizado ao conteúdo solicitado.';
      case 'NOT_FOUND':
        return 'Artigo não encontrado ou ainda não publicado.';
      case 'VALIDATION_ERROR':
        return `Parâmetros inválidos na requisição: ${detail}`;
      case 'RATE_LIMIT_EXCEEDED':
        return 'Limite temporário de requisições atingido. Tente novamente em instantes.';
      default:
        return detail || `Falha na comunicação com o DraftIn (${res.status}).`;
    }
  })();

  return new DraftinClientError({
    message: humanMessage,
    statusCode: res.status,
    code,
    retryable,
    retryDelayMs,
    requestId,
  });
}

export function createDraftinClient(options: DraftinClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? '/api/draftin').replace(/\/$/, '');
  const maxRetries = options.maxRetries ?? 2;
  const fetchFn = options.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function request<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
    signal?: AbortSignal,
  ): Promise<T> {
    const search = new URLSearchParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') {
          search.set(key, String(value));
        }
      }
    }

    const qs = search.toString();
    const url = `${baseUrl}${path}${qs ? `?${qs}` : ''}`;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetchFn(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal,
        });

        if (res.ok) {
          const payload = (await res.json()) as Partial<DraftinEnvelope<T>>;
          if (!payload || payload.success !== true || payload.data === undefined) {
            throw new DraftinClientError({
              message: 'Resposta inesperada do servidor DraftIn.',
              statusCode: 502,
              code: 'INVALID_ENVELOPE',
              retryable: false,
            });
          }
          return payload.data;
        }

        const apiError = await parseErrorResponse(res);

        if (attempt < maxRetries && res.status === 429) {
          const delayMs = parseRetryAfterMs(res, apiError.retryDelayMs);
          await waitWithSignal(delayMs, signal);
          continue;
        }

        if (attempt < maxRetries && res.status >= 500 && res.status !== 503) {
          await waitWithSignal(2 ** attempt * 300, signal);
          continue;
        }

        throw apiError;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        }
        if (err instanceof DraftinClientError) {
          throw err;
        }
        lastError = err;
        if (attempt < maxRetries) {
          await waitWithSignal(2 ** attempt * 300, signal);
          continue;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Não foi possível conectar ao serviço de conteúdo.');
  }

  return {
    request,
  };
}

export type DraftinClient = ReturnType<typeof createDraftinClient>;

export const draftinClient = createDraftinClient();
