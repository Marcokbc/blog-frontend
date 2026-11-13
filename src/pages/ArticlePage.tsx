import { Box, Button, Link as MuiLink, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../app/theme';
import { ArticleContent } from '../components/ArticleContent/ArticleContent';
import { ArticleHeader } from '../components/ArticleHeader/ArticleHeader';
import { ArticleNavigation } from '../components/ArticleNavigation/ArticleNavigation';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { blogConfig } from '../config/blog.config';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useAdjacentArticles, useArticleBySlug } from '../hooks/usePosts';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  const { data: article, isLoading, isError, error, refetch } = useArticleBySlug(slug);
  const { previousArticle, nextArticle } = useAdjacentArticles(slug, Boolean(article));

  const isNotFound = !isLoading && !isError && article === null;

  useDocumentMeta({
    title: article
      ? `${article.title} · ${blogConfig.title}`
      : isNotFound
        ? `Artigo não encontrado · ${blogConfig.title}`
        : blogConfig.title,
    description: article
      ? article.excerpt || blogConfig.tagline
      : isNotFound
        ? 'O artigo solicitado não existe ou não está publicado.'
        : blogConfig.tagline,
    canonicalPath: slug ? `/artigos/${encodeURIComponent(slug)}` : undefined,
    ogType: article ? 'article' : 'website',
    imageUrl: article?.coverImageUrl,
    publishedTime: article?.publishedAt,
    modifiedTime: article?.updatedAt,
    noIndex: isNotFound,
  });

  if (isLoading) {
    return <LoadingState variant="article" />;
  }

  if (isError) {
    return (
      <Box sx={{ maxWidth: '820px', mx: 'auto', py: { xs: 5, sm: 8 } }}>
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
            Erro ao carregar o artigo
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            {error instanceof Error
              ? error.message
              : 'Não foi possível carregar este texto no momento.'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => {
                void refetch();
              }}
            >
              Tentar novamente
            </Button>
            <MuiLink
              component={RouterLink}
              to="/"
              underline="hover"
              sx={{
                fontFamily: EDITORIAL_FONTS.serifDisplay,
                fontSize: '0.88rem',
                fontWeight: 700,
              }}
            >
              ← Voltar aos artigos
            </MuiLink>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!article) {
    return (
      <Box sx={{ maxWidth: '820px', mx: 'auto', py: { xs: 6, sm: 9 } }}>
        <Box
          sx={{
            p: { xs: 3.5, sm: 5 },
            border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
            backgroundColor: EDITORIAL_COLORS.bgSecondary,
            boxShadow: NEOBRUTAL_SHADOWS.lg,
          }}
        >
          <Typography
            variant="caption"
            component="p"
            sx={{ color: EDITORIAL_COLORS.navyPrimary, fontWeight: 700, mb: 1.5 }}
          >
            404 · Conteúdo indisponível
          </Typography>
          <Typography
            variant="h1"
            component="h1"
            sx={{ fontSize: { xs: '2rem', sm: '3rem' }, mb: 2 }}
          >
            Artigo não encontrado.
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: EDITORIAL_COLORS.textSecondary, mb: 4, maxWidth: '52ch' }}
          >
            O texto procurado pode ter sido removido, ter tido o endereço alterado ou ainda não estar publicado.
          </Typography>
          <MuiLink
            component={RouterLink}
            to="/"
            underline="none"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 2,
              py: 0.9,
              border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
              backgroundColor: EDITORIAL_COLORS.bgPrimary,
              boxShadow: NEOBRUTAL_SHADOWS.sm,
              fontFamily: EDITORIAL_FONTS.serifDisplay,
              fontSize: '0.88rem',
              fontWeight: 700,
              color: EDITORIAL_COLORS.textPrimary,
              transition:
                'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease, color 120ms ease',
              '&:hover': {
                transform: 'translate(1px, 1px)',
                boxShadow: NEOBRUTAL_SHADOWS.smHover,
                backgroundColor: EDITORIAL_COLORS.navyPrimary,
                color: EDITORIAL_COLORS.bgPrimary,
              },
            }}
          >
            ← Voltar para a listagem
          </MuiLink>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="article">
      <ArticleHeader article={article} />
      <ArticleContent content={article.content} format={article.contentFormat} />
      <ArticleNavigation
        previousArticle={previousArticle}
        nextArticle={nextArticle}
      />
    </Box>
  );
}
