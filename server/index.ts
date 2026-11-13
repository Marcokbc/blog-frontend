import 'dotenv/config';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDraftinServerService,
  loadProxyConfigFromEnv,
} from './draftinProxy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function resolveOrigin(req: http.IncomingMessage, fallback: string): string {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host || Array.isArray(host)) return fallback;
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto =
    typeof protoHeader === 'string' && protoHeader ? protoHeader : 'http';
  return `${proto}://${host}`;
}

async function startServer() {
  const config = loadProxyConfigFromEnv();
  const proxy = createDraftinServerService(config);
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  const templateHtml = await fs.readFile(indexHtmlPath, 'utf-8');

  const server = http.createServer(async (req, res) => {
    try {
      const origin = resolveOrigin(req, config.siteUrl);
      const reqUrl = new URL(req.url || '/', origin);

      if (reqUrl.pathname.startsWith('/api/draftin')) {
        await proxy.handleApiRequest(req, res, reqUrl);
        return;
      }

      if (reqUrl.pathname === '/sitemap.xml') {
        const xml = await proxy.generateSitemapXml(origin);
        res.writeHead(200, {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
        });
        res.end(xml);
        return;
      }

      if (reqUrl.pathname === '/robots.txt') {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
        return;
      }

      const postsRedirect = reqUrl.pathname.match(/^\/posts\/([^/]+)\/?$/);
      if (postsRedirect) {
        res.writeHead(301, {
          Location: `/artigos/${encodeURIComponent(decodeURIComponent(postsRedirect[1]))}`,
        });
        res.end();
        return;
      }

      // Servir arquivos estáticos do build Vite com proteção contra path traversal
      if (reqUrl.pathname !== '/' && reqUrl.pathname.includes('.')) {
        const safeRel = path
          .normalize(decodeURIComponent(reqUrl.pathname))
          .replace(/^(\.\.[/\\])+/, '')
          .replace(/^\/+/, '');
        const candidate = path.join(DIST_DIR, safeRel);
        if (candidate.startsWith(DIST_DIR)) {
          try {
            const stat = await fs.stat(candidate);
            if (stat.isFile()) {
              const ext = path.extname(candidate).toLowerCase();
              const content = await fs.readFile(candidate);
              res.writeHead(200, {
                'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
                'Cache-Control': candidate.includes(`${path.sep}assets${path.sep}`)
                  ? 'public, max-age=31536000, immutable'
                  : 'public, max-age=300',
              });
              res.end(content);
              return;
            }
          } catch {
            // Segue para fallback SPA ou 404 de asset
          }
        }
      }

      const { html, statusCode } = await proxy.renderDocumentWithSeo(
        templateHtml,
        reqUrl,
        origin,
      );
      res.writeHead(statusCode, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(html);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(
        error instanceof Error ? `Erro interno: ${error.message}` : 'Erro interno',
      );
    }
  });

  const port = Number(process.env.PORT || 4173);
  server.listen(port, () => {
    console.log(`Servidor editorial ativo em http://localhost:${port}`);
    if (!config.apiKey) {
      console.warn(
        '[aviso] DRAFTIN_API_KEY não definida — configure .env para consumir posts reais.',
      );
    }
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});

