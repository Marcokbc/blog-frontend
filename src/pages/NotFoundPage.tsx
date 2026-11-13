import { Box, Link as MuiLink, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../app/theme';
import { blogConfig } from '../config/blog.config';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function NotFoundPage() {
  useDocumentMeta({
    title: `Página não encontrada · ${blogConfig.title}`,
    description: 'A página solicitada não existe.',
    noIndex: true,
  });

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
          404 · Página não encontrada
        </Typography>
        <Typography
          variant="h1"
          component="h1"
          sx={{ fontSize: { xs: '2rem', sm: '3rem' }, mb: 2 }}
        >
          Este endereço não existe.
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: EDITORIAL_COLORS.textSecondary, mb: 4, maxWidth: '50ch' }}
        >
          Retorne à página inicial para consultar o índice completo de textos publicados.
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
          ← Ir para a página inicial
        </MuiLink>
      </Box>
    </Box>
  );
}

