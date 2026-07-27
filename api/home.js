const { getApiKey, fetchEndpoint, formatItem } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  try {
    const apiKey = await getApiKey();

    const [tvTrendingDay, movieTrendingDay, trendingMovies, trendingSeries, topRatedMovies, upcomingMovies] =
      await Promise.all([
        fetchEndpoint(apiKey, 'trending/tv/day'),
        fetchEndpoint(apiKey, 'trending/movie/day'),
        fetchEndpoint(apiKey, 'trending/movie/week'),
        fetchEndpoint(apiKey, 'trending/tv/week'),
        fetchEndpoint(apiKey, 'movie/top_rated', { page: 1 }),
        fetchEndpoint(apiKey, 'movie/upcoming', { page: 1 })
      ]);

    const bannerItems = [
      ...tvTrendingDay.results.slice(0, 3).map((item) => ({ ...item, media_type: 'tv' })),
      ...movieTrendingDay.results.slice(0, 3).map((item) => ({ ...item, media_type: 'movie' }))
    ].map((item) => formatItem(item));

    res.status(200).json({
      hero_banner: bannerItems,
      trending_movies: trendingMovies.results.slice(0, 20).map((item) => formatItem(item, 'movie')),
      trending_series: trendingSeries.results.slice(0, 20).map((item) => formatItem(item, 'tv')),
      all_time_best: topRatedMovies.results.slice(0, 20).map((item) => formatItem(item, 'movie')),
      upcoming: upcomingMovies.results.slice(0, 20).map((item) => formatItem(item, 'movie'))
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to load home data' });
  }
};
