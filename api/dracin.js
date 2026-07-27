const BASE_URL = 'https://dracinema.com';
const API_KEY = 'xb3MdwdLrZrpaDXvrLLwfP==';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://dracinema.com/',
  'X-API-Key': API_KEY,
  Accept: 'application/json, text/plain, */*'
};

const HTML_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

let genreSlugToNameMap = {};

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function cleanTitle(title) {
  if (!title) return '';
  return decodeEntities(title)
    .replace(/\s+Full\s+Episode\s+Subtitle\s+Indonesia\s+-\s+Dracinema/gi, '')
    .replace(/\s+Sub\s+Indo\s+-\s+Dracinema/gi, '')
    .replace(/\s+-\s+Dracinema/gi, '')
    .trim();
}

function parseMovieSlug(moviePath) {
  const cleanPath = moviePath.replace('/movie/', '').replace(/^\//, '').replace(/\/$/, '');
  const lastHyphen = cleanPath.lastIndexOf('-');
  if (lastHyphen !== -1) {
    return {
      slug: cleanPath.substring(0, lastHyphen),
      id: cleanPath.substring(lastHyphen + 1)
    };
  }
  return { slug: cleanPath, id: '' };
}

async function fetchPage(url, headers = HTML_HEADERS) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = new Error(`Failed to fetch ${url}. Status code: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.text();
}

async function fetchApi(url) {
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    const err = new Error(`API error ${url}. Status code: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function extractAnchors(html, hrefPrefix) {
  const anchors = [];
  const anchorRegex = /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    if (!href.startsWith(hrefPrefix)) continue;
    const inner = match[2];
    anchors.push({ href, inner });
  }
  return anchors;
}

function extractImg(inner) {
  const imgMatch = inner.match(/<img\b[^>]*>/i);
  if (!imgMatch) return { alt: '', src: '' };
  const tag = imgMatch[0];
  const altMatch = tag.match(/alt="([^"]*)"/i);
  const srcMatch = tag.match(/data-src="([^"]*)"/i) || tag.match(/src="([^"]*)"/i);
  return {
    alt: altMatch ? altMatch[1] : '',
    src: srcMatch ? srcMatch[1] : ''
  };
}

