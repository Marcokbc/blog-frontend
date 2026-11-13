import { createTheme, type Shadows } from '@mui/material/styles';

export const EDITORIAL_COLORS = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F5F5F5',
  textPrimary: '#000000',
  textSecondary: '#555555',
  border: '#D0D0D0',
  navyPrimary: '#14213D',
  navySecondary: '#23395B',
  navySoft: '#E8EDF5',
} as const;

export const EDITORIAL_FONTS = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  serifDisplay: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  serifBody: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

export const NEOBRUTAL_SHADOWS = {
  sm: `3px 3px 0 0 ${EDITORIAL_COLORS.textPrimary}`,
  smHover: `2px 2px 0 0 ${EDITORIAL_COLORS.textPrimary}`,
  md: `4px 4px 0 0 ${EDITORIAL_COLORS.textPrimary}`,
  lg: `6px 6px 0 0 ${EDITORIAL_COLORS.textPrimary}`,
  lgHover: `3px 3px 0 0 ${EDITORIAL_COLORS.textPrimary}`,
  navySm: `3px 3px 0 0 ${EDITORIAL_COLORS.navyPrimary}`,
  brandLogo: `2px 2px 0 0 ${EDITORIAL_COLORS.navySecondary}, 4px 4px 0 0 ${EDITORIAL_COLORS.navyPrimary}`,
} as const;

const noShadows = Array(25).fill('none') as unknown as Shadows;

export const brutalistTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: EDITORIAL_COLORS.bgPrimary,
      paper: EDITORIAL_COLORS.bgSecondary,
    },
    text: {
      primary: EDITORIAL_COLORS.textPrimary,
      secondary: EDITORIAL_COLORS.textSecondary,
    },
    divider: EDITORIAL_COLORS.border,
    primary: {
      main: EDITORIAL_COLORS.navyPrimary,
      dark: EDITORIAL_COLORS.navySecondary,
      light: EDITORIAL_COLORS.navySoft,
      contrastText: EDITORIAL_COLORS.bgPrimary,
    },
    secondary: {
      main: EDITORIAL_COLORS.navySecondary,
      light: EDITORIAL_COLORS.navySoft,
      contrastText: EDITORIAL_COLORS.bgPrimary,
    },
    error: {
      main: EDITORIAL_COLORS.navyPrimary,
      light: EDITORIAL_COLORS.navySoft,
      dark: EDITORIAL_COLORS.textPrimary,
      contrastText: EDITORIAL_COLORS.bgPrimary,
    },
    info: {
      main: EDITORIAL_COLORS.navySecondary,
      light: EDITORIAL_COLORS.navySoft,
      contrastText: EDITORIAL_COLORS.bgPrimary,
    },
  },
  shape: {
    borderRadius: 0,
  },
  shadows: noShadows,
  typography: {
    fontFamily: EDITORIAL_FONTS.sans,
    h1: {
      fontFamily: EDITORIAL_FONTS.serifDisplay,
      fontWeight: 700,
      lineHeight: 1.08,
      letterSpacing: '-0.025em',
      color: EDITORIAL_COLORS.textPrimary,
    },
    h2: {
      fontFamily: EDITORIAL_FONTS.serifDisplay,
      fontWeight: 600,
      lineHeight: 1.16,
      letterSpacing: '-0.018em',
      color: EDITORIAL_COLORS.textPrimary,
    },
    h3: {
      fontFamily: EDITORIAL_FONTS.sans,
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.012em',
      color: EDITORIAL_COLORS.textPrimary,
    },
    h4: {
      fontFamily: EDITORIAL_FONTS.mono,
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: '0.04em',
      color: EDITORIAL_COLORS.navyPrimary,
    },
    subtitle1: {
      fontFamily: EDITORIAL_FONTS.serifBody,
      fontWeight: 400,
      lineHeight: 1.5,
      color: EDITORIAL_COLORS.textSecondary,
    },
    body1: {
      fontFamily: EDITORIAL_FONTS.sans,
      fontSize: '1rem',
      lineHeight: 1.65,
      color: EDITORIAL_COLORS.textPrimary,
    },
    body2: {
      fontFamily: EDITORIAL_FONTS.sans,
      fontSize: '0.875rem',
      lineHeight: 1.55,
      color: EDITORIAL_COLORS.textSecondary,
    },
    caption: {
      fontFamily: EDITORIAL_FONTS.mono,
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: EDITORIAL_COLORS.textSecondary,
    },
    button: {
      fontFamily: EDITORIAL_FONTS.serifDisplay,
      fontWeight: 600,
      fontSize: '0.875rem',
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
          backgroundColor: EDITORIAL_COLORS.bgPrimary,
        },
        body: {
          backgroundColor: EDITORIAL_COLORS.bgPrimary,
          backgroundImage: `radial-gradient(circle, ${EDITORIAL_COLORS.border} 1.4px, transparent 1.5px)`,
          backgroundSize: '14px 14px',
          color: EDITORIAL_COLORS.textPrimary,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          overflowX: 'clip',
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
          boxShadow: NEOBRUTAL_SHADOWS.sm,
          padding: '10px 18px',
          transition:
            'transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease, color 120ms ease',
          '&:hover': {
            transform: 'translate(1px, 1px)',
            boxShadow: NEOBRUTAL_SHADOWS.smHover,
          },
          '&:focus-visible': {
            outline: `2px solid ${EDITORIAL_COLORS.navyPrimary}`,
            outlineOffset: '2px',
          },
        },
        outlined: {
          borderWidth: '2px',
          borderColor: EDITORIAL_COLORS.textPrimary,
          color: EDITORIAL_COLORS.textPrimary,
          backgroundColor: EDITORIAL_COLORS.bgSecondary,
          '&:hover': {
            borderWidth: '2px',
            borderColor: EDITORIAL_COLORS.textPrimary,
            color: EDITORIAL_COLORS.bgPrimary,
            backgroundColor: EDITORIAL_COLORS.navyPrimary,
          },
        },
        contained: {
          backgroundColor: EDITORIAL_COLORS.navyPrimary,
          color: EDITORIAL_COLORS.bgPrimary,
          border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
          '&:hover': {
            backgroundColor: EDITORIAL_COLORS.navySecondary,
            borderColor: EDITORIAL_COLORS.textPrimary,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: EDITORIAL_COLORS.border,
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
      styleOverrides: {
        root: {
          color: EDITORIAL_COLORS.navyPrimary,
          textUnderlineOffset: '3px',
          textDecorationThickness: '1px',
          transition: 'color 120ms ease',
          '&:hover': {
            color: EDITORIAL_COLORS.navySecondary,
          },
          '&:focus-visible': {
            outline: `2px solid ${EDITORIAL_COLORS.navyPrimary}`,
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: EDITORIAL_COLORS.bgSecondary,
        },
      },
    },
  },
});
