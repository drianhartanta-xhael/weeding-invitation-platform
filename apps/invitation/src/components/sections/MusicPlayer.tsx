'use client';

import { useState, useRef, useEffect } from 'react';

interface MusicPlayerProps {
  videoId?: string;
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
  url?: string;
  autoplay: boolean;
  shouldPlay: boolean;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

let apiLoadPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      resolve();
    };
    document.head.appendChild(tag);
  });
  return apiLoadPromise;
}

function YouTubeWidget({
  videoId,
  title,
  thumbnailUrl,
  autoplay,
  shouldPlay,
}: {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  autoplay: boolean;
  shouldPlay: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: videoId,
        },
        events: {
          onReady: () => {
            setIsReady(true);
          },
          onStateChange: (e) => {
            if (!window.YT) return;
            if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            else if (
              e.data === window.YT.PlayerState.PAUSED ||
              e.data === window.YT.PlayerState.ENDED
            )
              setIsPlaying(false);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    if (shouldPlay && autoplay) {
      try {
        playerRef.current.playVideo();
      } catch {
        // browser may block — pill remains tappable
      }
    }
  }, [isReady, shouldPlay, autoplay]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      >
        <div ref={containerRef} />
      </div>
      <button
        onClick={togglePlay}
        disabled={!isReady}
        className="fixed bottom-6 right-6 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full shadow-lg z-50 bg-wedding-accent text-white hover:opacity-90 transition-opacity disabled:opacity-60"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
          />
        ) : (
          <span className="w-10 h-10 rounded-full bg-white/20" />
        )}
        {title && (
          <span className="truncate max-w-[140px] text-xs font-medium">{title}</span>
        )}
        {isPlaying ? (
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </>
  );
}

function LegacyAudioWidget({
  url,
  autoplay,
  shouldPlay,
}: {
  url: string;
  autoplay: boolean;
  shouldPlay: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (shouldPlay && autoplay && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [shouldPlay, autoplay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <audio ref={audioRef} src={url} loop />
      <button
        onClick={togglePlay}
        className="fixed bottom-6 right-6 w-12 h-12 bg-wedding-accent text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:opacity-90 transition-opacity"
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </>
  );
}

export default function MusicPlayer({
  videoId,
  title,
  thumbnailUrl,
  url,
  autoplay,
  shouldPlay,
}: MusicPlayerProps) {
  if (videoId) {
    return (
      <YouTubeWidget
        videoId={videoId}
        title={title}
        thumbnailUrl={thumbnailUrl}
        autoplay={autoplay}
        shouldPlay={shouldPlay}
      />
    );
  }
  if (url) {
    return <LegacyAudioWidget url={url} autoplay={autoplay} shouldPlay={shouldPlay} />;
  }
  return null;
}
