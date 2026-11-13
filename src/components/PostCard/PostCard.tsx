import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';
import type { ArticleSummary } from '../../domain/post';
import { formatReadingTime } from '../../utils/content';
import { formatLongDate } from '../../utils/date';

interface PostCardProps {
  post: ArticleSummary;
  index: number;
  onSelectCategory?: (categoryName: string) => void;
  onSelectTag?: (tagName: string) => void;
}

export function PostCard({
  post,
  index,
  onSelectCategory,
  onSelectTag,
}: PostCardProps) {
  const navigate = useNavigate();
  const [bannerFailed, setBannerFailed] = useState(false);

  useEffect(() => {
    setBannerFailed(false);
  }, [post.bannerImageUrl]);

  const formattedIndex = String(index + 1).padStart(2, '0');
  const displayDate = formatLongDate(post.publishedAt ?? post.createdAt);
  const readingTime = formatReadingTime(post.readingTimeMinutes);
  const summaryText = post.subtitle?.trim() || post.excerpt?.trim() || '';
  const showSummary =
    Boolean(summaryText) &&
    summaryText.toLowerCase() !== post.title.trim().toLowerCase();
  const showBanner = Boolean(post.bannerImageUrl) && !bannerFailed;
  const badgeText =
    post.categories[0]?.name || (index === 0 ? 'mais recente' : undefined);

  return (
    <Box
      component="article"
      sx={{
        border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
        backgroundColor: EDITORIAL_COLORS.bgSecondary,
        boxShadow: NEOBRUTAL_SHADOWS.lg,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': {
          transform: 'translate(3px, 3px)',
          boxShadow: NEOBRUTAL_SHADOWS.lgHover,
        },
        '&:hover .post-card-title': {
          color: EDITORIAL_COLORS.navyPrimary,
        },
      }}
    >
      <Box
        component={RouterLink}
        to={`/artigos/${encodeURIComponent(post.slug)}`}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: showBanner ? '1fr 270px' : '1fr',
          },
          gap: { xs: 2.5, md: 3.5 },
          alignItems: 'center',
          p: { xs: 2.5, sm: 3.25 },
          textDecoration: 'none',
          color: 'inherit',
          '&:focus-visible': {
            outline: `2px solid ${EDITORIAL_COLORS.navyPrimary}`,
            outlineOffset: '-4px',
          },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            className="post-card-title"
            variant="h2"
            component="h2"
            sx={{
              fontFamily: EDITORIAL_FONTS.serifDisplay,
              fontSize: 'clamp(1.45rem, 2.8vw, 2.05rem)',
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: '0.005em',
              color: EDITORIAL_COLORS.textPrimary,
              transition: 'color 150ms ease',
            }}
          >
            {post.title}
          </Typography>

          {/* Seasons split date + reading time + badge pill */}
          <Box sx={{ mt: 1.5 }}>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                flexWrap: 'wrap',
                gap: '2px',
                border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
                backgroundColor: EDITORIAL_COLORS.textPrimary,
                boxShadow: NEOBRUTAL_SHADOWS.sm,
                fontFamily: EDITORIAL_FONTS.serifDisplay,
                fontSize: { xs: '0.8rem', sm: '0.88rem' },
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '0.02em',
              }}
            >
              <Box
                component="span"
                sx={{
                  flex: { xs: '1 1 auto', sm: '0 0 auto' },
                  px: 1.5,
                  py: 0.65,
                  backgroundColor: EDITORIAL_COLORS.bgPrimary,
                  color: EDITORIAL_COLORS.textPrimary,
                }}
              >
                {displayDate ? (
                  <time dateTime={post.publishedAt ?? post.createdAt}>
                    {displayDate}
                  </time>
                ) : (
                  `#${formattedIndex}`
                )}
              </Box>

              <Box
                component="span"
                sx={{
                  flex: { xs: '1 1 auto', sm: '0 0 auto' },
                  px: 1.5,
                  py: 0.65,
                  backgroundColor: EDITORIAL_COLORS.navySoft,
                  color: EDITORIAL_COLORS.navyPrimary,
                }}
              >
                {readingTime}
              </Box>

              {badgeText && (
                <Box
                  component={post.categories[0]?.name ? 'button' : 'span'}
                  type={post.categories[0]?.name ? 'button' : undefined}
                  onClick={
                    post.categories[0]?.name
                      ? (e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onSelectCategory) {
                            onSelectCategory(post.categories[0].name);
                          } else {
                            navigate(
                              `/?categoria=${encodeURIComponent(post.categories[0].name)}`,
                            );
                          }
                        }
                      : undefined
                  }
                  title={
                    post.categories[0]?.name
                      ? `Filtrar pela categoria ${post.categories[0].name}`
                      : undefined
                  }
                  aria-label={
                    post.categories[0]?.name
                      ? `Filtrar pela categoria ${post.categories[0].name}`
                      : undefined
                  }
                  sx={{
                    flex: { xs: '1 1 auto', sm: '0 0 auto' },
                    px: 1.5,
                    py: 0.65,
                    border: 'none',
                    outline: 'none',
                    cursor: post.categories[0]?.name ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    lineHeight: 'inherit',
                    backgroundColor: EDITORIAL_COLORS.navyPrimary,
                    color: EDITORIAL_COLORS.bgPrimary,
                    transition: 'background-color 120ms ease',
                    '&:hover': post.categories[0]?.name
                      ? {
                          backgroundColor: EDITORIAL_COLORS.navySecondary,
                        }
                      : undefined,
                  }}
                >
                  {badgeText}
                </Box>
              )}
            </Box>
          </Box>

          {showSummary && (
            <Typography
              variant="body1"
              sx={{
                mt: 2,
                fontSize: '1rem',
                lineHeight: 1.58,
                color: EDITORIAL_COLORS.textSecondary,
                maxWidth: '68ch',
              }}
            >
              {summaryText}
            </Typography>
          )}

          {post.tags.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mt: 2,
                maxWidth: '680px',
              }}
            >
              {post.tags.map((tag) => (
                <Box
                  key={tag.id}
                  component="button"
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onSelectTag) {
                      onSelectTag(tag.name);
                    } else {
                      navigate(`/?tag=${encodeURIComponent(tag.name)}`);
                    }
                  }}
                  title={`Filtrar artigos por #${tag.name}`}
                  aria-label={`Filtrar artigos por #${tag.name}`}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: '0.6rem',
                    py: '0.16rem',
                    fontFamily: EDITORIAL_FONTS.mono,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    lineHeight: 1.4,
                    color: EDITORIAL_COLORS.navyPrimary,
                    backgroundColor: EDITORIAL_COLORS.navySoft,
                    border: `1px solid ${EDITORIAL_COLORS.navyPrimary}`,
                    cursor: 'pointer',
                    outline: 'none',
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
        </Box>

        {showBanner && (
          <Box
            sx={{
              width: { xs: '100%', md: '270px' },
              aspectRatio: '16 / 9',
              overflow: 'hidden',
              border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
              boxShadow: NEOBRUTAL_SHADOWS.md,
              backgroundColor: EDITORIAL_COLORS.bgPrimary,
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={post.bannerImageUrl}
              alt={`Banner do artigo ${post.title}`}
              loading={index < 3 ? 'eager' : 'lazy'}
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setBannerFailed(true)}
              sx={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
