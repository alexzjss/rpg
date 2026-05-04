import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail?: string;
}

export interface MusicContextType {
  isPlaying: boolean;
  currentTrack: Track | null;
  playlist: Track[];
  currentIndex: number;
  volume: number;
  isPlayerVisible: boolean;
  currentTime: number;
  
  // Player controls
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (time: number) => void;
  setCurrentTime: (time: number) => void;
  
  // Playlist management
  addToPlaylist: (track: Track) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  setPlaylist: (tracks: Track[]) => void;
  playTrackAtIndex: (index: number) => void;
  
  // UI controls
  setPlayerVisible: (visible: boolean) => void;
  
  // YouTube player ref
  playerRef: React.MutableRefObject<any>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = React.useRef<any>(null);

  const currentTrack = playlist[currentIndex] || null;

  const play = useCallback(() => {
    setIsPlaying(true);
    if (playerRef.current?.playVideo) {
      playerRef.current.playVideo();
    }
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const nextTrack = useCallback(() => {
    if (playlist.length > 0) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      setCurrentIndex(nextIndex);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [playlist.length, currentIndex]);

  const previousTrack = useCallback(() => {
    if (playlist.length > 0) {
      const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [playlist.length, currentIndex]);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(time);
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(time, true);
    }
  }, []);

  const addToPlaylist = useCallback((track: Track) => {
    setPlaylist(prev => [...prev, track]);
  }, []);

  const removeFromPlaylist = useCallback((index: number) => {
    setPlaylist(prev => prev.filter((_, i) => i !== index));
    if (index === currentIndex && playlist.length > 1) {
      setCurrentIndex(prev => Math.min(prev, playlist.length - 2));
    }
  }, [currentIndex, playlist.length]);

  const clearPlaylist = useCallback(() => {
    setPlaylist([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const playTrackAtIndex = useCallback((index: number) => {
    if (index >= 0 && index < playlist.length) {
      setCurrentIndex(index);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [playlist.length]);

  return (
    <MusicContext.Provider
      value={{
        isPlaying,
        currentTrack,
        playlist,
        currentIndex,
        volume,
        isPlayerVisible,
        currentTime,
        play,
        pause,
        togglePlayPause,
        setVolume,
        nextTrack,
        previousTrack,
        seekTo,
        setCurrentTime,
        addToPlaylist,
        removeFromPlaylist,
        clearPlaylist,
        setPlaylist,
        playTrackAtIndex,
        setPlayerVisible: setIsPlayerVisible,
        playerRef,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return context;
}