function extractText(inner) {
  return decodeEntities(inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function parseMovieAnchors(html) {
  const anchors = extractAnchors(html, '/movie/');
  const dramas = [];
  for (const { href, inner } of anchors) {
    const img = extractImg(inner);
    const title = cleanTitle(img.alt);
    const cover = img.src;
    const { slug, id } = parseMovieSlug(href);
    if (id && !dramas.some((d) => d.id === id)) {
      dramas.push({ title, cover, url: href, slug, id });
    }
  }
  return dramas;
}

function parseGenreAnchors(html) {
  const anchors = extractAnchors(html, '/genre/');
  const genres = [];
  for (const { href, inner } of anchors) {
    const name = extractText(inner);
    const slug = href.replace('/genre/', '').replace(/\/$/, '');
    if (slug && name && !genres.some((g) => g.slug === slug)) {
      genres.push({ name, slug, url: href });
      genreSlugToNameMap[slug] = name;
    }
  }
  return genres;
}

async function getHome() {
  const html = await fetchPage(BASE_URL);
  const dramas = parseMovieAnchors(html);
  const genres = parseGenreAnchors(html);
  return { dramas, genres };
}

async function getCollections() {
  const url = `${BASE_URL}/collections`;
  const html = await fetchPage(url);
  return parseGenreAnchors(html);
}

function mapApiItem(item) {
  const originalName = item.bookName || '';
  const slug = item.replacedBookName || slugify(originalName);
  const id = item.originalBookId || item.bookId || item.id || '';
  return {
    id,
    name: originalName,
    cover: item.cover || '',
    introduction: item.introduction || '',
    genres: item.typeTwoNames || [],
    episodesCount: item.chapterCount || 0,
    url: `/movie/${slug}-${id}`,
    slug
  };
}

async function getAllMovies(page = 1) {
  const url = `${BASE_URL}/api/movie?page=${page}`;
  const data = await fetchApi(url);
  return (data || []).map(mapApiItem);
}

async function getGenreMovies(genreSlug, page = 1) {
  if (Object.keys(genreSlugToNameMap).length === 0) {
    await getCollections().catch(() => {});
  }
  let genreName = genreSlugToNameMap[genreSlug];
  if (!genreName) {
    genreName = genreSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  const url = `${BASE_URL}/api/movie?page=${page}&categories=${encodeURIComponent(genreName)}`;
  const data = await fetchApi(url);
  return (data || []).map(mapApiItem);
}

async function searchMovies(keyword) {
  const url = `${BASE_URL}/api/search?keyword=${encodeURIComponent(keyword)}`;
  const response = await fetchApi(url);
  const data = response.data || [];
  return data.map((item) => {
    const originalName = item.bookName || '';
    const slug = slugify(originalName);
    const id = item.originalBookId || item.id || '';
    return {
      id,
      name: originalName,
      cover: item.cover || '',
      introduction: item.introduction || '',
      episodesCount: item.chapterCount || 0,
      url: `/movie/${slug}-${id}`,
      slug
    };
  });
}

function extractTitle(html) {
  const h1Regex = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
  let match;
  while ((match = h1Regex.exec(html)) !== null) {
    const text = extractText(match[1]);
    if (text && text !== 'Dracinema') {
      return cleanTitle(text);
    }
  }
  return '';
}

function extractSynopsis(html) {
  const descMatch = html.match(/<p\b[^>]*itemprop="description"[^>]*>([\s\S]*?)<\/p>/i);
  if (descMatch) {
    const text = extractText(descMatch[1]);
    if (text) return text;
  }

  const h2Regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let sinopsisIdx = -1;
  let match;
  while ((match = h2Regex.exec(html)) !== null) {
    if (extractText(match[1]) === 'Sinopsis') {
      sinopsisIdx = match.index + match[0].length;
      break;
    }
  }
  if (sinopsisIdx === -1) return '';

  const nextH2Match = html.slice(sinopsisIdx).match(/<h2\b/i);
  const endIdx = nextH2Match ? sinopsisIdx + nextH2Match.index : html.length;
  const segment = html.slice(sinopsisIdx, endIdx);

  const paragraphs = [...segment.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => extractText(m[1]));
  let best = '';
  for (const p of paragraphs) {
    if (p.length > best.length) best = p;
  }
  return best;
}

function extractRecommendations(html) {
  const exclude = ['Sinopsis', 'Daftar Episode', 'Pertanyaan Umum'];
  const recommendations = [];
  const h2Regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  const headings = [];
  let match;
  while ((match = h2Regex.exec(html)) !== null) {
    headings.push({ text: extractText(match[1]), index: match.index, endIndex: match.index + match[0].length });
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    if (exclude.some((ex) => heading.text.includes(ex))) continue;

    const segEnd = i + 1 < headings.length ? headings[i + 1].index : Math.min(html.length, heading.endIndex + 8000);
    const segment = html.slice(heading.endIndex, segEnd);
    const movies = parseMovieAnchors(segment);
    if (movies.length > 0) {
      recommendations.push({ sectionTitle: heading.text, movies });
    }
  }
  return recommendations;
}

function extractEpisodesFromHtml(html) {
  const anchors = extractAnchors(html, '/play/');
  const episodes = [];
  for (const { href, inner } of anchors) {
    const text = extractText(inner);
    const parts = href.split('/');
    const epsNumStr = parts[parts.length - 1];
    const epsNum = parseInt(epsNumStr, 10);
    if (!isNaN(epsNum)) {
      episodes.push({ title: `Episode ${epsNum}`, url: href, number: epsNum });
    } else {
      episodes.push({ title: text || 'Putar Sekarang', url: href, number: 1 });
    }
  }
  episodes.sort((a, b) => a.number - b.number);
  const unique = [];
  const seen = new Set();
  for (const ep of episodes) {
    if (!seen.has(ep.number)) {
      seen.add(ep.number);
      unique.push(ep);
    }
  }
  return unique;
}

async function getMovieDetails(movieSlugOrPath) {
  const cleanPath = movieSlugOrPath.startsWith('/movie/') ? movieSlugOrPath : `/movie/${movieSlugOrPath}`;
  const url = `${BASE_URL}${cleanPath}`;
  const html = await fetchPage(url);

  const title = extractTitle(html);
  const synopsis = extractSynopsis(html);
  const genres = parseGenreAnchors(html);
  const recommendations = extractRecommendations(html);
  const episodes = extractEpisodesFromHtml(html);
  const { slug, id } = parseMovieSlug(cleanPath);

  const coverMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  const cover = coverMatch ? coverMatch[1] : '';

  return { title, slug, id, cover, synopsis, genres, episodes, recommendations };
}

async function getEpisodeStreaming(playPathOrUrl) {
  const cleanPath = playPathOrUrl.startsWith('/play/') ? playPathOrUrl : `/play/${playPathOrUrl}`;
  const url = `${BASE_URL}${cleanPath}`;
  const html = await fetchPage(url);

  const regex = /self\.__next_f\.push\(\[\d+,\s*"(.*?)"\]\)/g;
  let match;
  let mergedText = '';
  while ((match = regex.exec(html)) !== null) {
    let chunk = match[1];
    chunk = chunk.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\\//g, '/');
    mergedText += chunk;
  }

  let videoUrls = [];
  const videoUrlsRegex = /"videoUrls"\s*:\s*(\[.*?\])/;
  const videoMatch = mergedText.match(videoUrlsRegex);

  if (videoMatch) {
    try {
      videoUrls = JSON.parse(videoMatch[1]);
    } catch (err) {
      const urlRegex = /"url"\s*:\s*"([^"]+)"/g;
      let urlMatch;
      while ((urlMatch = urlRegex.exec(videoMatch[1])) !== null) {
        const streamUrl = urlMatch[1].replace(/\\u([0-9a-fA-F]{4})/g, (g, m) => String.fromCharCode(parseInt(m, 16)));
        videoUrls.push({ quality: 720, url: streamUrl, cdn: null });
      }
    }
  } else {
    const directUrlRegex = /https?:\/\/[^\s"']+\.(?:m3u8|mp4)[^\s"']*/g;
    const directMatches = html.match(directUrlRegex) || [];
    videoUrls = [...new Set(directMatches)].map((u) => ({ quality: 720, url: u, cdn: null }));
  }

  const navigationEpisodes = extractEpisodesFromHtml(html);
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? cleanTitle(extractText(titleMatch[1])) : '';

  return { title, videoSources: videoUrls, availableEpisodes: navigationEpisodes };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const action = (req.query.action || 'home').trim();

  try {
    if (action === 'home') {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      const data = await getHome();
      return res.status(200).json(data);
    }

    if (action === 'collections') {
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
      const genres = await getCollections();
      return res.status(200).json({ genres });
    }

    if (action === 'movies') {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      const page = parseInt(req.query.page) || 1;
      const genre = (req.query.genre || '').trim();
      const results = genre ? await getGenreMovies(genre, page) : await getAllMovies(page);
      return res.status(200).json({ genre: genre || null, page, results });
    }

    if (action === 'search') {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      const keyword = (req.query.q || '').trim();
      if (!keyword) return res.status(400).json({ error: 'Query parameter "q" is required' });
      const results = await searchMovies(keyword);
      return res.status(200).json({ query: keyword, results });
    }

    if (action === 'detail') {
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
      const slug = (req.query.slug || '').trim();
      if (!slug) return res.status(400).json({ error: 'Query parameter "slug" is required' });
      const details = await getMovieDetails(slug);
      return res.status(200).json(details);
    }

    if (action === 'play') {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      const path = (req.query.path || '').trim();
      if (!path) return res.status(400).json({ error: 'Query parameter "path" is required' });
      const stream = await getEpisodeStreaming(path);
      return res.status(200).json(stream);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Dracin API error' });
  }
};
