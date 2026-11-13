import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  createDraftinServerService,
  loadProxyConfigFromEnv,
} from '../server/draftinProxy';

let cachedProxy: ReturnType<typeof createDraftinServerService> | null = null;
let lastApiKey: string | undefined = undefined;

export function _resetProxyForTests(): void {
  cachedProxy = null;
  lastApiKey = undefined;
}

function getProxy() {
  const currentKey = process.env.DRAFTIN_API_KEY?.trim();
  if (!cachedProxy || lastApiKey !== currentKey) {
    const config = loadProxyConfigFromEnv();
    cachedProxy = createDraftinServerService(config);
    lastApiKey = currentKey;
  }
  return cachedProxy;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const host =
    (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const origin = `${proto}://${host}`;

  const reqUrl = new URL(req.url || '/', origin);

  // Tratamento de rewrite do Vercel via query parameter (?__path=:path*)
  const queryPath = reqUrl.searchParams.get('__path');
  if (queryPath) {
    reqUrl.searchParams.delete('__path');
    const cleanPath = queryPath.startsWith('/') ? queryPath : `/${queryPath}`;
    reqUrl.pathname = `/api/draftin${cleanPath}`;
  } else if (!reqUrl.pathname.startsWith('/api/draftin')) {
    const matched = req.headers['x-matched-path'] as string | undefined;
    if (matched && matched.startsWith('/api/draftin')) {
      reqUrl.pathname = matched;
    }
  }

  const proxy = getProxy();
  await proxy.handleApiRequest(req, res, reqUrl);
}
