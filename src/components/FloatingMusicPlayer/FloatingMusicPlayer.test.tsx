import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FloatingMusicPlayer, formatAsciiVolume } from './FloatingMusicPlayer';

describe('FloatingMusicPlayer (Player de Música Flutuante)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatAsciiVolume', () => {
    it('formata volume corretamente com barras e porcentagem', () => {
      expect(formatAsciiVolume(60, false)).toBe('[||||||····] 60%');
      expect(formatAsciiVolume(100, false)).toBe('[||||||||||] 100%');
      expect(formatAsciiVolume(30, false)).toBe('[|||·······] 30%');
    });

    it('retorna MUTED quando está silenciado ou em 0%', () => {
      expect(formatAsciiVolume(50, true)).toBe('[··········] MUTED');
      expect(formatAsciiVolume(0, false)).toBe('[··········] MUTED');
    });
  });

  describe('Comportamento de Renderização e Controles', () => {
    it('renderiza o monitor vintage e controles customizados no desktop', () => {
      render(<FloatingMusicPlayer defaultExpandedDesktop={true} playlistId="TEST_PLAYLIST" />);

      // Verifica elementos do monitor vintage
      expect(screen.getByText(/CRT-AUDIO \/\/ FEED/i)).toBeInTheDocument();
      expect(screen.getByText(/MON-240x200/i)).toBeInTheDocument();

      // Controles customizados React
      expect(screen.getByRole('button', { name: /Reproduzir áudio/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Próxima faixa/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Faixa anterior/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Aumentar volume/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Diminuir volume/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Silenciar som/i })).toBeInTheDocument();
    });

    it('permite colapsar para o formato de pílula discreta e reexpandir', () => {
      render(<FloatingMusicPlayer defaultExpandedDesktop={true} playlistId="TEST_PLAYLIST" />);

      // Inicialmente expandido
      expect(screen.getByText(/CRT-AUDIO \/\/ FEED/i)).toBeInTheDocument();

      // Clica no botão minimizar
      const minimizeBtn = screen.getByRole('button', { name: /Minimizar player para pílula/i });
      fireEvent.click(minimizeBtn);

      // Agora o botão pílula está visível
      const pillBtn = screen.getByRole('button', { name: /Expandir player de música/i });
      expect(pillBtn).toBeInTheDocument();
      expect(pillBtn).toHaveTextContent(/\[\+\] ÁUDIO/i);

      // Clica para reexpandir
      fireEvent.click(pillBtn);
      expect(screen.getByText(/CRT-AUDIO \/\/ FEED/i)).toBeInTheDocument();
    });

    it('inicia como pílula discreta quando configurado colapsado (padrão mobile)', () => {
      render(<FloatingMusicPlayer defaultExpandedDesktop={false} playlistId="TEST_PLAYLIST" />);

      const pillBtn = screen.getByRole('button', { name: /Expandir player de música/i });
      expect(pillBtn).toBeInTheDocument();
      expect(screen.queryByText(/CRT-AUDIO \/\/ FEED/i)).not.toBeVisible();
    });

    it('interage com os métodos do YouTube Player ao clicar nos controles', async () => {
      const mockPlay = vi.fn();
      const mockPause = vi.fn();
      const mockNext = vi.fn();
      const mockPrev = vi.fn();
      const mockSetVolume = vi.fn();
      const mockMute = vi.fn();
      const mockUnMute = vi.fn();

      const mockPlayerInstance = {
        playVideo: mockPlay,
        pauseVideo: mockPause,
        nextVideo: mockNext,
        previousVideo: mockPrev,
        setVolume: mockSetVolume,
        mute: mockMute,
        unMute: mockUnMute,
        getVideoData: () => ({ title: 'Lo-Fi Chill Beats', author: 'Lofi Girl' }),
        getPlaylistIndex: () => 0,
        destroy: vi.fn(),
      };

      // Simula window.YT disponível
      window.YT = {
        Player: vi.fn().mockImplementation((_element, config) => {
          config.events?.onReady?.({ target: mockPlayerInstance });
          return mockPlayerInstance;
        }),
      } as any;

      render(<FloatingMusicPlayer defaultExpandedDesktop={true} playlistId="TEST_PLAYLIST" />);

      // Aguarda o YouTube Player carregar e sinalizar status SYNC OK
      expect(await screen.findByText('SYNC OK')).toBeInTheDocument();

      // Clica em Play
      const playBtn = screen.getByRole('button', { name: /Reproduzir áudio/i });
      fireEvent.click(playBtn);
      expect(mockPlay).toHaveBeenCalled();

      // Clica em Next
      const nextBtn = screen.getByRole('button', { name: /Próxima faixa/i });
      fireEvent.click(nextBtn);
      expect(mockNext).toHaveBeenCalled();

      // Clica em Prev
      const prevBtn = screen.getByRole('button', { name: /Faixa anterior/i });
      fireEvent.click(prevBtn);
      expect(mockPrev).toHaveBeenCalled();

      // Clica em Volume +
      const volUpBtn = screen.getByRole('button', { name: /Aumentar volume/i });
      fireEvent.click(volUpBtn);
      expect(mockSetVolume).toHaveBeenCalledWith(80);

      // Clica em Mute
      const muteBtn = screen.getByRole('button', { name: /Silenciar som/i });
      fireEvent.click(muteBtn);
      expect(mockMute).toHaveBeenCalled();
    });
  });
});
