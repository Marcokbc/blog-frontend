import { Box, Skeleton } from '@mui/material';
import { EDITORIAL_COLORS, NEOBRUTAL_SHADOWS } from '../../app/theme';

interface LoadingStateProps {
  variant?: 'list' | 'article';
  rows?: number;
}

export function LoadingState({ variant = 'list', rows = 3 }: LoadingStateProps) {
  if (variant === 'article') {
    return (
      <Box aria-busy="true" aria-label="Carregando artigo">
        <Box sx={{ maxWidth: '860px', mx: 'auto', pt: { xs: 3.5, sm: 5 } }}>
          <Skeleton variant="rectangular" width={160} height={36} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" width={220} height={18} sx={{ mb: 1.5 }} />
          <Skeleton variant="rectangular" width="85%" height={52} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="65%" height={24} sx={{ mb: 3 }} />
          <Box
            sx={{
              borderBottom: `4px solid ${EDITORIAL_COLORS.textPrimary}`,
              pb: 3,
              mb: 4,
            }}
          >
            <Skeleton variant="rectangular" width="100%" height={320} />
          </Box>
        </Box>

        <Box sx={{ maxWidth: '860px', mx: 'auto', pb: 8 }}>
          <Skeleton variant="rectangular" width="100%" height={20} sx={{ mb: 1.5 }} />
          <Skeleton variant="rectangular" width="96%" height={20} sx={{ mb: 1.5 }} />
          <Skeleton variant="rectangular" width="92%" height={20} sx={{ mb: 4 }} />
          <Skeleton variant="rectangular" width="100%" height={20} sx={{ mb: 1.5 }} />
          <Skeleton variant="rectangular" width="84%" height={20} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      aria-busy="true"
      aria-label="Carregando artigos"
      sx={{
        display: 'grid',
        gap: { xs: 3, sm: 4 },
      }}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <Box
          key={index}
          sx={{
            p: { xs: 2.5, sm: 3.25 },
            border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
            backgroundColor: EDITORIAL_COLORS.bgSecondary,
            boxShadow: NEOBRUTAL_SHADOWS.lg,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 270px' },
            gap: { xs: 2, md: 3.5 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Skeleton variant="rectangular" width="72%" height={34} sx={{ mb: 1.5 }} />
            <Skeleton variant="rectangular" width={260} height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="90%" height={18} />
          </Box>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={145}
            sx={{ display: { xs: 'none', md: 'block' } }}
          />
        </Box>
      ))}
    </Box>
  );
}
