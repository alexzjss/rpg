import React, { useState } from 'react';
import { Search, Plus, Loader, X } from 'lucide-react';
import { youTubeMusicService } from '../utils/youtubeMusic';
import { useMusic, Track } from '../contexts/MusicContext';

interface AddMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMusicModal({ isOpen, onClose }: AddMusicModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { addToPlaylist } = useMusic();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await youTubeMusicService.searchTracks(searchQuery, 15);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrack = (track: Track) => {
    addToPlaylist(track);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Adicionar Música</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Procure por música, artista ou playlist..."
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Procurando...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Procurar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {!hasSearched && (
            <div className="text-center text-gray-400 py-12">
              <p>Procure por uma música para começar</p>
            </div>
          )}

          {hasSearched && isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader size={32} className="animate-spin text-blue-500" />
            </div>
          )}

          {hasSearched && !isLoading && searchResults.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <p>Nenhuma música encontrada para "{searchQuery}"</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className="flex items-start gap-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition group"
                >
                  {/* Thumbnail */}
                  {track.thumbnail && (
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate hover:text-blue-400">
                      {track.title}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                    {track.duration > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60)
                          .toString()
                          .padStart(2, '0')}
                      </p>
                    )}
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => handleAddTrack(track)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Adicionar à playlist"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
