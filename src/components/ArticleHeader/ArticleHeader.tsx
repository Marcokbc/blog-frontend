import { Box, Link as MuiLink, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';
import type { Article } from '../../domain/post';
import { formatReadingTime } from '../../utils/content';
import { formatLongDate } from '../../utils/date';

interface ArticleHeaderProps {
  article: Article;
}

export function ArticleHeader({ article }: ArticleHeaderProps) {
  const [bannerFailed, setBannerFailed] = useState(false);

  useEffect(() => {
    setBannerFailed(false);
  }, [article.bannerImageUrl]);

  const isoDate = article.publishedAt ?? article.createdAt;
  const displayDate = formatLongDate(isoDate);
  const readingTime = formatReadingTime(article.readingTimeMinutes);
  const showBanner = Boolean(article.bannerImageUrl) && !bannerFailed;

  return (
    <Box
      component="header"
      sx={{
        maxWidth: '820px',
        mx: 'auto',
        pt: { xs: 3, sm: 5 },
        pb: { xs: 3.5, sm: 4 },
        mb: { xs: 3.5, sm: 4.5 },
        borderBottom: `4px solid ${EDITORIAL_COLORS.textPrimary}`,
      }}
    >
      <MuiLink
        component={RouterLink}
        to="/"
        underline="none"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          mb: { xs: 2.5, sm: 3.5 },
          px: 1.75,
          py: 0.75,
          border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
          backgroundColor: EDITORIAL_COLORS.bgSecondary,
          boxShadow: NEOBRUTAL_SHADOWS.sm,
          fontFamily: EDITORIAL_FONTS.serifDisplay,
          fontSize: '0.84rem',
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
        ← Voltar aos artigos
      </MuiLink>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: 1.25,
          rowGap: 0.5,
          mb: 1.25,
          fontFamily: EDITORIAL_FONTS.serifDisplay,
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          color: EDITORIAL_COLORS.textSecondary,
        }}
      >
        {displayDate && (
          <>
            <time dateTime={isoDate}>{displayDate}</time>
            <Box
              component="span"
              aria-hidden="true"
              sx={{ display: { xs: 'none', sm: 'inline' } }}
            >
              ·
            </Box>
          </>
        )}

        <span>{readingTime}</span>

        {article.authorName && (
          <>
            <Box
              component="span"
              aria-hidden="true"
              sx={{ display: { xs: 'none', sm: 'inline' } }}
            >
              ·
            </Box>
            <Box
              component="span"
              sx={{ color: EDITORIAL_COLORS.navyPrimary, fontWeight: 700 }}
            >
              {article.authorName}
            </Box>
          </>
        )}

        {article.categories.length > 0 && (
          <>
            <Box
              component="span"
              aria-hidden="true"
              sx={{ display: { xs: 'none', sm: 'inline' } }}
            >
              ·
            </Box>
            <Box component="span" sx={{ color: EDITORIAL_COLORS.navySecondary }}>
              {article.categories.map((cat, idx) => (
                <span key={cat.id}>
                  {idx > 0 && ' / '}
                  <MuiLink
                    component={RouterLink}
                    to={`/?categoria=${encodeURIComponent(cat.name)}`}
                    sx={{
                      color: 'inherit',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {cat.name}
                  </MuiLink>
                </span>
              ))}
            </Box>
          </>
        )}
      </Box>

      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontFamily: EDITORIAL_FONTS.serifDisplay,
          fontSize: 'clamp(2rem, 4vw, 3.4rem)',
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: '0.005em',
          color: EDITORIAL_COLORS.textPrimary,
          maxWidth: '22ch',
        }}
      >
        {article.title}
      </Typography>

      {article.subtitle && (
        <Typography
          variant="subtitle1"
          component="p"
          sx={{
            mt: 2,
            fontFamily: EDITORIAL_FONTS.sans,
            fontSize: { xs: '1.08rem', sm: '1.18rem' },
            lineHeight: 1.7,
            color: EDITORIAL_COLORS.textSecondary,
            maxWidth: '680px',
          }}
        >
          {article.subtitle}
        </Typography>
      )}

      {article.tags.length > 0 && (
        <Box
          aria-label="Tags do artigo"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mt: 2,
            maxWidth: '680px',
          }}
        >
          {article.tags.map((tag) => (
            <Box
              key={tag.id}
              component={RouterLink}
              to={`/?tag=${encodeURIComponent(tag.name)}`}
              title={`Ver todos os artigos com a tag #${tag.name}`}
              aria-label={`Ver artigos sobre #${tag.name}`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: '0.6rem',
                py: '0.16rem',
                fontFamily: EDITORIAL_FONTS.mono,
                fontSize: '0.72rem',
                fontWeight: 700,
                lineHeight: 1.4,
                textDecoration: 'none',
                color: EDITORIAL_COLORS.navyPrimary,
                backgroundColor: EDITORIAL_COLORS.navySoft,
                border: `1px solid ${EDITORIAL_COLORS.navyPrimary}`,
                transition:
                  'background-color 120ms ease, color 120ms ease, transform 120ms ease',
                '&:hover': {
                  backgroundColor: EDITORIAL_COLORS.navyPrimary,
                  color: EDITORIAL_COLORS.bgPrimary,
                  transform: 'translate(1px, 1px)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
                  outlineOffset: '2px',
                },
              }}
            >
              #{tag.name}
            </Box>
          ))}
        </Box>
      )}

      {showBanner && (
        <Box
          component="figure"
          sx={{
            mt: { xs: 3, sm: 3.5 },
            mb: 0,
            mx: 0,
          }}
        >
          <Box
            component="img"
            src={article.bannerImageUrl}
            alt={article.title}
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            sx={{
              display: 'block',
              width: '100%',
              aspectRatio: '1200 / 630',
              maxHeight: '440px',
              objectFit: 'cover',
              border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
              boxShadow: NEOBRUTAL_SHADOWS.lg,
              backgroundColor: EDITORIAL_COLORS.bgSecondary,
            }}
          />
        </Box>
      )}
    </Box>
  );
}
