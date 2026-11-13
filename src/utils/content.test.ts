import { describe, expect, it } from 'vitest';
import {
  calculateReadingTimeMinutes,
  createExcerpt,
  detectContentFormat,
  extractFirstImageUrl,
  extractPlainText,
  resolveAssetUrl,
} from './content';

describe('utils/content', () => {
  it('detecta HTML quando o conteúdo inicia com tags de bloco', () => {
    expect(detectContentFormat('<p>Primeiro parágrafo</p><h2>Seção</h2>')).toBe('html');
  });

  it('detecta Markdown mesmo quando há blocos de código com exemplos HTML', () => {
    const markdown = [
      '# Título do ensaio',
      '',
      'Um parágrafo introdutório em Markdown.',
      '',
      '```html',
      '<p>Exemplo de código HTML</p>',
      '<div>Outro bloco</div>',
      '```',
    ].join('\n');

    expect(detectContentFormat(markdown)).toBe('markdown');
  });

  it('calcula tempo estimado de leitura corretamente', () => {
    const words = Array.from({ length: 450 }, () => 'palavra').join(' ');
    expect(calculateReadingTimeMinutes(`<p>${words}</p>`, 'html', 200)).toBe(3);
    expect(calculateReadingTimeMinutes('curto', 'markdown', 200)).toBe(1);
  });

  it('extrai texto limpo e cria resumo priorizando o subtítulo', () => {
    expect(createExcerpt('Subtítulo claro', '<p>Corpo longo</p>', 'html')).toBe(
      'Subtítulo claro',
    );
    expect(extractPlainText('<p>Olá <strong>mundo</strong> &amp; cia</p>', 'html')).toBe(
      'Olá mundo & cia',
    );
  });

  it('normaliza URLs de assets e bloqueia protocolos inseguros', () => {
    expect(resolveAssetUrl('https://cdn.example.com/foto.jpg')).toBe(
      'https://cdn.example.com/foto.jpg',
    );
    expect(resolveAssetUrl('/uploads/capa.webp', 'https://api.draftin.io')).toBe(
      'https://api.draftin.io/uploads/capa.webp',
    );
    expect(resolveAssetUrl('javascript:alert(1)')).toBeUndefined();
    expect(resolveAssetUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(
      resolveAssetUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'),
    ).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB');
  });

  it('extrai a primeira imagem do conteúdo HTML ou Markdown', () => {
    expect(
      extractFirstImageUrl(
        '<p>Texto</p><img src="/media/foto.jpg" alt="Capa" />',
        'html',
        'https://api.draftin.io',
      ),
    ).toBe('https://api.draftin.io/media/foto.jpg');

    expect(
      extractFirstImageUrl(
        '# Título\n\n![Legenda](https://img.example.com/a.png "Cap")',
        'markdown',
      ),
    ).toBe('https://img.example.com/a.png');
  });
});

