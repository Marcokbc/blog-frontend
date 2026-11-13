import { Box, Button, Typography } from '@mui/material';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';
import type { ArticleSummary } from '../../domain/post';
import { ArticleFilters, type FilterOption } from '../ArticleFilters/ArticleFilters';
import { LoadingState } from '../LoadingState/LoadingState';
import { PostCard } from '../PostCard/PostCard';

interface PostListProps {
  articles: ArticleSummary[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
  promoteHeading?: boolean;
  categories?: FilterOption[];
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  tagSearch?: string;
  onTagSearchChange?: (search: string) => void;
  availableTags?: FilterOption[];
  totalArticlesCount?: number;
  onClearFilters?: () => void;
  // Compatibilidade legada
  tags?: FilterOption[];
  selectedTag?: string | null;
  onSelectTag?: (tag: string | null) => void;
}

export function PostList({
  articles,
  isLoading,
  isError,
  error,
  onRetry,
  hasMore,
  isFetchingMore,
  onLoadMore,
  promoteHeading = false,
  categories = [],
  selectedCategory = null,
  onSelectCategory,
  tagSearch = '',
  onTagSearchChange,
  availableTags = [],
  totalArticlesCount,
  onClearFilters,
  tags = [],
  selectedTag = null,
  onSelectTag,
}: PostListProps) {
  // Unifica tagSearch com selectedTag caso caller legado use apenas selectedTag
  const effectiveTagSearch = tagSearch || (selectedTag ?? '');
  const handleTagSearchChange = onTagSearchChange ?? onSelectTag;
  const effectiveTags = availableTags.length > 0 ? availableTags : tags;

  const isFiltering = Boolean(
    selectedCategory || (effectiveTagSearch && effectiveTagSearch.trim().length > 0),
  );

  const handleClearAll = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      onSelectCategory?.(null);
      handleTagSearchChange?.('');
    }
  };

  return (
    <Box
      component="section"
      aria-labelledby="articles-section-heading"
      sx={{ py: { xs: 3, sm: 4 } }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          id="articles-section-heading"
          variant={promoteHeading ? 'h1' : 'h2'}
          component={promoteHeading ? 'h1' : 'h2'}
          sx={{
            fontFamily: EDITORIAL_FONTS.serifDisplay,
            fontWeight: 700,
            fontSize: promoteHeading
              ? 'clamp(1.8rem, 3.2vw, 2.4rem)'
              : 'clamp(1.5rem, 2.8vw, 2rem)',
            letterSpacing: '-0.02em',
            color: EDITORIAL_COLORS.textPrimary,
          }}
        >
          Artigos publicados
        </Typography>

        {!isLoading && !isError && (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.45,
              border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
              backgroundColor: EDITORIAL_COLORS.bgSecondary,
              boxShadow: NEOBRUTAL_SHADOWS.sm,
              fontFamily: EDITORIAL_FONTS.mono,
              fontSize: '0.78rem',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: EDITORIAL_COLORS.textPrimary,
            }}
          >
            {isFiltering && totalArticlesCount !== undefined
              ? `${articles.length} de ${totalArticlesCount} ${
                  totalArticlesCount === 1 ? 'artigo' : 'artigos'
                }`
              : `${articles.length} ${articles.length === 1 ? 'artigo' : 'artigos'}${
                  hasMore ? '+' : ''
                }`}
          </Box>
        )}
      </Box>

      {/* Controles de Filtro de Categoria e Busca por Tag */}
      {!isLoading &&
        !isError &&
        (categories.length > 0 || effectiveTags.length > 0 || Boolean(handleTagSearchChange)) && (
          <ArticleFilters
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory ?? (() => {})}
            tagSearch={effectiveTagSearch}
            onTagSearchChange={handleTagSearchChange ?? (() => {})}
            availableTags={effectiveTags}
            filteredCount={articles.length}
          />
        )}

      {isLoading && <LoadingState variant="list" rows={3} />}

      {!isLoading && isError && (
        <Box
          role="alert"
          sx={{
            p: { xs: 3, sm: 4 },
            border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
            backgroundColor: EDITORIAL_COLORS.bgSecondary,
            boxShadow: NEOBRUTAL_SHADOWS.lg,
          }}
        >
          <Typography
            variant="caption"
            component="p"
            sx={{ color: EDITORIAL_COLORS.navyPrimary, fontWeight: 700, mb: 1 }}
          >
            Falha ao carregar artigos
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, maxWidth: '58ch' }}>
            {error?.message ||
              'Não foi possível obter a lista de artigos publicados no momento.'}
          </Typography>
          <Button variant="outlined" onClick={onRetry}>
            Tentar novamente
          </Button>
        </Box>
      )}

      {!isLoading && !isError && articles.length === 0 && (
        <Box
          sx={{
            p: { xs: 3.5, sm: 4.5 },
            border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
            backgroundColor: EDITORIAL_COLORS.bgSecondary,
            boxShadow: NEOBRUTAL_SHADOWS.lg,
          }}
        >
          <Typography
            variant="h3"
            component="p"
            sx={{
              fontFamily: EDITORIAL_FONTS.serifDisplay,
              fontSize: { xs: '1.25rem', sm: '1.45rem' },
              fontWeight: 700,
              mb: 1,
            }}
          >
            {isFiltering
              ? 'Nenhum artigo encontrado.'
              : 'Nenhum artigo publicado ainda.'}
          </Typography>
          <Typography variant="body2" sx={{ maxWidth: '54ch', mb: isFiltering ? 2.5 : 0 }}>
            {isFiltering
              ? `Não encontramos artigos associados ${
                  selectedCategory ? `à categoria "${selectedCategory}"` : ''
                }${selectedCategory && effectiveTagSearch ? ' e ' : ''}${
                  effectiveTagSearch
                    ? `à tag "#${effectiveTagSearch.replace(/^#/, '').trim()}"`
                    : ''
                }. Tente selecionar outra categoria ou buscar por outra tag.`
              : 'Assim que o primeiro texto for publicado no DraftIn, ele aparecerá aqui em ordem cronológica.'}
          </Typography>
          {isFiltering && (
            <Button
              variant="outlined"
              onClick={handleClearAll}
              sx={{
                fontFamily: EDITORIAL_FONTS.mono,
                fontSize: '0.82rem',
              }}
            >
              ← Ver todos os artigos
            </Button>
          )}
        </Box>
      )}

      {!isLoading && !isError && articles.length > 0 && (
        <>
          <Box sx={{ display: 'grid', gap: { xs: 3, sm: 4 } }}>
            {articles.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                onSelectCategory={onSelectCategory}
                onSelectTag={handleTagSearchChange}
              />
            ))}
          </Box>

          {hasMore && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                pt: 4,
              }}
            >
              <Button
                variant="outlined"
                onClick={onLoadMore}
                disabled={isFetchingMore}
              >
                {isFetchingMore
                  ? 'Carregando arquivos...'
                  : 'Carregar artigos anteriores'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
