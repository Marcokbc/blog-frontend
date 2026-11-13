# Blog Editorial Minimalista Brutalista

Frontend de blog pessoal com estética **Minimalist Brutalist Editorial Design**, construído em **React + TypeScript + Material UI (MUI)** e integrado à API pública do **DraftIn** ([documentação oficial](https://draftin.io/pt/docs/)).

## Arquitetura e Camada de Proxy

A documentação oficial do DraftIn recomenda **não expor `DRAFTIN_API_KEY` no navegador**, realizando as chamadas autenticadas a partir de um servidor. Para atender a essa diretriz e garantir SEO completo:

1. **Camada de Proxy/BFF mínima (`server/`)**:
   - Em desenvolvimento, um middleware acoplado ao Vite (`vite.config.ts`) encaminha `/api/draftin/*` para a API do DraftIn injetando `X-API-Key` exclusivamente no servidor.
   - Em produção (`server/index.ts`), o servidor Node entrega o build estático (`dist/`), faz proxy seguro somente-leitura com cache em memória (`TTL` configurável), deduplicação de requisições concorrentes e tratamento de `429 Retry-After` / `5xx`, gera `/sitemap.xml` e `/robots.txt` dinamicamente e injeta meta tags dinâmicas (`<title>`, `description`, Open Graph, Twitter Cards e JSON-LD `BlogPosting`) nas rotas `/artigos/:slug`.
2. **Desacoplamento de CMS (`src/domain/` + `src/services/`)**:
   - A interface `PostsRepository` em `src/domain/post.ts` define o contrato agnóstico de CMS consumido pela UI e pelos hooks (`src/hooks/usePosts.ts`).
   - A implementação específica do DraftIn vive isolada em `src/services/draftin/` (`client.ts`, `posts.types.ts`, `posts.mapper.ts`, `posts.service.ts`) e é exposta via `src/services/cms/posts.repository.ts`.

## Configuração

1. Copie `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
2. Informe sua chave real do DraftIn em `.env` (apenas no servidor — nunca use prefixo `VITE_` para a chave):
   ```env
   DRAFTIN_API_KEY=dra_xxxxxxxxxxxxxxxxxxxxxxxxxxx
   DRAFTIN_BASE_URL=https://api.draftin.io
   ```
3. Personalize nome do blog, tagline, autor e introdução editorial no `.env` ou diretamente em `src/config/blog.config.ts`. Para remover a introdução editorial, defina `VITE_BLOG_INTRO_ENABLED=false` (ou `intro.enabled = false`).

## Scripts

```bash
npm install      # Instala dependências
npm run dev      # Inicia frontend + proxy DraftIn local (porta 5173)
npm run typecheck # Verifica tipos TypeScript
npm test         # Executa testes unitários e de integração (Vitest)
npm run build    # Gera build de produção (dist/ e dist-server/)
npm start        # Inicia servidor de produção com proxy + SEO + sitemap (porta 4173)
```

## Endpoints do DraftIn utilizados

- `GET /public/posts?status=PUBLISHED&limit=...&offset=...`
- `GET /public/posts/slug/{slug}`
- `GET /public/categories`
- `GET /public/tags`
- `GET /version` (diagnóstico)

