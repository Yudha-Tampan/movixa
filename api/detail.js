const { getApiKey, fetchEndpoint, formatItem, generateStreams, IMAGE_BASE_URL } = require('./_lib');

async function scrapeMovieDetail(apiKey, id) {
  const [details, credits, similar] = await Promise.all([
    fetchEndpoint(apiKey, `movie/${id}`),
    fetchEndpoint(apiKey, `movie/${id}/credits`),
    fetchEndpoint(apiKey, `movie/${id}/similar`)
  ]);

  const formattedCast = (credits.cast || []).slice(0, 10).map((c) => ({
    name: c.name,
    character: c.character,
    profile_url: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null
  }));

  const formattedDirectors = (credits.crew || []).filter((c) => c.job === 'Director').map((c) => c.name);
  const formattedSimilar = (similar.results || []).slice(0, 10).map((item) => formatItem(item, 'movie'));

  const formattedDetails = formatItem(details, 'movie');
  formattedDetails.genres = (details.genres || []).map((g) => g.name);
  formattedDetails.cast = formattedCast;
  formattedDetails.directors = formattedDirectors;
  formattedDetails.similar_movies = formattedSimilar;
  formattedDetails.tagline = details.tagline || '';
  formattedDetails.status = details.status || '';
  formattedDetails.budget = details.budget || 0;
  formattedDetails.revenue = details.revenue || 0;
  formattedDetails.runtime_minutes = details.runtime || 0;

  return formattedDetails;
}

async function scrapeTVDetail(apiKey, id) {
  const [details, credits, similar] = await Promise.all([
    fetchEndpoint(apiKey, `tv/${id}`),
    fetchEndpoint(apiKey, `tv/${id}/credits`),
    fetchEndpoint(apiKey, `tv/${id}/similar`)
  ]);

  const formattedCast = (credits.cast || []).slice(0, 10).map((c) => ({
    name: c.name,
    character: c.character,
    profile_url: c.profile_path ? `${IMAGE_BASE_URL}${c.profile_path}` : null
  }));

  const formattedCreators = (details.created_by || []).map((c) => c.name);
  const formattedSimilar = (similar.results || []).slice(0, 10).map((item) => formatItem(item, 'tv'));

  const numSeasons = details.number_of_seasons || 0;
  const seasonNumbers = Array.from({ length: numSeasons }, (_, i) => i + 1);

  const seasonResults = await Promise.all(
    seasonNumbers.map(async (s) => {
      try {
        const seasonData = await fetchEndpoint(apiKey, `tv/${id}/season/${s}`);
        const episodes = (seasonData.episodes || []).map((ep) => ({
          id: ep.id,
          episode_number: ep.episode_number,
          name: ep.name,
          overview: ep.overview || '',
          air_date: ep.air_date || 'N/A',
          rating: ep.vote_average ? parseFloat(ep.vote_average.toFixed(1)) : 0.0,
          still_path: ep.still_path ? `${IMAGE_BASE_URL}${ep.still_path}` : null,
          streams: generateStreams(id, 'tv', s, ep.episode_number)
        }));

        return {
          season_number: s,
          name: seasonData.name || `Season ${s}`,
          overview: seasonData.overview || '',
          air_date: seasonData.air_date || 'N/A',
          poster_url: seasonData.poster_path ? `${IMAGE_BASE_URL}${seasonData.poster_path}` : null,
          episodes
        };
      } catch (err) {
        return null;
      }
    })
  );

  const seasons = seasonResults.filter(Boolean);

  const formattedDetails = formatItem(details, 'tv');
  formattedDetails.genres = (details.genres || []).map((g) => g.name);
  formattedDetails.cast = formattedCast;
  formattedDetails.creators = formattedCreators;
  formattedDetails.similar_shows = formattedSimilar;
  formattedDetails.number_of_seasons = details.number_of_seasons || 0;
  formattedDetails.number_of_episodes = details.number_of_episodes || 0;
  formattedDetails.status = details.status || '';
  formattedDetails.seasons = seasons;

  return formattedDetails;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');
  try {
    const type = req.query.type;
    const id = parseInt(req.query.id);

    if (!type || !id || isNaN(id) || !['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'Parameter "type" (movie/tv) and valid "id" are required' });
    }

    const apiKey = await getApiKey();
    const result = type === 'movie' ? await scrapeMovieDetail(apiKey, id) : await scrapeTVDetail(apiKey, id);

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load detail' });
  }
};
