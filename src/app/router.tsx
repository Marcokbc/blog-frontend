import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { LoadingState } from '../components/LoadingState/LoadingState';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { Layout } from './Layout';

const ArticlePage = lazy(() =>
  import('../pages/ArticlePage').then((mod) => ({ default: mod.ArticlePage })),
);

function LegacyPostRedirect() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/" replace />;
  return <Navigate to={`/artigos/${encodeURIComponent(slug)}`} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'artigos/:slug',
        element: (
          <Suspense fallback={<LoadingState variant="article" />}>
            <ArticlePage />
          </Suspense>
        ),
      },
      {
        path: 'posts/:slug',
        element: <LegacyPostRedirect />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
