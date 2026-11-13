import { Box, ButtonBase, Typography } from '@mui/material';
import React, { useId } from 'react';
import {
  EDITORIAL_COLORS,
  EDITORIAL_FONTS,
  NEOBRUTAL_SHADOWS,
} from '../../app/theme';

export interface FilterOption {
  name: string;
  count: number;
}

export interface ArticleFiltersProps {
  categories: FilterOption[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  tagSearch: string;
  onTagSearchChange: (search: string) => void;
  availableTags?: FilterOption[];
  filteredCount?: number;
}

export function ArticleFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  tagSearch,
  onTagSearchChange,
  availableTags = [],
  filteredCount = 0,
}: ArticleFiltersProps) {
  const searchInputId = useId();
  const normalizedCategory = selectedCategory?.toLowerCase().trim() ?? null;
  const cleanTagSearch = tagSearch.replace(/^#/, '').trim();
  const hasActiveFilters = Boolean(normalizedCategory || cleanTagSearch);

  const handleClearAll = () => {
    onSelectCategory(null);
    onTagSearchChange('');
  };

  return (
    <Box
      component="nav"
      aria-label="Filtro de artigos por categoria e busca por tag"
      sx={{
        mb: 3.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {/* Container lado a lado com espaçamento generoso: Busca por Tag (esquerda) e Categorias alinhado ao fim (direita) */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: { xs: 3, md: 5, lg: 7 },
        }}
      >
        {/* 1. CAMPO DE BUSCA POR TAG (ESQUERDA) */}
        <Box
          sx={{
            flex: { xs: '1 1 auto', md: '1 1 50%' },
            maxWidth: { xs: '100%', md: '460px', lg: '500px' },
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              minHeight: '24px',
              gap: 1,
            }}
          >
            <Typography
              component="label"
              htmlFor={searchInputId}
              sx={{
                fontFamily: EDITORIAL_FONTS.mono,
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: EDITORIAL_COLORS.navyPrimary,
              }}
            >
              Buscar por tag
            </Typography>

            {cleanTagSearch && (
              <ButtonBase
                onClick={() => onTagSearchChange('')}
                aria-label="Limpar busca por tag"
                sx={{
                  px: 1,
                  py: 0.25,
                  fontFamily: EDITORIAL_FONTS.mono,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: EDITORIAL_COLORS.navyPrimary,
                  backgroundColor: EDITORIAL_COLORS.bgPrimary,
                  border: `1.5px solid ${EDITORIAL_COLORS.textPrimary}`,
                  boxShadow: '1.5px 1.5px 0 0 #000000',
                  '&:hover': {
                    backgroundColor: EDITORIAL_COLORS.navySoft,
                  },
                }}
              >
                ✕ Limpar busca
              </ButtonBase>
            )}
          </Box>

          {/* Input neobrutalista de busca */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              backgroundColor: EDITORIAL_COLORS.bgPrimary,
              border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
              boxShadow: NEOBRUTAL_SHADOWS.sm,
              transition: 'box-shadow 120ms ease, transform 120ms ease',
              '&:focus-within': {
                boxShadow: NEOBRUTAL_SHADOWS.md,
                borderColor: EDITORIAL_COLORS.navyPrimary,
              },
            }}
          >
            <Box
              component="span"
              aria-hidden="true"
              sx={{
                px: 1.5,
                py: 0.8,
                fontFamily: EDITORIAL_FONTS.mono,
                fontSize: '1rem',
                fontWeight: 700,
                color: EDITORIAL_COLORS.navyPrimary,
                backgroundColor: EDITORIAL_COLORS.navySoft,
                borderRight: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
                userSelect: 'none',
              }}
            >
              #
            </Box>

            <Box
              component="input"
              id={searchInputId}
              type="search"
              value={tagSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onTagSearchChange(e.target.value)
              }
              placeholder="digite uma tag (ex: tipografia, web)..."
              aria-label="Buscar posts por tag"
              sx={{
                flex: 1,
                width: '100%',
                px: 1.5,
                py: 0.8,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontFamily: EDITORIAL_FONTS.mono,
                fontSize: { xs: '0.84rem', sm: '0.88rem' },
                color: EDITORIAL_COLORS.textPrimary,
                '&::placeholder': {
                  color: EDITORIAL_COLORS.textSecondary,
                  opacity: 0.8,
                },
              }}
            />

            {tagSearch && (
              <ButtonBase
                onClick={() => onTagSearchChange('')}
                aria-label="Limpar campo de busca por tag"
                sx={{
                  px: 1.5,
                  py: 0.8,
                  fontFamily: EDITORIAL_FONTS.mono,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: EDITORIAL_COLORS.textSecondary,
                  '&:hover': {
                    color: EDITORIAL_COLORS.textPrimary,
                  },
                }}
              >
                ✕
              </ButtonBase>
            )}
          </Box>

          {/* Sugestões de tags populares / disponíveis */}
          {availableTags.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 0.8,
                mt: 0.25,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: EDITORIAL_FONTS.mono,
                  fontSize: '0.7rem',
                  color: EDITORIAL_COLORS.textSecondary,
                  mr: 0.5,
                }}
              >
                Tags sugeridas:
              </Typography>

              {availableTags.slice(0, 8).map((t) => {
                const isActive = cleanTagSearch.toLowerCase() === t.name.toLowerCase();

                return (
                  <ButtonBase
                    key={t.name}
                    onClick={() =>
                      onTagSearchChange(isActive ? '' : t.name)
                    }
                    aria-label={`Filtrar por #${t.name}`}
                    sx={{
                      px: '0.55rem',
                      py: '0.15rem',
                      fontFamily: EDITORIAL_FONTS.mono,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: `1px solid ${
                        isActive
                          ? EDITORIAL_COLORS.textPrimary
                          : EDITORIAL_COLORS.navyPrimary
                      }`,
                      backgroundColor: isActive
                        ? EDITORIAL_COLORS.navyPrimary
                        : EDITORIAL_COLORS.navySoft,
                      color: isActive
                        ? EDITORIAL_COLORS.bgPrimary
                        : EDITORIAL_COLORS.navyPrimary,
                      boxShadow: isActive ? 'none' : '1.5px 1.5px 0 0 #000000',
                      transform: isActive ? 'translate(1px, 1px)' : 'none',
                      '&:hover': {
                        backgroundColor: isActive
                          ? EDITORIAL_COLORS.navySecondary
                          : EDITORIAL_COLORS.bgPrimary,
                      },
                    }}
                  >
                    #{t.name}
                  </ButtonBase>
                );
              })}
            </Box>
          )}
        </Box>

        {/* 2. SEÇÃO DE FILTRAGEM POR CATEGORIA (DIREITA - ALINHADO AO FIM) */}
        {categories.length > 0 && (
          <Box
            sx={{
              flex: { xs: '1 1 auto', md: '1 1 auto' },
              width: { xs: '100%', md: 'auto' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: { xs: 'space-between', md: 'flex-end' },
                width: '100%',
                flexWrap: 'wrap',
                minHeight: '24px',
                gap: 1.5,
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
                Categorias
              </Typography>

              {normalizedCategory && (
                <ButtonBase
                  onClick={() => onSelectCategory(null)}
                  aria-label="Limpar filtro de categoria"
                  sx={{
                    px: 1,
                    py: 0.25,
                    fontFamily: EDITORIAL_FONTS.mono,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: EDITORIAL_COLORS.navyPrimary,
                    backgroundColor: EDITORIAL_COLORS.bgPrimary,
                    border: `1.5px solid ${EDITORIAL_COLORS.textPrimary}`,
                    boxShadow: '1.5px 1.5px 0 0 #000000',
                    '&:hover': {
                      backgroundColor: EDITORIAL_COLORS.navySoft,
                    },
                  }}
                >
                  ✕ Limpar categoria
                </ButtonBase>
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                gap: 1,
              }}
            >
              {/* Botão "Todas" as categorias */}
              <ButtonBase
                onClick={() => onSelectCategory(null)}
                aria-pressed={!normalizedCategory}
                sx={{
                  px: '0.85rem',
                  py: '0.35rem',
                  fontFamily: EDITORIAL_FONTS.mono,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
                  backgroundColor: !normalizedCategory
                    ? EDITORIAL_COLORS.navyPrimary
                    : EDITORIAL_COLORS.bgPrimary,
                  color: !normalizedCategory
                    ? EDITORIAL_COLORS.bgPrimary
                    : EDITORIAL_COLORS.textPrimary,
                  boxShadow: !normalizedCategory
                    ? '1px 1px 0 0 #000000'
                    : NEOBRUTAL_SHADOWS.sm,
                  transform: !normalizedCategory ? 'translate(1px, 1px)' : 'none',
                  transition:
                    'transform 100ms ease, box-shadow 100ms ease, background-color 100ms ease',
                  '&:hover': {
                    transform: 'translate(1px, 1px)',
                    boxShadow: '1px 1px 0 0 #000000',
                    backgroundColor: !normalizedCategory
                      ? EDITORIAL_COLORS.navyPrimary
                      : EDITORIAL_COLORS.navySoft,
                  },
                }}
              >
                Todas
              </ButtonBase>

              {/* Pílulas de cada categoria */}
              {categories.map((cat) => {
                const isSelected = normalizedCategory === cat.name.toLowerCase().trim();

                return (
                  <ButtonBase
                    key={cat.name}
                    onClick={() => onSelectCategory(isSelected ? null : cat.name)}
                    aria-pressed={isSelected}
                    aria-label={`Filtrar pela categoria ${cat.name} (${cat.count} ${
                      cat.count === 1 ? 'artigo' : 'artigos'
                    })`}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.65,
                      px: '0.85rem',
                      py: '0.35rem',
                      fontFamily: EDITORIAL_FONTS.mono,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: `2px solid ${EDITORIAL_COLORS.textPrimary}`,
                      backgroundColor: isSelected
                        ? EDITORIAL_COLORS.navyPrimary
                        : EDITORIAL_COLORS.bgPrimary,
                      color: isSelected
                        ? EDITORIAL_COLORS.bgPrimary
                        : EDITORIAL_COLORS.navyPrimary,
                      boxShadow: isSelected
                        ? '1px 1px 0 0 #000000'
                        : NEOBRUTAL_SHADOWS.sm,
                      transform: isSelected ? 'translate(1px, 1px)' : 'none',
                      transition:
                        'transform 100ms ease, box-shadow 100ms ease, background-color 100ms ease',
                      '&:hover': {
                        transform: 'translate(1px, 1px)',
                        boxShadow: '1px 1px 0 0 #000000',
                        backgroundColor: isSelected
                          ? EDITORIAL_COLORS.navySecondary
                          : EDITORIAL_COLORS.navySoft,
                      },
                    }}
                  >
                    <span>{cat.name}</span>
                    {cat.count > 0 && (
                      <Box
                        component="span"
                        sx={{
                          px: 0.5,
                          py: 0.05,
                          fontSize: '0.68rem',
                          backgroundColor: isSelected
                            ? EDITORIAL_COLORS.navySecondary
                            : EDITORIAL_COLORS.navySoft,
                          color: isSelected
                            ? EDITORIAL_COLORS.bgPrimary
                            : EDITORIAL_COLORS.navyPrimary,
                          border: `1px solid ${
                            isSelected
                              ? EDITORIAL_COLORS.navySoft
                              : EDITORIAL_COLORS.navyPrimary
                          }`,
                        }}
                      >
                        {cat.count}
                      </Box>
                    )}
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      {/* 3. FAIXA DE STATUS QUANDO HOUVER FILTRO ATIVO */}
      {hasActiveFilters && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            px: 1.5,
            py: 0.85,
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
            Exibindo <strong>{filteredCount}</strong>{' '}
            {filteredCount === 1 ? 'artigo' : 'artigos'}
            {selectedCategory && (
              <>
                {' '}
                na categoria <strong>&ldquo;{selectedCategory}&rdquo;</strong>
              </>
            )}
            {cleanTagSearch && (
              <>
                {' '}
                com a tag <strong>#{cleanTagSearch}</strong>
              </>
            )}
          </Typography>

          <ButtonBase
            onClick={handleClearAll}
            sx={{
              fontFamily: EDITORIAL_FONTS.mono,
              fontSize: '0.74rem',
              fontWeight: 700,
              textDecoration: 'underline',
              color: EDITORIAL_COLORS.navyPrimary,
              '&:hover': {
                color: EDITORIAL_COLORS.textPrimary,
              },
            }}
          >
            ✕ Limpar todos os filtros
          </ButtonBase>
        </Box>
      )}
    </Box>
  );
}

