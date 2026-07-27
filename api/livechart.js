const BASE_URL = 'https://www.livechart.me';
const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.google.com/'
};

function buildUrl(base, params) {
  const u = new URL(base);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, v);
  });
  return u.toString();
}

async function fetchHtml(url, params) {
  const target = params ? buildUrl(url, params) : url;
  const res = await fetch(target, { headers: HEADERS });
  if (!res.ok) {
    const err = new Error(`Failed to fetch ${target}. Status: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.text();
}

function decodeEntities(str) {
  return (str || '')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function stripTags(str) {
  return decodeEntities((str || '').replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

function matchAttr(block, attr) {
  const re = new RegExp(`${attr}="([^"]*)"`);
  const m = block.match(re);
  return m ? decodeEntities(m[1]) : '';
}

function extractBlocks(html, selectorRe) {
  const blocks = [];
  let m;
  while ((m = selectorRe.exec(html)) !== null) {
    blocks.push(m[0]);
  }
  return blocks;
}

function parseAnimeCard(block) {
  const id = matchAttr(block, 'data-anime-id');
  const romaji = matchAttr(block, 'data-romaji');
  const english = matchAttr(block, 'data-english');
  const native = matchAttr(block, 'data-native');

  let alternateTitles = [];
  try {
    alternateTitles = JSON.parse(decodeEntities(matchAttr(block, 'data-alternate') || '[]'));
  } catch (e) {
    alternateTitles = [];
  }

  const premiereRaw = matchAttr(block, 'data-premiere');
  const premiere = premiereRaw ? parseInt(premiereRaw, 10) : null;

  const genres = [];
  const tagsMatch = block.match(/<ul[^>]*class="[^"]*anime-tags[^"]*"[\s\S]*?<\/ul>/);
  if (tagsMatch) {
    const aRe = /<a[^>]*>([\s\S]*?)<\/a>/g;
    let am;
    while ((am = aRe.exec(tagsMatch[0])) !== null) genres.push(stripTags(am[1]));
  }

  const posterBlockMatch = block.match(/<div[^>]*class="[^"]*poster-container[^"]*"[\s\S]*?<img[^>]*>/);
  let poster = '';
  let posterLarge = '';
  if (posterBlockMatch) {
    poster = matchAttr(posterBlockMatch[0], 'src');
    const srcset = matchAttr(posterBlockMatch[0], 'srcset');
    posterLarge = srcset ? srcset.split(',').pop().trim().split(' ')[0] : poster;
  }

  let nextEpisode = null;
  if (/episode-countdown/.test(block)) {
    const epTextMatch = block.match(/<[^>]*class="[^"]*release-schedule-info[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/);
    const epText = epTextMatch ? stripTags(epTextMatch[1]) : '';
    const timestampMatch = block.match(/<time[^>]*data-timestamp="([^"]*)"/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;
    nextEpisode = { numberText: epText, timestamp: timestamp || null };
  }

  const ratingMatch = block.match(/<[^>]*class="[^"]*anime-avg-user-rating[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/);
  const rating = ratingMatch ? stripTags(ratingMatch[1]) || null : null;

  const studios = [];
  const studiosMatch = block.match(/<ul[^>]*class="[^"]*anime-studios[^"]*"[\s\S]*?<\/ul>/);
  if (studiosMatch) {
    const aRe = /<a[^>]*>([\s\S]*?)<\/a>/g;
    let am;
    while ((am = aRe.exec(studiosMatch[0])) !== null) studios.push(stripTags(am[1]));
  }

  const startDateMatch = block.match(/<[^>]*class="[^"]*anime-date[^"]*"[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);
  const startDate = startDateMatch ? stripTags(startDateMatch[1]) || null : null;

  const sourceMatch = block.match(/<[^>]*class="[^"]*anime-source[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/);
  const source = sourceMatch ? stripTags(sourceMatch[1]) || null : null;

  const episodesMatch = block.match(/<[^>]*class="[^"]*anime-episodes[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/);
  const episodesText = episodesMatch ? stripTags(episodesMatch[1]) || null : null;

  let synopsis = null;
  const synopsisBlockMatch = block.match(/<[^>]*class="[^"]*anime-synopsis[^"]*"[\s\S]*?<\/div>/);
  if (synopsisBlockMatch) {
    const pRe = /<p(?![^>]*lc-editor-note)[^>]*>([\s\S]*?)<\/p>/g;
    let pm;
    const parts = [];
    while ((pm = pRe.exec(synopsisBlockMatch[0])) !== null) parts.push(stripTags(pm[1]));
    synopsis = parts.join(' ').trim() || null;
  }

  const externalLinks = {};
  const linksBlockMatch = block.match(/<[^>]*class="[^"]*related-links[^"]*"[\s\S]*?<\/div>\s*<\/div>/);
  if (linksBlockMatch) {
    const aRe = /<a[^>]*class="[^"]*?([\w-]+)-icon[^"]*"[^>]*href="([^"]*)"[^>]*>/g;
    let am;
    while ((am = aRe.exec(linksBlockMatch[0])) !== null) {
      const key = am[1];
      const href = decodeEntities(am[2]);
      if (!href) continue;
      externalLinks[key] = href.startsWith('/') ? `${BASE_URL}${href}` : href;
    }
  }

  return {
    id,
    title: romaji || english || native,
    romaji,
    english,
    native,
    alternateTitles,
    premiere,
    genres,
    poster: posterLarge,
    posterSmall: poster,
    nextEpisode,
    rating,
    studios,
    startDate,
    source,
    episodesText,
    synopsis,
    externalLinks
  };
}

