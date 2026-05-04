import React, { useEffect } from 'react';
import { useMusic } from '../contexts/MusicContext';

interface YouTubeEmbedProps {
  videoId: string;
  isPlaying: boolean;
  volume: number;
  onDurationReady?: (duration: number) => void;
}

/**
 * YouTube Embed Player Component
 * Renders an embedded YouTube player with control integration
 * Note: This is hidden off-screen as we control it via YouTube IFrame API
 */
export default function YouTubeEmbed({
  videoId,
  isPlaying,
  volume,
  onDurationReady,
}: YouTubeEmbedProps) {
  const { playerRef } = useMusic();

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Initialize player when API is ready
    const initPlayer = () => {
      if (window.YT && window.YT.Player && videoId) {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '0',
          width: '0',
          videoId: videoId,
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
        });
      }
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      // Cleanup
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, playerRef]);

  // Update playing state
  useEffect(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying, playerRef]);

  // Update volume
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume, playerRef]);

  const onPlayerReady = (event: any) => {
    event.target.setVolume(volume);
    if (onDurationReady && playerRef.current) {
      const duration = playerRef.current.getDuration();
      if (duration > 0) {
        onDurationReady(duration);
      }
    }
  };

  const onPlayerStateChange = (event: any) => {
    // Handle state changes if needed
    // -1: unstarted
    // 0: ended
    // 1: playing
    // 2: paused
    // 3: buffering
    // 5: cued
  };

  return (
    <>
      <div id="youtube-player" style={{ display: 'none' }} />
      <script>
        {`
          if (!window.YT) {
            window.YT = {};
          }
        `}
      </script>
    </>
  );
}

// Extend Window interface to include YT
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}
