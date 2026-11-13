import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { blogConfig } from '../config/blog.config';
import { EditorialIntro } from '../components/EditorialIntro/EditorialIntro';
import { PostList } from '../components/PostList/PostList';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useCategories, useInfiniteArticles, useTags } from '../hooks/usePosts';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtragem por categoria via URL (?categoria=... ou ?category=...)
  const selectedCategory =
    searchParams.get('categoria')?.trim() ||
    searchParams.get('category')?.trim() ||
    null;

  // Busca por tag ou título via URL (?busca=... ou ?q=... ou ?tag=...)
  const searchQuery =
    searchParams.get('busca')?.trim() ||
    searchParams.get('q')?.trim() ||
    searchParams.get('tag')?.trim() ||
    '';
  const cleanSearch = searchQuery.replace(/^#/, '').trim();

  // Título e SEO dinâmicos com base nos filtros
  const pageTitle = useMemo(() => {
    if (selectedCategory && cleanSearch) {
      return `${selectedCategory} · "${cleanSearch}" · ${blogConfig.title}`;
    }
    if (selectedCategory) {
      return `${selectedCategory} · ${blogConfig.title}`;
    }
    if (cleanSearch) {
      return `Artigos sobre "${cleanSearch}" · ${blogConfig.title}`;
    }
    return blogConfig.title;
  }, [cleanSearch, selectedCategory]);

  const pageDescription = useMemo(() => {
    if (selectedCategory && cleanSearch) {
      return `Artigos na categoria "${selectedCategory}" correspondentes a "${cleanSearch}" em ${blogConfig.title}.`;
    }
    if (selectedCategory) {
      return `Ensaios e publicações na categoria "${selectedCategory}" em ${blogConfig.title}.`;
    }
    if (cleanSearch) {
      return `Coleção de ensaios e artigos correspondentes a "${cleanSearch}" no ${blogConfig.title}.`;
    }
    return blogConfig.tagline ?? blogConfig.intro.body;
  }, [cleanSearch, selectedCategory]);

  useDocumentMeta({
    title: pageTitle,
    description: pageDescription,
    canonicalPath: '/',
    ogType: 'website',
  });

  const {
    articles,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteArticles();

  const { data: apiCategories } = useCategories();
  const { data: apiTags } = useTags();

  // Consolidação de categorias (do CMS e dos artigos carregados) com contagem de artigos
  const availableCategories = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();

    if (Array.isArray(apiCategories)) {
      for (const c of apiCategories) {
        if (!c?.name) continue;
        const key = c.name.toLowerCase().trim();
        if (!counts.has(key)) {
          counts.set(key, { name: c.name, count: 0 });
        }
      }
    }

    for (const article of articles) {
      for (const cat of article.categories) {
        if (!cat?.name) continue;
        const key = cat.name.toLowerCase().trim();
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(key, { name: cat.name, count: 1 });
        }
      }
    }

    return Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
  }, [apiCategories, articles]);

  // Consolidação de tags (do CMS e dos artigos carregados)
  const availableTags = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();

    if (Array.isArray(apiTags)) {
      for (const t of apiTags) {
        if (!t?.name) continue;
        const key = t.name.toLowerCase().trim();
        if (!counts.has(key)) {
          counts.set(key, { name: t.name, count: 0 });
        }
      }
    }

    for (const article of articles) {
      for (const tag of article.tags) {
        if (!tag?.name) continue;
        const key = tag.name.toLowerCase().trim();
        const existing = counts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(key, { name: tag.name, count: 1 });
        }
      }
    }

    return Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name),
    );
  }, [apiTags, articles]);

  // Artigos filtrados por categoria E/OU busca por tag ou título
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // 1. Filtro por Categoria (se selecionada)
      if (selectedCategory) {
        const catTarget = selectedCategory.toLowerCase().trim();
        const matchesCategory = article.categories.some(
          (c) => c.name.toLowerCase().trim() === catTarget || c.id === selectedCategory,
        );
        if (!matchesCategory) return false;
      }

      // 2. Busca por Tag OU Nome do Artigo (Título ou Subtítulo)
      if (cleanSearch) {
        const target = cleanSearch.toLowerCase().trim();
        const matchesTag = article.tags.some((t) =>
          t.name.toLowerCase().includes(target),
        );
        const matchesTitle = article.title.toLowerCase().includes(target);
        const matchesSubtitle = Boolean(
          article.subtitle && article.subtitle.toLowerCase().includes(target),
        );

        if (!matchesTag && !matchesTitle && !matchesSubtitle) {
          return false;
        }
      }

      return true;
    });
  }, [articles, cleanSearch, selectedCategory]);

  const handleSelectCategory = (category: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    // Remove qualquer variante legada
    nextParams.delete('category');
    if (!category) {
      nextParams.delete('categoria');
    } else {
      nextParams.set('categoria', category);
    }
    setSearchParams(nextParams);
  };

  const handleSearchChange = (newTerm: string) => {
    const nextParams = new URLSearchParams(searchParams);
    const cleaned = newTerm.replace(/^#/, '').trim();
    nextParams.delete('q');
    nextParams.delete('tag');
    if (!cleaned) {
      nextParams.delete('busca');
    } else {
      nextParams.set('busca', cleaned);
    }
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('categoria');
    nextParams.delete('category');
    nextParams.delete('tag');
    nextParams.delete('busca');
    nextParams.delete('q');
    setSearchParams(nextParams);
  };

  return (
    <>
      <EditorialIntro />
      <PostList
        articles={filteredArticles}
        categories={availableCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchTerm={cleanSearch}
        onSearchTermChange={handleSearchChange}
        availableTags={availableTags}
        totalArticlesCount={articles.length}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => {
          void refetch();
        }}
        hasMore={Boolean(hasNextPage)}
        isFetchingMore={isFetchingNextPage}
        onLoadMore={() => {
          void fetchNextPage();
        }}
        promoteHeading={!blogConfig.intro.enabled}
      />
    </>
  );
}

