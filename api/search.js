const { getApiKey, fetchEndpoint, formatItem } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  try {
    const query = (req.query.q || '').trim();
    const page = parseInt(req.query.page) || 1;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const apiKey = await getApiKey();
    const data = await fetchEndpoint(apiKey, 'search/multi', { query, page });

    const filteredResults = data.results
      .filter((item) => item.media_type !== 'person')
      .map((item) => formatItem(item));

    res.status(200).json({
      query,
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results: filteredResults
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Search failed' });
  }
};
