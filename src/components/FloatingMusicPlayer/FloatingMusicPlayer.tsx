import { useEffect, useId, useRef, useState } from 'react';
import { blogConfig } from '../../config/blog.config';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          width?: string | number;
          height?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: any }) => void;
            onStateChange?: (event: { data: number; target: any }) => void;
            onError?: (event: { data: number }) => void;
          };
        },
      ) => any;
      PlayerState?: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface FloatingMusicPlayerProps {
  /** ID da playlist do YouTube (opcional, fallback para blogConfig) */
  playlistId?: string;
  /** Iniciar expandido por padrão no desktop (padrão: true) */
  defaultExpandedDesktop?: boolean;
}

function loadYouTubeScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();

    if (window.YT && window.YT.Player) {
      return resolve();
    }

    const scriptId = 'youtube-iframe-api-script';
    let tag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!tag) {
      tag = document.createElement('script');
      tag.id = scriptId;
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') {
        try {
          prevCallback();
        } catch {
          // ignore
        }
      }
      resolve();
    };

    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      resolve();
    }, 10000);
  });
}

/**
 * Renderiza uma barra de volume no estilo ASCII brutalista.
 * Exemplo com volume 60%: [||||||····] 60%
 */
export function formatAsciiVolume(volume: number, isMuted: boolean): string {
  if (isMuted || volume === 0) {
    return '[··········] MUTED';
  }
  const clamped = Math.max(0, Math.min(100, Math.round(volume)));
  const filledBars = Math.min(10, Math.max(0, Math.round(clamped / 10)));
  const emptyBars = 10 - filledBars;
  const bar = '|'.repeat(filledBars) + '·'.repeat(emptyBars);
  return `[${bar}] ${clamped.toString().padStart(2, '0')}%`;
}

