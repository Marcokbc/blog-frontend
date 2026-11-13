import { Box, Typography } from '@mui/material';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';
import { blogConfig } from '../../config/blog.config';

function renderHighlightedHeading(text: string) {
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) {
    return <span className="seasons-highlight">{text}</span>;
  }
  const head = words.slice(0, 2).join(' ');
  const tail = words.slice(2).join(' ');
  return (
    <>
      <span className="seasons-highlight">{head}</span> {tail}
    </>
  );
}

export function EditorialIntro() {
  if (!blogConfig.intro.enabled) {
    return null;
  }

  return (
    <Box
      component="section"
      aria-labelledby="editorial-intro-heading"
      sx={{
        pt: { xs: 4, sm: 6 },
        pb: { xs: 2, sm: 3 },
      }}
    >
      <Typography
        id="editorial-intro-heading"
        variant="h1"
        component="h1"
        sx={{
          fontFamily: EDITORIAL_FONTS.serifDisplay,
          fontWeight: 700,
          fontSize: 'clamp(2.1rem, 4.2vw, 3.6rem)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: EDITORIAL_COLORS.textPrimary,
          maxWidth: '24ch',
          mb: { xs: 3, sm: 4 },
        }}
      >
        {renderHighlightedHeading(blogConfig.intro.heading)}
      </Typography>

      <Box
        sx={{
          border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
          backgroundColor: EDITORIAL_COLORS.bgSecondary,
          boxShadow: NEOBRUTAL_SHADOWS.lg,
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        {(blogConfig.intro.kicker || blogConfig.authorName) && (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
              boxShadow: NEOBRUTAL_SHADOWS.sm,
              mb: 2,
              fontFamily: EDITORIAL_FONTS.serifDisplay,
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {blogConfig.intro.kicker && (
              <Box
                component="span"
                sx={{
                  px: 1.25,
                  py: 0.4,
                  backgroundColor: EDITORIAL_COLORS.bgPrimary,
                  color: EDITORIAL_COLORS.textPrimary,
                }}
              >
                {blogConfig.intro.kicker}
              </Box>
            )}
            {blogConfig.authorName && (
              <Box
                component="span"
                sx={{
                  px: 1.25,
                  py: 0.4,
                  borderLeft: blogConfig.intro.kicker
                    ? `2px solid ${EDITORIAL_COLORS.textPrimary}`
                    : 'none',
                  backgroundColor: EDITORIAL_COLORS.navyPrimary,
                  color: EDITORIAL_COLORS.bgPrimary,
                }}
              >
                {blogConfig.authorName}
              </Box>
            )}
          </Box>
        )}

        <Typography
          variant="body1"
          sx={{
            fontFamily: EDITORIAL_FONTS.serifDisplay,
            fontSize: { xs: '1.05rem', sm: '1.22rem' },
            lineHeight: 1.7,
            color: EDITORIAL_COLORS.textPrimary,
            maxWidth: '72ch',
          }}
        >
          {blogConfig.intro.body}
        </Typography>
      </Box>
    </Box>
  );
}
