(function () {
  function dracinPosterCard(item) {
    const cover = item.cover || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
    const epsLabel = item.episodesCount ? `${item.episodesCount} Eps` : '';
    return `
    <a href="/dracin-detail.html?slug=${encodeURIComponent(item.slug)}&id=${encodeURIComponent(item.id)}" class="poster-card group block shrink-0 w-[150px] sm:w-[180px]">
      <div class="relative aspect-[2/3] w-full">
        <img src="${cover}" alt="${escapeHtml(item.title || item.name)}" loading="lazy" class="w-full h-full object-cover" />
        <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(item.title || item.name)}</h3>
          ${epsLabel ? `<p class="text-[11px] text-paper/60 mt-1">${epsLabel}</p>` : ''}
        </div>
        <div class="absolute top-2 right-2"><span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">Dracin</span></div>
      </div>
    </a>`;
  }

  function dracinPosterGridCard(item) {
    const cover = item.cover || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
    const epsLabel = item.episodesCount ? `${item.episodesCount} Eps` : '';
    const genres = (item.genres || []).slice(0, 2).join(' • ');
    return `
    <a href="/dracin-detail.html?slug=${encodeURIComponent(item.slug)}&id=${encodeURIComponent(item.id)}" class="poster-card group block">
      <div class="relative aspect-[2/3] w-full">
        <img src="${cover}" alt="${escapeHtml(item.title || item.name)}" loading="lazy" class="w-full h-full object-cover" />
        <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(item.title || item.name)}</h3>
          <p class="text-[11px] text-paper/60 mt-1">${epsLabel}${genres ? (epsLabel ? ' · ' : '') + genres : ''}</p>
        </div>
        <div class="absolute top-2 right-2"><span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">Dracin</span></div>
      </div>
    </a>`;
  }

  function renderRail(id, items) {
    document.getElementById(id).innerHTML = items.map(dracinPosterCard).join('');
  }
  function renderGrid(id, items) {
    document.getElementById(id).innerHTML = items.map(dracinPosterGridCard).join('');
  }

  let currentGenre = '';
  let currentPage = 1;

  async function loadPopular() {
    railSkeleton('railPopular');
    try {
      const r = await fetch('/api/dracin?action=home');
      const data = await r.json();
      renderRail('railPopular', (data.dramas || []).slice(0, 14));
    } catch (e) {
      document.getElementById('railPopular').innerHTML = `<p class="text-paper/40 text-sm">Gagal memuat drama populer.</p>`;
    }
  }

  async function loadGenres() {
    try {
      const r = await fetch('/api/dracin?action=collections');
      const data = await r.json();
      const select = document.getElementById('genreSelect');
      (data.genres || []).forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.slug;
        opt.textContent = g.name;
        select.appendChild(opt);
      });
    } catch (e) {
      console.error(e);
    }
  }

  function renderPagination(page, hasResults) {
    const el = document.getElementById('pagination');
    el.innerHTML = `
      <button id="prevPage" ${page <= 1 ? 'disabled' : ''} class="px-4 py-2 rounded-full text-sm font-bold border border-white/10 ${page <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:border-amber-400/50 hover:text-amber-300'}">&larr; Sebelumnya</button>
      <span class="text-sm text-paper/60 font-semibold px-2">Halaman ${page}</span>
      <button id="nextPage" ${hasResults ? '' : 'disabled'} class="px-4 py-2 rounded-full text-sm font-bold border border-white/10 ${hasResults ? 'hover:border-amber-400/50 hover:text-amber-300' : 'opacity-30 cursor-not-allowed'}">Selanjutnya &rarr;</button>
    `;
    if (page > 1) document.getElementById('prevPage').addEventListener('click', () => { currentPage--; loadGrid(); });
    if (hasResults) document.getElementById('nextPage').addEventListener('click', () => { currentPage++; loadGrid(); });
  }

  async function loadGrid() {
    gridSkeleton('dracinGrid');
    window.scrollTo({ top: document.getElementById('dracinGrid').offsetTop - 100, behavior: 'smooth' });
    try {
      const url = currentGenre
        ? `/api/dracin?action=movies&genre=${encodeURIComponent(currentGenre)}&page=${currentPage}`
        : `/api/dracin?action=movies&page=${currentPage}`;
      const r = await fetch(url);
      const data = await r.json();
      const results = data.results || [];
      if (results.length === 0) {
        document.getElementById('dracinGrid').innerHTML = `<div class="col-span-full text-center py-20 text-paper/50">Tidak ada drama ditemukan.</div>`;
      } else {
        renderGrid('dracinGrid', results);
      }
      renderPagination(currentPage, results.length > 0);
    } catch (e) {
      document.getElementById('dracinGrid').innerHTML = `<div class="col-span-full text-center py-20 text-crimson-300">Gagal memuat. Silakan coba lagi.</div>`;
    }
  }

  document.getElementById('genreSelect').addEventListener('change', (e) => {
    currentGenre = e.target.value;
    currentPage = 1;
    loadGrid();
  });

  loadPopular();
  loadGenres();
  loadGrid();
})();