export function FloatingMusicPlayer({
  playlistId = blogConfig.youtubePlaylistId,
  defaultExpandedDesktop = true,
}: FloatingMusicPlayerProps) {
  const containerUid = useId().replace(/:/g, '');
  const playerIframeContainerId = `yt-player-${containerUid}`;

  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolumeState] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [trackTitle, setTrackTitle] = useState<string>('Carregando playlist...');
  const [trackIndex, setTrackIndex] = useState<number>(1);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // No mobile, inicia estritamente colapsado para não atrapalhar leitura
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 ? defaultExpandedDesktop : false;
  });

  // Atualiza estado de acordo com redimensionamento de janela
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      // Apenas garante que permaneça utilizável se a janela mudar
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Inicialização do YouTube IFrame Player
  useEffect(() => {
    let isMounted = true;

    loadYouTubeScript().then(() => {
      if (!isMounted || !window.YT || !window.YT.Player) return;

      try {
        const cleanPlaylist = playlistId.trim();

        const player = new window.YT.Player(playerIframeContainerId, {
          width: '100%',
          height: '100%',
          playerVars: {
            listType: 'playlist',
            list: cleanPlaylist,
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: { target: any }) => {
              if (!isMounted) return;
              setIsReady(true);
              setPlayerError(null);
              playerRef.current = event.target;
              try {
                event.target.setVolume(volume);
                const data = event.target.getVideoData?.();
                if (data?.title) {
                  setTrackTitle(data.title);
                } else {
                  setTrackTitle('Playlist pronta');
                }
              } catch {
                setTrackTitle('Playlist pronta');
              }
            },
            onStateChange: (event: { data: number; target: any }) => {
              if (!isMounted) return;
              // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING, 5 = CUED
              if (event.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
              } else if (event.data === 2) {
                setIsPlaying(false);
                setIsBuffering(false);
              } else if (event.data === 3) {
                setIsBuffering(true);
              } else if (event.data === 0) {
                setIsPlaying(false);
                setIsBuffering(false);
              } else if (event.data === 5) {
                setIsPlaying(false);
                setIsBuffering(false);
              }

              try {
                const data = event.target.getVideoData?.();
                if (data?.title) {
                  setTrackTitle(data.title);
                }
                const idx = event.target.getPlaylistIndex?.();
                if (typeof idx === 'number' && idx >= 0) {
                  setTrackIndex(idx + 1);
                }
              } catch {
                // ignore
              }
            },
            onError: (err: { data: number }) => {
              if (!isMounted) return;
              console.warn('YouTube Player error code:', err.data);
              setPlayerError('Vídeo/Playlist indisponível no momento');
            },
          },
        });
        playerRef.current = player;
      } catch (err) {
        console.error('Falha ao inicializar o YouTube Player:', err);
      }
    });

    return () => {
      isMounted = false;
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch {
        // ignore
      }
    };
  }, [playerIframeContainerId, playlistId]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (err) {
      console.warn('Erro ao alternar reprodução:', err);
    }
  };

  const handleNext = () => {
    if (!playerRef.current) return;
    try {
      playerRef.current.nextVideo();
    } catch (err) {
      console.warn('Erro ao avançar faixa:', err);
    }
  };

  const handlePrev = () => {
    if (!playerRef.current) return;
    try {
      playerRef.current.previousVideo();
    } catch (err) {
      console.warn('Erro ao retornar faixa:', err);
    }
  };

  const adjustVolume = (delta: number) => {
    const nextVol = Math.max(0, Math.min(100, volume + delta));
    setVolumeState(nextVol);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(nextVol);
        if (nextVol > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {
        // ignore
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch {
      // ignore
    }
  };

  return (
    <aside
      aria-label="Player de áudio e vídeo vintage"
      className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-50 select-none font-mono"
    >
      {/* 1. BOTÃO/PÍLULA MINIMALISTA (EXIBIDA QUANDO COLAPSADO) */}
      {!isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-label="Expandir player de música"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#14213D] text-white border-2 border-black shadow-[2px_2px_0_0_#000000] text-xs font-bold font-mono tracking-wider transition-transform active:translate-x-0.5 active:translate-y-0.5 hover:bg-[#23395B]"
        >
          <span
            className={`inline-block w-2 h-2 border border-black ${
              isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'
            }`}
          />
          <span>{isPlaying ? '[▶] ÁUDIO' : '[+] ÁUDIO'}</span>
          {isPlaying && (
            <span className="max-w-[120px] truncate opacity-80 text-[10px] hidden sm:inline">
              #{trackIndex} {trackTitle}
            </span>
          )}
        </button>
      )}

      {/* 2. CONTAINER COMPLETO DO PLAYER (BRUTALISTA COM MONITOR VINTAGE) */}
      <div
        style={{ display: isExpanded ? 'flex' : 'none' }}
        className="w-[268px] sm:w-[280px] bg-white border-2 border-black shadow-[4px_4px_0_0_#000000] p-2.5 flex-col gap-2"
      >
        {/* Cabeçalho superior neobrutalista */}
        <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block w-2.5 h-2.5 border border-black ${
                isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-[11px] font-bold tracking-widest text-[#14213D] uppercase">
              CRT-AUDIO // FEED
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Minimizar player para pílula"
              className="px-1.5 py-0.5 text-[11px] font-bold bg-[#E8EDF5] hover:bg-[#14213D] hover:text-white border border-black shadow-[1px_1px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-colors"
              title="Minimizar"
            >
              [—]
            </button>
          </div>
        </div>

        {/* MONITOR VINTAGE (ENQUADRAMENTO OBRIGATÓRIO ESTÁTICO >= 200x200px CONFORME REQUISITO E TERMOS DO YOUTUBE) */}
        <div className="border-2 border-black bg-black p-1 shadow-[2px_2px_0_0_#000000]">
          {/* Tarja técnica do monitor CRT */}
          <div className="flex items-center justify-between px-1.5 py-0.5 bg-neutral-900 border-b border-neutral-800 text-[9px] font-mono text-neutral-400 mb-1">
            <span className="tracking-widest">MON-240x200</span>
            <span className="text-emerald-400 font-bold">
              {isPlaying ? 'REC ● LIVE' : isBuffering ? 'BUFFERING' : 'STANDBY'}
            </span>
          </div>

          {/* Área do iframe visível do YouTube (tamanho mínimo estrito ~200x200px) */}
          <div className="relative w-[240px] h-[200px] mx-auto bg-black overflow-hidden flex items-center justify-center">
            <div
              id={playerIframeContainerId}
              className="w-full h-full min-w-[200px] min-h-[200px]"
            />
            {!isReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 text-xs p-3 text-center">
                <span className="animate-pulse font-bold text-neutral-200">
                  INICIALIZANDO FEED...
                </span>
                <span className="text-[10px] text-neutral-500 mt-1">
                  YouTube IFrame API
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informações da faixa atual */}
        <div className="px-2 py-1 bg-[#F5F5F5] border border-black shadow-[1px_1px_0_0_#000000] text-[11px] leading-tight">
          <div className="flex items-center justify-between text-[10px] text-neutral-500 font-bold mb-0.5">
            <span>TRACK #{trackIndex}</span>
            <span>{isReady ? 'SYNC OK' : 'CONNECTING'}</span>
          </div>
          <div
            className="font-bold text-[#14213D] truncate"
            title={trackTitle}
          >
            {trackTitle}
          </div>
          {playerError && (
            <div className="text-[10px] text-red-600 font-bold mt-0.5">
              {playerError}
            </div>
          )}
        </div>

        {/* Barra de volume em formato ASCII */}
        <div className="flex items-center justify-between gap-1 text-[11px] bg-white border border-black px-1.5 py-1 shadow-[1px_1px_0_0_#000000]">
          <span className="font-bold text-[#14213D] text-[10px] whitespace-nowrap">
            {formatAsciiVolume(volume, isMuted)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustVolume(-10)}
              aria-label="Diminuir volume"
              disabled={volume <= 0}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E8EDF5] hover:bg-[#14213D] hover:text-white border border-black shadow-[1px_1px_0_0_#000000] disabled:opacity-40"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => adjustVolume(10)}
              aria-label="Aumentar volume"
              disabled={volume >= 100}
              className="px-1.5 py-0.5 text-[10px] font-bold bg-[#E8EDF5] hover:bg-[#14213D] hover:text-white border border-black shadow-[1px_1px_0_0_#000000] disabled:opacity-40"
            >
              +
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Ativar som' : 'Silenciar som'}
              className={`px-1.5 py-0.5 text-[10px] font-bold border border-black shadow-[1px_1px_0_0_#000000] ${
                isMuted
                  ? 'bg-red-500 text-white'
                  : 'bg-[#E8EDF5] hover:bg-[#14213D] hover:text-white'
              }`}
            >
              {isMuted ? 'UNMUT' : 'MUTE'}
            </button>
          </div>
        </div>

        {/* Controles customizados de reprodução React */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Faixa anterior"
            className="flex items-center justify-center py-1 bg-white hover:bg-[#E8EDF5] border border-black shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 text-xs font-bold text-black"
          >
            [⏮ PREV]
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
            className="flex items-center justify-center py-1 bg-[#14213D] hover:bg-[#23395B] text-white border border-black shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 text-xs font-bold"
          >
            {isPlaying ? '[❚❚ PAUSE]' : '[▶ PLAY]'}
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Próxima faixa"
            className="flex items-center justify-center py-1 bg-white hover:bg-[#E8EDF5] border border-black shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 text-xs font-bold text-black"
          >
            [NEXT ⏭]
          </button>
        </div>
      </div>
    </aside>
  );
}
