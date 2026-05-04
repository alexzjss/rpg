import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Music, Trash2, Plus } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

interface MusicPlayerProps {
  onAddTrack?: () => void;
}

export default function MusicPlayer({ onAddTrack }: MusicPlayerProps) {
  const {
    isPlaying,
    currentTrack,
    playlist,
    currentIndex,
    volume,
    isPlayerVisible,
    currentTime,
    togglePlayPause,
    setVolume,
    nextTrack,
    previousTrack,
    seekTo,
    setPlayerVisible,
    removeFromPlaylist,
    clearPlaylist,
  } = useMusic();

  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mostrar botão flutuante quando: player está oculto E não há músicas
  if (!isPlayerVisible && playlist.length === 0) {
    return (
      <button
        onClick={() => setPlayerVisible(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all z-50"
        title="Abrir player de música"
      >
        <Music size={24} />
      </button>
    );
  }

  // Não mostrar nada se: player está oculto OU playlist vazia
  if (!isPlayerVisible || playlist.length === 0) {
    return null;
  }

  // Mostrar player completo
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white border-t border-gray-700 shadow-2xl z-50">
          {/* Mini player com controles */}
          <div className="max-w-full px-4 py-3">
            {/* Informação da faixa atual */}
            {currentTrack && (
              <div className="mb-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
                  <p className="text-xs text-gray-400 truncate">{currentTrack.artist}</p>
                </div>
                <button
                  onClick={() => setPlayerVisible(false)}
                  className="ml-4 p-1 hover:bg-gray-800 rounded"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Progress bar */}
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-gray-400 w-8">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="flex-1 h-1 bg-gray-700 rounded appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                    duration ? (currentTime / duration) * 100 : 0
                  }%, #374151 ${duration ? (currentTime / duration) * 100 : 0}%, #374151 100%)`
                }}
              />
              <span className="text-xs text-gray-400 w-8 text-right">{formatTime(duration)}</span>
            </div>

            {/* Controles principais */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={previousTrack}
                  className="p-2 hover:bg-gray-800 rounded-full transition"
                  title="Anterior"
                >
                  <SkipBack size={20} />
                </button>

                <button
                  onClick={togglePlayPause}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition"
                  title={isPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                </button>

                <button
                  onClick={nextTrack}
                  className="p-2 hover:bg-gray-800 rounded-full transition"
                  title="Próxima"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Volume e controles */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Volume2 size={18} />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-24 h-1 bg-gray-700 rounded appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #374151 ${volume}%, #374151 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-400 w-6">{volume}</span>
                </div>

                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className="p-2 hover:bg-gray-800 rounded-full transition text-xs bg-gray-800"
                  title="Playlist"
                >
                  {playlist.length}
                </button>

                {onAddTrack && (
                  <button
                    onClick={onAddTrack}
                    className="p-2 hover:bg-gray-800 rounded-full transition"
                    title="Adicionar música"
                  >
                    <Plus size={20} />
                  </button>
                )}

                <button
                  onClick={clearPlaylist}
                  className="p-2 hover:bg-gray-800 rounded-full transition text-red-400 hover:text-red-300"
                  title="Limpar playlist"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Lista de reprodução */}
          {showPlaylist && (
            <div className="border-t border-gray-700 bg-gray-950 max-h-96 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold mb-3">Playlist ({playlist.length})</h3>
                <div className="space-y-2">
                  {playlist.map((track, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                        index === currentIndex
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        // Implement play track
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{track.title}</p>
                        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromPlaylist(index);
                        }}
                        className="p-1 hover:bg-red-600 rounded transition text-red-400 hover:text-red-200 ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
    );
}
