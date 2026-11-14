import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import {
  createDraftinServerService,
  loadProxyConfigFromEnv,
} from './server/draftinProxy';

function draftinDevMiddlewarePlugin(): Plugin {
  const config = loadProxyConfigFromEnv();
  const service = createDraftinServerService(config);

  return {
    name: 'draftin-proxy-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();
        const host = req.headers.host || 'localhost:5173';
        const reqUrl = new URL(req.url, `http://${host}`);

        if (reqUrl.pathname.startsWith('/api/draftin')) {
          await service.handleApiRequest(req, res, reqUrl);
          return;
        }

        if (reqUrl.pathname === '/sitemap.xml') {
          const xml = await service.generateSitemapXml(`http://${host}`);
          res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
          res.end(xml);
          return;
        }

        if (reqUrl.pathname === '/robots.txt') {
          res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(
            `User-agent: *\nAllow: /\n\nSitemap: http://${host}/sitemap.xml\n`,
          );
          return;
        }

        return next();
      });
    },
  };
}

export default defineConfig({
  envPrefix: ['VITE_', 'YOUTUBE_'],
  plugins: [tailwindcss(), react(), draftinDevMiddlewarePlugin()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
