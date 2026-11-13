import { Box, ButtonBase, Typography } from '@mui/material';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';

export interface TagOption {
  name: string;
  count: number;
}

interface TagFilterProps {
  tags: TagOption[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  filteredCount?: number;
}

export function TagFilter({
  tags,
  selectedTag,
  onSelectTag,
  filteredCount,
}: TagFilterProps) {
  if (tags.length === 0) {
    return null;
  }

  const normalizedSelected = selectedTag?.toLowerCase().trim() ?? null;

  return (
    <Box
      component="nav"
      aria-label="Filtro de artigos por tag"
      sx={{
        mb: 3.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography
          variant="caption"
          component="span"
          sx={{
            fontFamily: EDITORIAL_FONTS.mono,
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: EDITORIAL_COLORS.navyPrimary,
          }}
        >
          Filtrar por tópico
        </Typography>

        {normalizedSelected && (
          <ButtonBase
            onClick={() => onSelectTag(null)}
            aria-label="Limpar filtro de tag e ver todos os artigos"
            sx={{
              px: 1.25,
              py: 0.35,
              fontFamily: EDITORIAL_FONTS.mono,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: EDITORIAL_COLORS.navyPrimary,
              backgroundColor: EDITORIAL_COLORS.bgPrimary,
              border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
              boxShadow: NEOBRUTAL_SHADOWS.sm,
              transition: 'transform 100ms ease, box-shadow 100ms ease, background-color 100ms ease',
              '&:hover': {
                transform: 'translate(1px, 1px)',
                boxShadow: '1px 1px 0 0 #000000',
                backgroundColor: EDITORIAL_COLORS.navySoft,
              },
            }}
          >
            ✕ Limpar filtro
          </ButtonBase>
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {/* Botão "Todas" */}
        <ButtonBase
          onClick={() => onSelectTag(null)}
          aria-pressed={!normalizedSelected}
          sx={{
            px: '0.75rem',
            py: '0.3rem',
            fontFamily: EDITORIAL_FONTS.mono,
            fontSize: '0.76rem',
            fontWeight: 700,
            border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
            backgroundColor: !normalizedSelected
              ? EDITORIAL_COLORS.navyPrimary
              : EDITORIAL_COLORS.bgPrimary,
            color: !normalizedSelected
              ? EDITORIAL_COLORS.bgPrimary
              : EDITORIAL_COLORS.textPrimary,
            boxShadow: !normalizedSelected ? '1px 1px 0 0 #000000' : NEOBRUTAL_SHADOWS.sm,
            transform: !normalizedSelected ? 'translate(1px, 1px)' : 'none',
            transition: 'transform 100ms ease, box-shadow 100ms ease, background-color 100ms ease',
            '&:hover': {
              transform: 'translate(1px, 1px)',
              boxShadow: '1px 1px 0 0 #000000',
              backgroundColor: !normalizedSelected
                ? EDITORIAL_COLORS.navyPrimary
                : EDITORIAL_COLORS.navySoft,
            },
          }}
        >
          Todas
        </ButtonBase>

        {/* Pílulas de cada tag */}
        {tags.map((tag) => {
          const isSelected = normalizedSelected === tag.name.toLowerCase().trim();

          return (
            <ButtonBase
              key={tag.name}
              onClick={() => onSelectTag(isSelected ? null : tag.name)}
              aria-pressed={isSelected}
              aria-label={`Filtrar por tag #${tag.name} (${tag.count} ${tag.count === 1 ? 'artigo' : 'artigos'})`}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.6,
                px: '0.75rem',
                py: '0.3rem',
                fontFamily: EDITORIAL_FONTS.mono,
                fontSize: '0.76rem',
                fontWeight: 700,
                border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
                backgroundColor: isSelected
                  ? EDITORIAL_COLORS.navyPrimary
                  : EDITORIAL_COLORS.navySoft,
                color: isSelected
                  ? EDITORIAL_COLORS.bgPrimary
                  : EDITORIAL_COLORS.navyPrimary,
                boxShadow: isSelected ? '1px 1px 0 0 #000000' : NEOBRUTAL_SHADOWS.sm,
                transform: isSelected ? 'translate(1px, 1px)' : 'none',
                transition:
                  'transform 100ms ease, box-shadow 100ms ease, background-color 100ms ease',
                '&:hover': {
                  transform: 'translate(1px, 1px)',
                  boxShadow: '1px 1px 0 0 #000000',
                  backgroundColor: isSelected
                    ? EDITORIAL_COLORS.navySecondary
                    : EDITORIAL_COLORS.bgPrimary,
                },
              }}
            >
              <span>#{tag.name}</span>
              {tag.count > 0 && (
                <Box
                  component="span"
                  sx={{
                    px: 0.5,
                    py: 0.05,
                    fontSize: '0.68rem',
                    borderRadius: 0,
                    backgroundColor: isSelected
                      ? EDITORIAL_COLORS.navySecondary
                      : EDITORIAL_COLORS.bgPrimary,
                    color: isSelected
                      ? EDITORIAL_COLORS.bgPrimary
                      : EDITORIAL_COLORS.navyPrimary,
                    border: `1px solid ${
                      isSelected ? EDITORIAL_COLORS.navySoft : EDITORIAL_COLORS.navyPrimary
                    }`,
                  }}
                >
                  {tag.count}
                </Box>
              )}
            </ButtonBase>
          );
        })}
      </Box>

      {/* Faixa de status do filtro ativo */}
      {normalizedSelected && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.5,
            py: 0.75,
            backgroundColor: EDITORIAL_COLORS.navySoft,
            border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
            boxShadow: NEOBRUTAL_SHADOWS.sm,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: EDITORIAL_FONTS.sans,
              fontSize: '0.84rem',
              color: EDITORIAL_COLORS.navyPrimary,
              fontWeight: 500,
            }}
          >
            Exibindo <strong>{filteredCount ?? 0}</strong>{' '}
            {filteredCount === 1 ? 'artigo' : 'artigos'} com a tag{' '}
            <strong>#{selectedTag}</strong>
          </Typography>

          <ButtonBase
            onClick={() => onSelectTag(null)}
            sx={{
              fontFamily: EDITORIAL_FONTS.mono,
              fontSize: '0.72rem',
              fontWeight: 700,
              textDecoration: 'underline',
              color: EDITORIAL_COLORS.navyPrimary,
              '&:hover': {
                color: EDITORIAL_COLORS.textPrimary,
              },
            }}
          >
            Ver todos
          </ButtonBase>
        </Box>
      )}
    </Box>
  );
}

