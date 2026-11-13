import { Box, Container, Link as MuiLink, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';
import { blogConfig } from '../../config/blog.config';

export function Header() {
  const location = useLocation();
  const initial = (blogConfig.title.trim()[0] || 'B').toUpperCase();
  const isHome = location.pathname === '/';

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        borderBottom: `4px solid ${EDITORIAL_COLORS.textPrimary}`,
        backgroundColor: EDITORIAL_COLORS.bgPrimary,
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          width: '100%',
          maxWidth: '1160px',
          mx: 'auto',
          px: { xs: 2, sm: 3.5 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 2, sm: 3 },
            minHeight: '4.5rem',
            py: 1.25,
          }}
        >
          <MuiLink
            component={RouterLink}
            to="/"
            underline="none"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              color: EDITORIAL_COLORS.textPrimary,
              '&:hover .brand-title': {
                color: EDITORIAL_COLORS.navyPrimary,
              },
            }}
          >
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.95rem',
                height: '1.95rem',
                backgroundColor: EDITORIAL_COLORS.textPrimary,
                color: EDITORIAL_COLORS.bgPrimary,
                border: `1px solid ${EDITORIAL_COLORS.textPrimary}`,
                boxShadow: NEOBRUTAL_SHADOWS.brandLogo,
                fontFamily: EDITORIAL_FONTS.serifDisplay,
                fontWeight: 700,
                fontSize: '0.95rem',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {initial}
            </Box>

            <Box
              component="span"
              className="brand-title"
              sx={{
                fontFamily: EDITORIAL_FONTS.serifDisplay,
                fontWeight: 700,
                fontSize: { xs: '1.15rem', sm: '1.25rem' },
                letterSpacing: '-0.02em',
                color: EDITORIAL_COLORS.textPrimary,
                transition: 'color 120ms ease',
              }}
            >
              {blogConfig.title}
            </Box>
          </MuiLink>

          <Box
            component="nav"
            aria-label="Navegação principal"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 2, sm: 3 },
            }}
          >
            <MuiLink
              component={RouterLink}
              to="/"
              underline="none"
              aria-current={isHome ? 'page' : undefined}
              sx={{
                fontFamily: EDITORIAL_FONTS.serifDisplay,
                fontSize: '0.92rem',
                fontWeight: 700,
                color: isHome
                  ? EDITORIAL_COLORS.navyPrimary
                  : EDITORIAL_COLORS.textPrimary,
                borderBottom: isHome
                  ? `2px solid ${EDITORIAL_COLORS.navyPrimary}`
                  : '2px solid transparent',
                pb: 0.25,
                transition: 'color 120ms ease, border-color 120ms ease',
                '&:hover': {
                  color: EDITORIAL_COLORS.navyPrimary,
                  borderColor: EDITORIAL_COLORS.navyPrimary,
                },
              }}
            >
              Artigos
            </MuiLink>
          </Box>

          {blogConfig.tagline && (
            <Typography
              variant="body2"
              sx={{
                display: { xs: 'none', md: 'block' },
                fontFamily: EDITORIAL_FONTS.mono,
                color: EDITORIAL_COLORS.textSecondary,
                fontSize: '0.75rem',
                lineHeight: 1.35,
                textAlign: 'right',
                maxWidth: '48ch',
              }}
            >
              {blogConfig.tagline}
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
}