async function getHomepage(season, year) {
  let url = BASE_URL;
  if (season && year) {
    url = `${BASE_URL}/${String(season).toLowerCase()}-${year}/tv`;
  }

  const html = await fetchHtml(url);
  const articleRe = /<article[^>]*class="[^"]*\banime\b[^"]*"[\s\S]*?<\/article>/g;
  const blocks = extractBlocks(html, articleRe);
  const results = blocks.map(parseAnimeCard).filter((a) => a.id);

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
  const pageTitle = titleMatch ? stripTags(titleMatch[1]) : '';

  return {
    title: pageTitle,
    season: season || 'current',
    year: year || 'current',
    total: results.length,
    results
  };
}

async function searchAnime(query) {
  const url = `${BASE_URL}/search`;
  const html = await fetchHtml(url, { q: query });
  const itemRe = /<[^>]*class="[^"]*\banime-item\b[^"]*"[\s\S]*?(?=<[^>]*class="[^"]*\banime-item\b[^"]*"|$)/g;
  const blocks = extractBlocks(html, itemRe);

  const results = blocks
    .map((block) => {
      const id = matchAttr(block, 'data-anime-id');
      if (!id) return null;
      const premiereRaw = matchAttr(block, 'data-premiere');
      const premiere = premiereRaw ? parseInt(premiereRaw, 10) : null;
      const title = matchAttr(block, 'data-title');

      const posterBlockMatch = block.match(/<div[^>]*class="[^"]*poster-wrap[^"]*"[\s\S]*?<img[^>]*>/);
      let poster = '';
      let posterLarge = '';
      if (posterBlockMatch) {
        poster = matchAttr(posterBlockMatch[0], 'src');
        const srcset = matchAttr(posterBlockMatch[0], 'srcset');
        posterLarge = srcset ? srcset.split(',').pop().trim().split(' ')[0] : poster;
      }

      const typeMatch = block.match(/<[^>]*class="[^"]*title-extra[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/);
      const typeText = typeMatch ? stripTags(typeMatch[1]) : '';

      const dateMatch = block.match(/<[^>]*class="[^"]*\binfo\b[^"]*"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/);
      const date = dateMatch ? stripTags(dateMatch[1]) : '';

      const ratingMatch = block.match(/<[^>]*class="[^"]*fake-link[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/);
      const rating = ratingMatch ? stripTags(ratingMatch[1]) : '';

      const linkMatch = block.match(/<[^>]*class="[^"]*anime-item__body__title[^"]*"[\s\S]*?<a[^>]*href="([^"]*)"/);
      const link = linkMatch ? decodeEntities(linkMatch[1]) : '';

      return {
        id,
        title,
        premiere,
        poster: posterLarge,
        typeText,
        date,
        rating,
        link: link ? `${BASE_URL}${link}` : ''
      };
    })
    .filter(Boolean);

  return { query, total: results.length, results };
}

