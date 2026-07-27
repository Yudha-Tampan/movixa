const HURA_DOMAIN = 'https://hurawatch.sx';
const FALLBACK_API_KEY = '9e7096a7575623aa30c66e9cc987e411';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const IMAGE_BASE_ORIGINAL = 'https://image.tmdb.org/t/p/original';

const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

const SERVER_PATTERNS = {
  Server_1_VidCore: { movie: 'https://vidcore.net/movie/', tv: 'https://vidcore.net/tv/', suffix: '?autoPlay=true' },
  Server_2_VidGod: { movie: 'https://vidgod.net/movie/', tv: 'https://vidgod.net/tv/', suffix: '' },
  Server_3_VidNest: { movie: 'https://vidnest.fun/movie/', tv: 'https://vidnest.fun/tv/', suffix: '' },
  Server_4_VidFast: { movie: 'https://vidfast.pro/movie/', tv: 'https://vidfast.pro/tv/', suffix: '?autoPlay=true' },
  Server_5_VidSrcEmbed: { movie: 'https://vidsrc-embed.ru/embed/movie/', tv: 'https://vidsrc-embed.ru/embed/tv/', suffix: '' },
  Server_6_VidEasy: { movie: 'https://player.videasy.net/movie/', tv: 'https://player.videasy.net/tv/', suffix: '' }
};

let cachedKey = null;
let cachedAt = 0;
const CACHE_TTL = 1000 * 60 * 30;

async function getApiKey() {
  const now = Date.now();
  if (cachedKey && now - cachedAt < CACHE_TTL) return cachedKey;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${HURA_DOMAIN}/config.js`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const match = text.match(/TMDB_API_KEY\s*:\s*['"]([a-f0-9]+)['"]/i);
    if (match && match[1]) {
      cachedKey = match[1];
      cachedAt = now;
      return cachedKey;
    }
  } catch (e) {
    /* fall through to fallback key */
  }
  cachedKey = FALLBACK_API_KEY;
  cachedAt = now;
  return cachedKey;
}

function generateStreams(id, type, season = 1, episode = 1) {
  const streams = {};
  for (const [server, patterns] of Object.entries(SERVER_PATTERNS)) {
    if (type === 'movie') {
      streams[server] = `${patterns.movie}${id}${patterns.suffix}`;
    } else {
      streams[server] = `${patterns.tv}${id}/${season}/${episode}${patterns.suffix}`;
    }
  }
  return streams;
}

function formatItem(item, typeOverride = null) {
  const mediaType = typeOverride || item.media_type || (item.title ? 'movie' : 'tv');
  const title = item.title || item.name || 'Untitled';
  const originalTitle = item.original_title || item.original_name || title;
  const year = (item.release_date || item.first_air_date || '').split('-')[0] || 'N/A';
  const rating = item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 0.0;
  const genres = (item.genre_ids || []).map((id) => GENRE_MAP[id] || id);
  const poster = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null;
  const backdrop = item.backdrop_path ? `${IMAGE_BASE_ORIGINAL}${item.backdrop_path}` : null;

  return {
    id: item.id,
    title,
    original_title: originalTitle,
    type: mediaType,
    year,
    rating,
    genres,
    overview: item.overview || '',
    poster_url: poster,
    backdrop_url: backdrop,
    streams: generateStreams(item.id, mediaType)
  };
}

async function fetchEndpoint(apiKey, path, params = {}) {
  const queryParams = new URLSearchParams({ api_key: apiKey, ...params });
  const url = `${TMDB_BASE_URL}/${path}?${queryParams}`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`TMDB API Error: ${response.status} for ${path}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

module.exports = {
  HURA_DOMAIN,
  FALLBACK_API_KEY,
  TMDB_BASE_URL,
  IMAGE_BASE_URL,
  IMAGE_BASE_ORIGINAL,
  GENRE_MAP,
  SERVER_PATTERNS,
  getApiKey,
  generateStreams,
  formatItem,
  fetchEndpoint
};
