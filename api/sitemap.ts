import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  createDraftinServerService,
  loadProxyConfigFromEnv,
} from '../server/draftinProxy';

let cachedProxy: ReturnType<typeof createDraftinServerService> | null = null;

export function _resetSitemapForTests(): void {
  cachedProxy = null;
}

function getProxy() {
  if (!cachedProxy) {
    const config = loadProxyConfigFromEnv();
    cachedProxy = createDraftinServerService(config);
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

  try {
    const xml = await getProxy().generateSitemapXml(origin);
    res.writeHead(200, {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
    });
    res.end(xml);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erro ao gerar sitemap.');
  }
}
