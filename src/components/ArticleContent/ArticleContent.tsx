import { Box } from '@mui/material';
import DOMPurify from 'dompurify';
import parse, {
  type DOMNode,
  Element,
  domToReact,
  type HTMLReactParserOptions,
} from 'html-react-parser';
import { useMemo, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { Link as RouterLink } from 'react-router-dom';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { blogConfig } from '../../config/blog.config';
import type { ContentFormat } from '../../utils/content';
import { resolveAssetUrl } from '../../utils/content';
import { articleProseStyles } from './proseStyles';

interface ArticleContentProps {
  content: string;
  format: ContentFormat;
}

const ALLOWED_HTML_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'br',
  'hr',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'del',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'span',
  'div',
];

const ALLOWED_HTML_ATTR = [
  'href',
  'title',
  'target',
  'rel',
  'src',
  'alt',
  'width',
  'height',
  'loading',
  'decoding',
  'colspan',
  'rowspan',
  'align',
  'class',
];

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: Array.from(
    new Set([
      ...(defaultSchema.tagNames ?? []),
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'del',
    ]),
  ),
  attributes: {
    ...defaultSchema.attributes,
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    code: [['className', /^language-./]],
    th: ['align', 'colSpan', 'rowSpan'],
    td: ['align', 'colSpan', 'rowSpan'],
  },
};

function isExternalHref(href: string | undefined): boolean {
  if (!href) return false;
  return /^https?:\/\//i.test(href) || href.startsWith('//');
}

function isInternalAppRoute(href: string | undefined): boolean {
  if (!href) return false;
  return href.startsWith('/') && !href.startsWith('//');
}

function sanitizeHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (/^(javascript|vbscript|data):/i.test(trimmed)) return undefined;
  return trimmed;
}

function renderSafeImage(props: {
  src?: string;
  alt?: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  insideFigure?: boolean;
}) {
  const safeSrc = resolveAssetUrl(props.src, blogConfig.assetsBaseUrl);
  if (!safeSrc) return null;

  const imgElement = (
    <img
      src={safeSrc}
      alt={props.alt ?? ''}
      title={props.insideFigure ? props.title : undefined}
      width={props.width}
      height={props.height}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );

  if (props.insideFigure) {
    return imgElement;
  }

  return (
    <figure>
      {imgElement}
      {props.title && <figcaption>{props.title}</figcaption>}
    </figure>
  );
}

function SanitizedHtmlContent({ html }: { html: string }) {
  const rendered = useMemo(() => {
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ALLOWED_HTML_TAGS,
      ALLOWED_ATTR: ALLOWED_HTML_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    });

    const isInsideFigure = (domNode: Element): boolean => {
      let current = domNode.parent;
      while (current) {
        if (current instanceof Element && current.name === 'figure') {
          return true;
        }
        current = current.parent;
      }
      return false;
    };

    const options: HTMLReactParserOptions = {
      replace(domNode: DOMNode) {
        if (!(domNode instanceof Element)) return undefined;

        if (domNode.name === 'p') {
          const meaningfulChildren = domNode.children.filter(
            (child) =>
              !(child.type === 'text' && (!child.data || !child.data.trim())),
          );
          if (
            meaningfulChildren.length === 1 &&
            meaningfulChildren[0] instanceof Element &&
            meaningfulChildren[0].name === 'img'
          ) {
            const imgNode = meaningfulChildren[0];
            return renderSafeImage({
              src: imgNode.attribs.src,
              alt: imgNode.attribs.alt,
              title: imgNode.attribs.title,
              width: imgNode.attribs.width,
              height: imgNode.attribs.height,
              insideFigure: false,
            });
          }
        }

        if (domNode.name === 'img') {
          return renderSafeImage({
            src: domNode.attribs.src,
            alt: domNode.attribs.alt,
            title: domNode.attribs.title,
            width: domNode.attribs.width,
            height: domNode.attribs.height,
            insideFigure: isInsideFigure(domNode),
          });
        }

        if (domNode.name === 'table') {
          return (
            <div className="editorial-table-scroll">
              <table>{domToReact(domNode.children as DOMNode[], options)}</table>
            </div>
          );
        }

        if (domNode.name === 'a') {
          const href = sanitizeHref(domNode.attribs.href);
          const children = domToReact(domNode.children as DOMNode[], options);
          if (!href) {
            return <span>{children}</span>;
          }
          if (isInternalAppRoute(href)) {
            return <RouterLink to={href}>{children}</RouterLink>;
          }
          const external = isExternalHref(href);
          return (
            <a
              href={href}
              title={domNode.attribs.title}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          );
        }

        return undefined;
      },
    };

    return parse(cleanHtml, options);
  }, [html]);

  return <>{rendered}</>;
}

const markdownComponents: Components = {
  p({ node, children }) {
    const meaningfulChildren = (node?.children ?? []).filter(
      (child) => !(child.type === 'text' && !child.value.trim()),
    );
    const hasStandaloneImage =
      meaningfulChildren.length === 1 &&
      meaningfulChildren[0].type === 'element' &&
      meaningfulChildren[0].tagName === 'img';

    if (hasStandaloneImage) {
      return <>{children}</>;
    }
    return <p>{children}</p>;
  },
  img({ src, alt, title, width, height }) {
    return renderSafeImage({
      src,
      alt,
      title,
      width,
      height,
      insideFigure: false,
    });
  },
  table({ children }) {
    return (
      <div className="editorial-table-scroll">
        <table>{children}</table>
      </div>
    );
  },
  a({ href, title, children }) {
    const safeHref = sanitizeHref(href);
    if (!safeHref) return <span>{children}</span>;

    if (isInternalAppRoute(safeHref)) {
      return (
        <RouterLink to={safeHref} title={title}>
          {children as ReactNode}
        </RouterLink>
      );
    }

    const external = isExternalHref(safeHref);
    return (
      <a
        href={safeHref}
        title={title}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  },
};

export function ArticleContent({ content, format }: ArticleContentProps) {
  return (
    <Box
      sx={{
        maxWidth: '820px',
        mx: 'auto',
        pt: 0,
        pb: { xs: 5, sm: 7 },
        ...articleProseStyles,
      }}
    >
      {format === 'html' ? (
        <SanitizedHtmlContent html={content} />
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      )}
    </Box>
  );
}
