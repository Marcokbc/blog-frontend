import { Box, Container, Link as MuiLink, Typography } from '@mui/material';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';
import { blogConfig } from '../../config/blog.config';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleScrollTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: `4px solid ${EDITORIAL_COLORS.textPrimary}`,
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
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            py: 3.5,
          }}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontFamily: EDITORIAL_FONTS.serifDisplay,
                color: EDITORIAL_COLORS.textPrimary,
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              © {currentYear} {blogConfig.title}
              {blogConfig.authorName ? ` — ${blogConfig.authorName}` : ''}
            </Typography>
            {blogConfig.footerNote && (
              <Typography
                variant="body2"
                sx={{
                  mt: 0.25,
                  color: EDITORIAL_COLORS.textSecondary,
                  fontSize: '0.8125rem',
                }}
              >
                {blogConfig.footerNote}
              </Typography>
            )}
          </Box>

          <MuiLink
            href="#top"
            onClick={handleScrollTop}
            underline="none"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.65,
              border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
              backgroundColor: EDITORIAL_COLORS.bgSecondary,
              boxShadow: NEOBRUTAL_SHADOWS.sm,
              fontFamily: EDITORIAL_FONTS.serifDisplay,
              fontSize: '0.8rem',
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
            ↑ Topo
          </MuiLink>
        </Box>
      </Container>
    </Box>
  );
}

