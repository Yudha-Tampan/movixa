const { getApiKey, fetchEndpoint, formatItem } = require('./_lib');

const VALID_FILTERS = ['popular', 'top_rated', 'on_the_air', 'airing_today'];

function normalizeFilter(filter) {
  if (filter === 'on_air' || filter === 'on-air') return 'on_the_air';
  if (filter === 'airing-today') return 'airing_today';
  return filter;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  try {
    const filter = normalizeFilter(req.query.filter) || 'popular';
    const actualFilter = VALID_FILTERS.includes(filter) ? filter : 'popular';
    const page = parseInt(req.query.page) || 1;

    const apiKey = await getApiKey();
    const data = await fetchEndpoint(apiKey, `tv/${actualFilter}`, { page });

    res.status(200).json({
      filter: actualFilter,
      page: data.page,
      total_pages: Math.min(data.total_pages, 500),
      total_results: data.total_results,
      results: data.results.map((item) => formatItem(item, 'tv'))
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load TV shows' });
  }
};
