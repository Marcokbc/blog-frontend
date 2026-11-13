import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Footer } from '../components/Footer/Footer';
import { Header } from '../components/Header/Header';

export function Layout() {
  return (
    <Box
      id="top"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <a href="#main-content" className="skip-to-content">
        Pular para o conteúdo
      </a>

      <Header />

      <Container
        component="main"
        id="main-content"
        maxWidth={false}
        sx={{
          flex: 1,
          width: '100%',
          maxWidth: '1160px',
          mx: 'auto',
          px: { xs: 2, sm: 3.5 },
          pb: { xs: 6, sm: 8 },
        }}
      >
        <Outlet />
      </Container>

      <Footer />
    </Box>
  );
}

