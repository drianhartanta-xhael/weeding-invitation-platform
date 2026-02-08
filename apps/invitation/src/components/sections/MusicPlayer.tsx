'use client';

import { useState, useRef, useEffect } from 'react';

interface MusicPlayerProps {
  url: string;
  autoplay: boolean;
}

export default function MusicPlayer({ url, autoplay }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (autoplay && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [autoplay]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!url) return null;

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
