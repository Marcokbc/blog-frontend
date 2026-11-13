import type { SxProps, Theme } from '@mui/material/styles';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';

export const articleProseStyles: SxProps<Theme> = {
  fontFamily: EDITORIAL_FONTS.sans,
  fontSize: { xs: '1.06rem', sm: '1.15rem' },
  lineHeight: 1.8,
  color: EDITORIAL_COLORS.textPrimary,
  wordBreak: 'break-word',
  textRendering: 'optimizeLegibility',

  '& > *:first-of-type': {
    marginTop: 0,
  },
  '& > *:last-child': {
    marginBottom: 0,
  },

  '& h1': {
    fontFamily: EDITORIAL_FONTS.serifDisplay,
    fontWeight: 700,
    fontSize: { xs: '1.9rem', sm: '2.3rem' },
    lineHeight: 1.12,
    letterSpacing: '-0.02em',
    color: EDITORIAL_COLORS.textPrimary,
    mt: '2.2em',
    mb: '0.65em',
  },
  '& h2': {
    fontFamily: EDITORIAL_FONTS.serifDisplay,
    fontWeight: 700,
    fontSize: { xs: '1.5rem', sm: '1.85rem' },
    lineHeight: 1.18,
    letterSpacing: '-0.015em',
    color: EDITORIAL_COLORS.textPrimary,
    mt: '2.1em',
    mb: '0.65em',
  },
  '& h3': {
    fontFamily: EDITORIAL_FONTS.serifDisplay,
    fontWeight: 700,
    fontSize: { xs: '1.25rem', sm: '1.45rem' },
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    color: EDITORIAL_COLORS.navyPrimary,
    mt: '1.8em',
    mb: '0.55em',
  },
  '& h4': {
    fontFamily: EDITORIAL_FONTS.mono,
    fontWeight: 700,
    fontSize: '0.88rem',
    lineHeight: 1.4,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: EDITORIAL_COLORS.navySecondary,
    mt: '1.8em',
    mb: '0.55em',
  },

  '& p': {
    mt: 0,
    mb: '1.35em',
  },

  '& strong, & b': {
    fontWeight: 700,
    color: EDITORIAL_COLORS.textPrimary,
  },
  '& em, & i': {
    fontStyle: 'italic',
  },

  '& a': {
    color: EDITORIAL_COLORS.navyPrimary,
    fontWeight: 700,
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    textDecorationThickness: '2px',
    transition: 'color 120ms ease, background-color 120ms ease',
    '&:hover': {
      color: EDITORIAL_COLORS.bgPrimary,
      backgroundColor: EDITORIAL_COLORS.navyPrimary,
    },
    '&:focus-visible': {
      outline: `2px solid ${EDITORIAL_COLORS.navyPrimary}`,
      outlineOffset: '2px',
    },
  },

  '& ul, & ol': {
    mt: 0,
    mb: '1.5em',
    pl: { xs: '1.35em', sm: '1.65em' },
  },
  '& ul': {
    listStyleType: 'square',
  },
  '& ol': {
    listStyleType: 'decimal',
  },
  '& li': {
    mb: '0.5em',
    pl: '0.25em',
  },
  '& li > ul, & li > ol': {
    mt: '0.5em',
    mb: '0.5em',
  },

  '& blockquote': {
    mx: 0,
    my: '1.85em',
    p: { xs: 2, sm: 2.5 },
    border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
    borderLeft: `8px solid ${EDITORIAL_COLORS.navyPrimary}`,
    backgroundColor: EDITORIAL_COLORS.bgSecondary,
    boxShadow: NEOBRUTAL_SHADOWS.md,
    fontSize: '1.05rem',
    fontWeight: 500,
    lineHeight: 1.7,
    color: EDITORIAL_COLORS.textPrimary,
    '& p:last-child': {
      mb: 0,
    },
  },

  '& figure': {
    mx: 0,
    my: '2.1em',
    p: 0,
  },
  '& img': {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
    boxShadow: NEOBRUTAL_SHADOWS.md,
    backgroundColor: EDITORIAL_COLORS.bgSecondary,
  },
  '& p > img': {
    my: '1.5em',
  },
  '& figcaption': {
    mt: '0.85em',
    fontFamily: EDITORIAL_FONTS.mono,
    fontSize: '0.78rem',
    fontWeight: 500,
    lineHeight: 1.45,
    color: EDITORIAL_COLORS.textSecondary,
    borderLeft: `3px solid ${EDITORIAL_COLORS.navyPrimary}`,
    pl: '0.75em',
  },

  '& code': {
    fontFamily: EDITORIAL_FONTS.mono,
    fontSize: '0.86em',
    fontWeight: 600,
    backgroundColor: EDITORIAL_COLORS.navySoft,
    color: EDITORIAL_COLORS.navyPrimary,
    border: `1px solid ${EDITORIAL_COLORS.navyPrimary}`,
    padding: '0.08rem 0.3rem',
  },
  '& pre': {
    my: '1.8em',
    p: { xs: 2, sm: 2.5 },
    overflowX: 'auto',
    backgroundColor: EDITORIAL_COLORS.bgSecondary,
    border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
    boxShadow: NEOBRUTAL_SHADOWS.md,
    fontFamily: EDITORIAL_FONTS.mono,
    fontSize: '0.88rem',
    lineHeight: 1.55,
    color: EDITORIAL_COLORS.textPrimary,
  },
  '& pre code': {
    backgroundColor: 'transparent',
    border: 'none',
    padding: 0,
    color: 'inherit',
    fontSize: 'inherit',
    fontWeight: 400,
  },

  '& .editorial-table-scroll': {
    width: '100%',
    overflowX: 'auto',
    my: '2em',
    border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
    backgroundColor: EDITORIAL_COLORS.bgPrimary,
    boxShadow: NEOBRUTAL_SHADOWS.md,
  },
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: EDITORIAL_FONTS.sans,
    fontSize: '0.92rem',
    lineHeight: 1.5,
    textAlign: 'left',
  },
  '& th, & td': {
    padding: '0.75em 1em',
    borderBottom: `1px solid ${EDITORIAL_COLORS.textPrimary}`,
    borderRight: `1px solid ${EDITORIAL_COLORS.textPrimary}`,
    verticalAlign: 'top',
  },
  '& th:last-child, & td:last-child': {
    borderRight: 'none',
  },
  '& tbody tr:last-child td': {
    borderBottom: 'none',
  },
  '& thead th': {
    backgroundColor: EDITORIAL_COLORS.navyPrimary,
    color: EDITORIAL_COLORS.bgPrimary,
    fontFamily: EDITORIAL_FONTS.serifDisplay,
    fontWeight: 700,
    fontSize: '0.8rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    borderBottom: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
  },

  '& hr': {
    border: 0,
    borderTop: `3px solid ${EDITORIAL_COLORS.textPrimary}`,
    my: '2.5em',
  },
};
