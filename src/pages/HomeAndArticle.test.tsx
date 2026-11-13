import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Layout } from '../app/Layout';
import { brutalistTheme } from '../app/theme';
import type { Article, ArticleSummary } from '../domain/post';
import { ArticlePage } from '../pages/ArticlePage';
import { HomePage } from '../pages/HomePage';
import { postsRepository } from '../services/cms/posts.repository';

function renderAppAt(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={brutalistTheme}>
        <CssBaseline />
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="artigos/:slug" element={<ArticlePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Fluxos de HomePage e ArticlePage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.scrollTo = vi.fn();
  });

  it('lista artigos publicados e permite navegar até o artigo completo', async () => {
    const summary1: ArticleSummary = {
      id: '1',
      slug: 'primeiro-ensaio',
      title: 'Arquitetura Brutalista na Web',
      subtitle: 'Menos ornamento, mais leitura.',
      excerpt: 'Menos ornamento, mais leitura.',
      publishedAt: '2026-07-10T10:00:00.000Z',
      createdAt: '2026-07-09T10:00:00.000Z',
      updatedAt: '2026-07-10T10:00:00.000Z',
      readingTimeMinutes: 4,
      authorName: 'Marco Aurélio',
      categories: [{ id: 'c1', name: 'Design' }],
      tags: [{ id: 't1', name: 'editorial' }],
      bannerImageUrl: 'https://cdn.example.com/banner.webp',
      coverImageUrl: 'https://cdn.example.com/banner.webp',
    };

    const fullArticle: Article = {
      ...summary1,
      content: '<h2>Princípio</h2><p>Conteúdo integral do artigo.</p>',
      contentFormat: 'html',
    };

    vi.spyOn(postsRepository, 'listPostsPage').mockResolvedValue({
      items: [summary1],
      hasMore: false,
      nextOffset: 1,
    });
    vi.spyOn(postsRepository, 'getPostBySlug').mockResolvedValue(fullArticle);

    renderAppAt('/');

    const titleLink = await screen.findByText('Arquitetura Brutalista na Web');
    expect(screen.getByText(/10 de julho de 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Menos ornamento, mais leitura.')).toBeInTheDocument();
    expect(screen.getByText('4 min de leitura')).toBeInTheDocument();
    expect(
      screen.getByAltText('Banner do artigo Arquitetura Brutalista na Web'),
    ).toHaveAttribute('src', 'https://cdn.example.com/banner.webp');

    fireEvent.click(titleLink);

    await waitFor(() => {
      expect(screen.getByText('Conteúdo integral do artigo.')).toBeInTheDocument();
    });
    expect(
      screen.getByAltText('Arquitetura Brutalista na Web'),
    ).toHaveAttribute('src', 'https://cdn.example.com/banner.webp');
    expect(screen.getByText('← Voltar aos artigos')).toBeInTheDocument();
  });

  it('exibe estado vazio quando não há artigos publicados', async () => {
    vi.spyOn(postsRepository, 'listPostsPage').mockResolvedValue({
      items: [],
      hasMore: false,
      nextOffset: 0,
    });

    renderAppAt('/');

    expect(
      await screen.findByText('Nenhum artigo publicado ainda.'),
    ).toBeInTheDocument();
  });

  it('exibe página 404 editorial quando artigo não existe', async () => {
    vi.spyOn(postsRepository, 'getPostBySlug').mockResolvedValue(null);

    renderAppAt('/artigos/nao-existe');

    expect(await screen.findByText('Artigo não encontrado.')).toBeInTheDocument();
  });

  it('permite filtrar artigos por categoria, buscar por tag e limpar filtros', async () => {
    const postA: ArticleSummary = {
      id: '1',
      slug: 'artigo-editorial',
      title: 'Design Editorial Suíço',
      excerpt: 'Sobre grid e ritmo.',
      publishedAt: '2026-08-01T10:00:00.000Z',
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
      readingTimeMinutes: 3,
      categories: [{ id: 'cat_1', name: 'Design' }],
      tags: [{ id: 't1', name: 'editorial' }],
    };

    const postB: ArticleSummary = {
      id: '2',
      slug: 'artigo-codigo',
      title: 'Engenharia de Frontend',
      excerpt: 'Sobre testes e arquitetura.',
      publishedAt: '2026-08-02T10:00:00.000Z',
      createdAt: '2026-08-02T10:00:00.000Z',
      updatedAt: '2026-08-02T10:00:00.000Z',
      readingTimeMinutes: 5,
      categories: [{ id: 'cat_2', name: 'Engenharia' }],
      tags: [{ id: 't2', name: 'codigo' }],
    };

    vi.spyOn(postsRepository, 'listPostsPage').mockResolvedValue({
      items: [postB, postA],
      hasMore: false,
      nextOffset: 2,
    });

    renderAppAt('/');

    // Ambos os artigos estão presentes inicialmente
    expect(await screen.findByText('Design Editorial Suíço')).toBeInTheDocument();
    expect(screen.getByText('Engenharia de Frontend')).toBeInTheDocument();

    // 1. Filtrar pela categoria "Design" na barra de filtros
    const filtersNav = screen.getByRole('navigation', { name: /Filtro de artigos por categoria/i });
    const designCategoryBtn = within(filtersNav).getByRole('button', { name: /Design/i });
    fireEvent.click(designCategoryBtn);

    // Apenas o artigo da categoria Design deve estar visível
    expect(screen.getByText('Design Editorial Suíço')).toBeInTheDocument();
    expect(screen.queryByText('Engenharia de Frontend')).not.toBeInTheDocument();
    expect(screen.getByText(/na categoria/i)).toBeInTheDocument();

    // Limpa categoria clicando em "Todas"
    const todasBtn = screen.getByRole('button', { name: 'Todas' });
    fireEvent.click(todasBtn);

    expect(screen.getByText('Design Editorial Suíço')).toBeInTheDocument();
    expect(screen.getByText('Engenharia de Frontend')).toBeInTheDocument();

    // 2. Buscar por tag utilizando o campo de busca por tag
    const searchInput = screen.getByPlaceholderText(/digite uma tag/i);
    fireEvent.change(searchInput, { target: { value: 'codigo' } });

    // Apenas o artigo com a tag #codigo deve aparecer
    expect(screen.getByText('Engenharia de Frontend')).toBeInTheDocument();
    expect(screen.queryByText('Design Editorial Suíço')).not.toBeInTheDocument();

    // 3. Limpar a busca por tag
    const clearSearchBtn = screen.getByRole('button', { name: /Limpar campo de busca por tag/i });
    fireEvent.click(clearSearchBtn);

    expect(screen.getByText('Design Editorial Suíço')).toBeInTheDocument();
    expect(screen.getByText('Engenharia de Frontend')).toBeInTheDocument();

    // 4. Clicar na tag do próprio card
    const cardTagBtn = screen.getByRole('button', { name: 'Filtrar artigos por #editorial' });
    fireEvent.click(cardTagBtn);

    expect(screen.getByText('Design Editorial Suíço')).toBeInTheDocument();
    expect(screen.queryByText('Engenharia de Frontend')).not.toBeInTheDocument();
  });
});

