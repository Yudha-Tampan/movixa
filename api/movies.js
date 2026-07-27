const { getApiKey, fetchEndpoint, formatItem } = require('./_lib');

const VALID_FILTERS = ['popular', 'top_rated', 'now_playing', 'upcoming'];

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  try {
    const filter = VALID_FILTERS.includes(req.query.filter) ? req.query.filter : 'popular';
    const page = parseInt(req.query.page) || 1;

    const apiKey = await getApiKey();
    const data = await fetchEndpoint(apiKey, `movie/${filter}`, { page });

    res.status(200).json({
      filter,
      page: data.page,
      total_pages: Math.min(data.total_pages, 500),
      total_results: data.total_results,
      results: data.results.map((item) => formatItem(item, 'movie'))
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load movies' });
  }
};
