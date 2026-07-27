const { getApiKey, fetchEndpoint, formatItem } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  try {
    const type = req.query.type === 'tv' ? 'tv' : 'movie';
    const page = parseInt(req.query.page) || 1;

    const apiKey = await getApiKey();
    const data = await fetchEndpoint(apiKey, `${type}/top_rated`, { page });

    res.status(200).json({
      media_type: type,
      page: data.page,
      total_pages: Math.min(data.total_pages, 500),
      total_results: data.total_results,
      results: data.results.map((item, index) => {
        const formatted = formatItem(item, type);
        formatted.imdb_rank = (page - 1) * 20 + index + 1;
        return formatted;
      })
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load top IMDb data' });
  }
};
