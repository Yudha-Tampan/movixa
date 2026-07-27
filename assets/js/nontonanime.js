(function () {
  // Helper: banyak field di sumber NontonAnimeID berupa URL/slug penuh (mis. "https://.../anime/one-piece/").
  // Kita simpan slug murni untuk dipakai di query "slug" pada endpoint detail/stream.
  function extractSlug(link) {
    if (!link) return '';
    return link.replace(/\/$/, '').split('/').pop() || '';
  }

  function animePosterCard(item) {
    const poster = item.image || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
    const title = item.title || '';
    const badge = item.episode || item.current_episode || item.score || item.rating || '';
    const slug = extractSlug(item.link);
    return `
    <a href="/nontonanime-detail.html?slug=${encodeURIComponent(slug)}" class="poster-card group block shrink-0 w-[150px] sm:w-[180px]">
      <div class="relative aspect-[2/3] w-full">
        <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" class="w-full h-full object-cover" />
        <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(title)}</h3>
          ${badge ? `<p class="text-[11px] text-paper/60 mt-1">${escapeHtml(badge)}</p>` : ''}
        </div>
        <div class="absolute top-2 right-2"><span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">Anime</span></div>
      </div>
    </a>`;
  }

  function animePosterGridCard(item) {
    const poster = item.image || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
    const title = item.title || '';
    const meta = [item.type, item.season].filter(Boolean).join(' · ');
    const slug = extractSlug(item.link);
    return `
    <a href="/nontonanime-detail.html?slug=${encodeURIComponent(slug)}" class="poster-card group block">
      <div class="relative aspect-[2/3] w-full">
        <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" class="w-full h-full object-cover" />
        <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(title)}</h3>
          ${meta ? `<p class="text-[11px] text-paper/60 mt-1">${escapeHtml(meta)}</p>` : ''}
        </div>
        <div class="absolute top-2 right-2"><span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">Anime</span></div>
      </div>
    </a>`;
  }

  function renderRail(id, items) {
    const el = document.getElementById(id);
    if (!items || items.length === 0) {
      el.innerHTML = `<p class="text-paper/40 text-sm">Belum ada data.</p>`;
      return;
    }
    el.innerHTML = items.map(animePosterCard).join('');
  }

  function renderGrid(id, items) {
    document.getElementById(id).innerHTML = items.map(animePosterGridCard).join('');
  }

  let currentGenre = '';
  let currentPage = 1;

  async function loadHome() {
    railSkeleton('railLatest');
    try {
      const r = await fetch('/api/nontonanime?action=home');
      const data = await r.json();
      renderRail('railLatest', (data.episode_terbaru || []).slice(0, 14));
    } catch (e) {
      document.getElementById('railLatest').innerHTML = `<p class="text-paper/40 text-sm">Gagal memuat episode terbaru.</p>`;
    }
  }

  async function loadOngoing() {
    railSkeleton('railOngoing');
    try {
      const r = await fetch('/api/nontonanime?action=ongoing&sort=popular');
      const data = await r.json();
      const items = (data || []).slice(0, 14).map((it) => ({
        title: it.title, link: it.link, image: it.image,
        episode: it.current_episode ? `Eps ${it.current_episode}` : ''
      }));
      renderRail('railOngoing', items);
    } catch (e) {
      document.getElementById('railOngoing').innerHTML = `<p class="text-paper/40 text-sm">Gagal memuat anime ongoing.</p>`;
    }
  }

  async function loadGenres() {
    try {
      const r = await fetch('/api/nontonanime?action=genres');
      const data = await r.json();
      const select = document.getElementById('genreSelect');
      (data || []).forEach((g) => {
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
    gridSkeleton('animeGrid');
    window.scrollTo({ top: document.getElementById('animeGrid').offsetTop - 100, behavior: 'smooth' });
    try {
      const url = currentGenre
        ? `/api/nontonanime?action=search&genre=${encodeURIComponent(currentGenre)}&page=${currentPage}`
        : `/api/nontonanime?action=search&page=${currentPage}`;
      const r = await fetch(url);
      const results = await r.json();
      if (!results || results.length === 0) {
        document.getElementById('animeGrid').innerHTML = `<div class="col-span-full text-center py-20 text-paper/50">Tidak ada anime ditemukan.</div>`;
      } else {
        renderGrid('animeGrid', results);
      }
      renderPagination(currentPage, results && results.length > 0);
    } catch (e) {
      document.getElementById('animeGrid').innerHTML = `<div class="col-span-full text-center py-20 text-crimson-300">Gagal memuat. Silakan coba lagi.</div>`;
    }
  }

  document.getElementById('genreSelect').addEventListener('change', (e) => {
    currentGenre = e.target.value;
    currentPage = 1;
    loadGrid();
  });

  loadHome();
  loadOngoing();
  loadGenres();
  loadGrid();
})();