async function getAnimeDetails(animeId) {
  const url = `${BASE_URL}/anime/${animeId}`;
  const html = await fetchHtml(url);

  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  let schema = {};
  if (jsonLdMatch) {
    try {
      schema = JSON.parse(jsonLdMatch[1]);
    } catch (e) {
      schema = {};
    }
  }

  let status = null;
  let seasonText = null;
  const sidebarBlockMatch = html.match(/<[^>]*class="[^"]*lc-poster-col[^"]*"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  if (sidebarBlockMatch) {
    const rowRe = /<div[^>]*class="[^"]*text-sm[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    let rm;
    while ((rm = rowRe.exec(sidebarBlockMatch[0])) !== null) {
      const rowHtml = rm[1];
      if (/Status/.test(rowHtml)) {
        status = stripTags(rowHtml.replace(/Status/, ''));
      }
      if (/^\s*Season\b/.test(stripTags(rowHtml))) {
        seasonText = stripTags(rowHtml.replace(/Season/, ''));
      }
    }
  }

  const hashtags = [];
  const hashtagRe = /<a[^>]*href="[^"]*x\.com\/search[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let hm;
  while ((hm = hashtagRe.exec(html)) !== null) hashtags.push(stripTags(hm[1]));

  let nextEpisode = null;
  const countdownMatch = html.match(/<[^>]*class="[^"]*lc-anime-countdown-grid[^"]*"[^>]*>/);
  if (countdownMatch) {
    const scheduleLinkMatch = html.match(/<a[^>]*href="[^"]*\/schedules\/[^"]*"[^>]*>([\s\S]*?)<\/a>/);
    const epText = scheduleLinkMatch ? stripTags(scheduleLinkMatch[1]) : '';
    const timestampMatch = countdownMatch[0].match(/data-countdown-bar-timestamp="([^"]*)"/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;
    nextEpisode = { numberText: epText, timestamp: timestamp || null };
  }

  const streams = [];
  const streamBlockRe = /<[^>]*class="[^"]*flex-1 flex items-center gap-4 p-4[^"]*"[\s\S]*?<\/div>\s*<\/div>/g;
  const streamBlocks = extractBlocks(html, streamBlockRe);
  streamBlocks.forEach((block) => {
    const linkMatch = block.match(/<a[^>]*class="[^"]*\blink\b[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    if (!linkMatch) return;
    const href = decodeEntities(linkMatch[1]);
    const name = stripTags(linkMatch[2]);
    const descMatch = block.match(/<[^>]*class="[^"]*line-clamp-1[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/);
    const desc = descMatch ? stripTags(descMatch[1]) : '';
    if (href && name) streams.push({ name, link: href, desc: desc || '' });
  });

  const videos = [];
  const videoBlockRe = /<[^>]*class="[^"]*\blc-video\b[^"]*"[\s\S]*?(?=<[^>]*class="[^"]*\blc-video\b[^"]*"|$)/g;
  const videoBlocks = extractBlocks(html, videoBlockRe);
  videoBlocks.forEach((block) => {
    const titleMatch = block.match(/<[^>]*class="[^"]*text-sm line-clamp-2 font-bold[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : '';
    const youtubeMatch = block.match(/<a[^>]*href="([^"]*)"/);
    const youtubeUrl = youtubeMatch ? decodeEntities(youtubeMatch[1]) : '';
    const embedMatch = block.match(/data-video-embed-url="([^"]*)"/);
    const embedUrl = embedMatch ? decodeEntities(embedMatch[1]) : '';
    const durationMatch = block.match(/data-video-target="durationBadge"[^>]*>([\s\S]*?)<\/[^>]*>/);
    const duration = durationMatch ? stripTags(durationMatch[1]) : '';
    if (title || embedUrl) {
      videos.push({ title, youtubeUrl: youtubeUrl || '', embedUrl: embedUrl || '', duration: duration || '' });
    }
  });

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);

  // Kalau tanggal pasti (datePublished) tidak tersedia dari sumber, anime ini masih
  // TBA/belum dijadwalkan. Tampilkan status season (mis. "TBA", "Winter 2027") apa adanya
  // daripada mengosongkan field tanggal tayang. datePublished selalu diprioritaskan
  // kalau ada isinya, sekalipun cuma sebagian (mis. "2027-01"), karena itu data
  // paling akurat langsung dari sumber.
  const startDate = schema.datePublished || seasonText || null;

  return {
    id: String(animeId),
    title: schema.name || (h1Match ? stripTags(h1Match[1]) : ''),
    alternateTitles: schema.alternateName || [],
    poster: schema.image || '',
    description: schema.description ? stripTags(schema.description) : '',
    genres: schema.genre || [],
    episodesCount: schema.numberOfEpisodes || null,
    startDate,
    isTba: !schema.datePublished,
    studios: (schema.productionCompany || []).map((c) => c.name).filter(Boolean),
    rating: (schema.aggregateRating && schema.aggregateRating.ratingValue) || null,
    ratingCount: (schema.aggregateRating && schema.aggregateRating.ratingCount) || null,
    status,
    hashtags,
    nextEpisode,
    streams,
    videos
  };
}

