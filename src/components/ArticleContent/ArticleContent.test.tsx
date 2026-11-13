import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { brutalistTheme } from '../../app/theme';
import { ArticleContent } from './ArticleContent';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={brutalistTheme}>{ui}</ThemeProvider>
    </MemoryRouter>,
  );
}

describe('ArticleContent', () => {
  it('sanitiza HTML malicioso e renderiza elementos editoriais seguros', () => {
    const html = [
      '<h2>Seção Editorial</h2>',
      '<p>Parágrafo com <strong>negrito</strong>, <em>itálico</em> e <code>código</code>.</p>',
      '<script>window.__xss = true;</script>',
      '<p><a href="javascript:alert(1)">Link perigoso</a></p>',
      '<blockquote><p>Citação relevante.</p></blockquote>',
      '<figure><img src="/uploads/foto.jpg" alt="Arquitetura" /><figcaption>Legenda da foto</figcaption></figure>',
      '<table><thead><tr><th>Coluna</th></tr></thead><tbody><tr><td>Dado</td></tr></tbody></table>',
    ].join('');

    const { container } = renderWithProviders(
      <ArticleContent content={html} format="html" />,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Seção Editorial' })).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    const img = screen.getByRole('img', { name: 'Arquitetura' });
    expect(img).toHaveAttribute('src', 'https://api.draftin.io/uploads/foto.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('Legenda da foto')).toBeInTheDocument();
    expect(container.querySelector('.editorial-table-scroll table')).toBeInTheDocument();
  });

  it('renderiza Markdown completo com GFM, imagens com legenda e sanitização', () => {
    const markdown = [
      '### Subseção em Markdown',
      '',
      'Texto com [link externo](https://example.com) e `inline`.',
      '',
      '![Diagrama](https://cdn.example.com/diagram.png "Legenda automática")',
      '',
      '| Item | Estado |',
      '| --- | --- |',
      '| API | Ativa |',
      '',
      '<script>alert(1)</script>',
    ].join('\n');

    const { container } = renderWithProviders(
      <ArticleContent content={markdown} format="markdown" />,
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Subseção em Markdown' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'link externo' });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('Legenda automática')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });
});

