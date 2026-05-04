import { Track } from '../contexts/MusicContext';

/**
 * YouTube Music Service
 * Handles searching and retrieving tracks from YouTube Music
 * Uses YouTube Data API v3 for search functionality
 */

export class YouTubeMusicService {
  private apiKey: string;
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey?: string) {
    // Use provided API key or fallback to environment variable
    this.apiKey = apiKey || import.meta.env.VITE_YOUTUBE_API_KEY || '';
  }

  /**
   * Search for tracks on YouTube Music
   * @param query Search query (song name, artist, etc.)
   * @param maxResults Number of results to return (default: 10)
   * @returns Array of Track objects
   */
  async searchTracks(query: string, maxResults: number = 10): Promise<Track[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not configured. Using mock data.');
      return this.getMockTracks(query);
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: `${query} official audio`,
        type: 'video',
        maxResults: maxResults.toString(),
        key: this.apiKey,
        videoCategoryId: '10', // Music category
        order: 'relevance',
      });

      const response = await fetch(`${this.BASE_URL}/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.items.map((item: any, index: number) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        duration: 0, // Duration would need additional API call to get
        thumbnail: item.snippet.thumbnails.medium.url,
      }));
    } catch (error) {
      console.error('Error searching YouTube Music:', error);
      return this.getMockTracks(query);
    }
  }

  /**
   * Get track details from YouTube
   * @param videoId YouTube video ID
   * @returns Track object with detailed information
   */
  async getTrackDetails(videoId: string): Promise<Track | null> {
    if (!this.apiKey) return null;

    try {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails',
        id: videoId,
        key: this.apiKey,
      });

      const response = await fetch(`${this.BASE_URL}/videos?${params}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const data = await response.json();
      const item = data.items[0];

      if (!item) return null;

      // Parse duration from ISO 8601 format (PT format)
      const duration = this.parseDuration(item.contentDetails.duration);

      return {
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        duration,
        thumbnail: item.snippet.thumbnails.high?.url,
      };
    } catch (error) {
      console.error('Error getting track details:', error);
      return null;
    }
  }

  /**
   * Convert ISO 8601 duration format to seconds
   * @param duration Duration in format like PT3M45S
   * @returns Duration in seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Get popular music tracks (mock data for demo)
   * @returns Array of popular tracks
   */
  async getPopularTracks(): Promise<Track[]> {
    return this.getMockTracks('');
  }

  /**
   * Mock data for demonstration when API key is not available
   * @param query Search query
   * @returns Array of mock tracks
   */
  private getMockTracks(query: string): Track[] {
    const mockTracks: Track[] = [
      {
        id: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
        artist: 'Rick Astley',
        duration: 213,
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      },
      {
        id: 'jNQXAC9IVRw',
        title: 'Me at the zoo',
        artist: 'jawed',
        duration: 18,
        thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
      },
      {
        id: 'kJQP7kiw9Fk',
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee (Lyrics)',
        artist: 'Luis Fonsi',
        duration: 228,
        thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw9Fk/hqdefault.jpg',
      },
    ];

    if (query) {
      return mockTracks.filter(track =>
        track.title.toLowerCase().includes(query.toLowerCase()) ||
        track.artist.toLowerCase().includes(query.toLowerCase())
      );
    }

    return mockTracks;
  }

  /**
   * Get YouTube embed URL for a video
   * @param videoId YouTube video ID
   * @param autoplay Whether to autoplay the video
   * @returns YouTube embed URL
   */
  getEmbedUrl(videoId: string, autoplay: boolean = false): string {
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&controls=0&modestbranding=1&showinfo=0&rel=0`;
  }
}

// Export singleton instance
export const youTubeMusicService = new YouTubeMusicService();