// Mengambil daftar karakter (nama, gambar, role) dari AniList berdasarkan judul anime.
// LiveChart tidak menyediakan data karakter, jadi diambil dari sumber terpisah (AniList),
// dicocokkan lewat pencarian judul karena ID di kedua platform tidak sama.
async function getAnimeCharacters(title) {
  const query = `
    query ($search: String) {
      Media(search: $search, type: ANIME) {
        id
        title { romaji english native }
        characters(sort: [ROLE, RELEVANCE], perPage: 18) {
          edges {
            role
            node {
              id
              name { full native }
              image { large medium }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(ANILIST_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables: { search: title } })
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch characters from AniList. Status: ${res.status}`);
  }

  const json = await res.json();
  const media = json && json.data ? json.data.Media : null;
  if (!media) return { characters: [] };

  const characters = (media.characters && media.characters.edges ? media.characters.edges : [])
    .map((edge) => ({
      id: edge.node.id,
      name: edge.node.name ? (edge.node.name.full || edge.node.name.native || '') : '',
      nativeName: edge.node.name ? edge.node.name.native || '' : '',
      image: edge.node.image ? (edge.node.image.large || edge.node.image.medium || '') : '',
      role: edge.role || ''
    }))
    .filter((c) => c.name && c.image);

  return { source: 'anilist', matchedTitle: (media.title && (media.title.romaji || media.title.english)) || title, characters };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const action = (req.query.action || 'home').trim();

  try {
    if (action === 'home') {
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
      const season = (req.query.season || '').trim();
      const year = (req.query.year || '').trim();
      const data = await getHomepage(season || null, year || null);
      return res.status(200).json(data);
    }

    if (action === 'search') {
      res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=360');
      const q = (req.query.q || '').trim();
      if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
      const data = await searchAnime(q);
      return res.status(200).json(data);
    }

    if (action === 'detail') {
      res.setHeader('Cache-Control', 's-maxage=1200, stale-while-revalidate=2400');
      const id = (req.query.id || '').trim();
      if (!id) return res.status(400).json({ error: 'Query parameter "id" is required' });
      const data = await getAnimeDetails(id);
      if (!data.title) return res.status(404).json({ error: 'Anime not found' });
      return res.status(200).json(data);
    }

    if (action === 'characters') {
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
      const title = (req.query.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Query parameter "title" is required' });
      const data = await getAnimeCharacters(title);
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'LiveChart API error' });
  }
};
