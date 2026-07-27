(function () {
  const scriptTag = document.currentScript;
  const mode = scriptTag.dataset.mode;
  const params = new URLSearchParams(window.location.search);

  let currentFilter = params.get('filter') || 'popular';
  let currentPage = parseInt(params.get('page')) || 1;

  function setActiveTab(filter) {
    document.querySelectorAll('.tab-pill').forEach((btn) => {
      if (btn.dataset.filter === filter) {
        btn.classList.add('active');
        btn.classList.remove('bg-white/5', 'text-paper/70');
      } else {
        btn.classList.remove('active');
        btn.classList.add('bg-white/5', 'text-paper/70');
      }
    });
  }

  function updateUrl() {
    const url = new URL(window.location);
    url.searchParams.set('filter', currentFilter);
    url.searchParams.set('page', currentPage);
    window.history.replaceState({}, '', url);
  }

  function renderPagination(page, totalPages) {
    const el = document.getElementById('pagination');
    const maxShown = 500;
    const tp = Math.min(totalPages, maxShown);
    if (tp <= 1) { el.innerHTML = ''; return; }

    const prevDisabled = page <= 1;
    const nextDisabled = page >= tp;

    el.innerHTML = `
      <button id="prevPage" ${prevDisabled ? 'disabled' : ''} class="px-4 py-2 rounded-full text-sm font-bold border border-white/10 ${prevDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-amber-400/50 hover:text-amber-300'}">&larr; Prev</button>
      <span class="text-sm text-paper/60 font-semibold px-2">Page ${page} of ${tp > 500 ? '500+' : tp}</span>
      <button id="nextPage" ${nextDisabled ? 'disabled' : ''} class="px-4 py-2 rounded-full text-sm font-bold border border-white/10 ${nextDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:border-amber-400/50 hover:text-amber-300'}">Next &rarr;</button>
    `;

    if (!prevDisabled) document.getElementById('prevPage').addEventListener('click', () => { currentPage--; load(); });
    if (!nextDisabled) document.getElementById('nextPage').addEventListener('click', () => { currentPage++; load(); });
  }

  async function load() {
    gridSkeleton('movieGrid');
    updateUrl();
    setActiveTab(currentFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const data = mode === 'movies'
        ? await API.movies(currentFilter, currentPage)
        : await API.tv(currentFilter, currentPage);

      if (!data.results || data.results.length === 0) {
        document.getElementById('movieGrid').innerHTML = `<div class="col-span-full text-center py-20 text-paper/50">No titles found for this filter.</div>`;
        document.getElementById('pagination').innerHTML = '';
        return;
      }

      grid('movieGrid', data.results);
      renderPagination(data.page, data.total_pages);
    } catch (e) {
      console.error(e);
      document.getElementById('movieGrid').innerHTML = `<div class="col-span-full text-center py-20 text-crimson-300">Failed to load. Please try again.</div>`;
    }
  }

  document.querySelectorAll('.tab-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      load();
    });
  });

  load();
})();
