import { Box, Link as MuiLink, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';
import type { ArticleSummary } from '../../domain/post';

interface ArticleNavigationProps {
  previousArticle: ArticleSummary | null;
  nextArticle: ArticleSummary | null;
}

export function ArticleNavigation({
  previousArticle,
  nextArticle,
}: ArticleNavigationProps) {
  const hasAdjacent = Boolean(previousArticle || nextArticle);

  return (
    <Box
      component="nav"
      aria-label="Navegação do artigo"
      sx={{
        maxWidth: '820px',
        mx: 'auto',
        pt: 4,
        pb: { xs: 4, sm: 6 },
        borderTop: `4px solid ${EDITORIAL_COLORS.textPrimary}`,
      }}
    >
      {hasAdjacent && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          <Box>
            {previousArticle && (
              <MuiLink
                component={RouterLink}
                to={`/artigos/${encodeURIComponent(previousArticle.slug)}`}
                underline="none"
                sx={{
                  display: 'block',
                  p: 2.5,
                  border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
                  backgroundColor: EDITORIAL_COLORS.bgSecondary,
                  boxShadow: NEOBRUTAL_SHADOWS.lg,
                  transition:
                    'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
                  '&:hover': {
                    transform: 'translate(3px, 3px)',
                    boxShadow: NEOBRUTAL_SHADOWS.lgHover,
                  },
                }}
              >
                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    display: 'block',
                    mb: 0.75,
                    fontWeight: 700,
                    color: EDITORIAL_COLORS.navyPrimary,
                  }}
                >
                  ← Artigo anterior
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    display: 'block',
                    fontFamily: EDITORIAL_FONTS.serifDisplay,
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    lineHeight: 1.3,
                    color: EDITORIAL_COLORS.textPrimary,
                  }}
                >
                  {previousArticle.title}
                </Typography>
              </MuiLink>
            )}
          </Box>

          <Box>
            {nextArticle && (
              <MuiLink
                component={RouterLink}
                to={`/artigos/${encodeURIComponent(nextArticle.slug)}`}
                underline="none"
                sx={{
                  display: 'block',
                  textAlign: { xs: 'left', sm: 'right' },
                  p: 2.5,
                  border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
                  backgroundColor: EDITORIAL_COLORS.bgSecondary,
                  boxShadow: NEOBRUTAL_SHADOWS.lg,
                  transition:
                    'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
                  '&:hover': {
                    transform: 'translate(3px, 3px)',
                    boxShadow: NEOBRUTAL_SHADOWS.lgHover,
                  },
                }}
              >
                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    display: 'block',
                    mb: 0.75,
                    fontWeight: 700,
                    color: EDITORIAL_COLORS.navyPrimary,
                  }}
                >
                  Próximo artigo →
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    display: 'block',
                    fontFamily: EDITORIAL_FONTS.serifDisplay,
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    lineHeight: 1.3,
                    color: EDITORIAL_COLORS.textPrimary,
                  }}
                >
                  {nextArticle.title}
                </Typography>
              </MuiLink>
            )}
          </Box>
        </Box>
      )}

      <MuiLink
        component={RouterLink}
        to="/"
        underline="none"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 2,
          py: 0.85,
          border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
          backgroundColor: EDITORIAL_COLORS.bgSecondary,
          boxShadow: NEOBRUTAL_SHADOWS.sm,
          fontFamily: EDITORIAL_FONTS.serifDisplay,
          fontSize: '0.86rem',
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
        ← Voltar para a listagem de artigos
      </MuiLink>
    </Box>
  );
}

