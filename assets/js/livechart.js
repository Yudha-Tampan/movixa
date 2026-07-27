(function () {
  const SEASONS = ['winter', 'spring', 'summer', 'fall'];

  function animeCard(item) {
    const poster = item.poster || item.posterSmall || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
    const title = item.title || '';
    const numberText = item.nextEpisode && item.nextEpisode.numberText ? item.nextEpisode.numberText : (item.episodesText || '');
    const ts = item.nextEpisode && item.nextEpisode.timestamp ? item.nextEpisode.timestamp : null;
    const meta = [item.studios && item.studios[0], item.source].filter(Boolean).join(' · ');
    return `
    <a href="/livechart-detail.html?id=${encodeURIComponent(item.id)}" class="poster-card group block">
      <div class="relative aspect-[2/3] w-full">
        <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" class="w-full h-full object-cover" />
        <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(title)}</h3>
          ${meta ? `<p class="text-[11px] text-paper/60 mt-1">${escapeHtml(meta)}</p>` : ''}
        </div>
        <div class="absolute top-2 right-2"><span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">LiveChart</span></div>
        ${numberText ? `<div class="absolute top-2 left-2"><span data-cd-badge="${ts || ''}" data-cd-label="${escapeHtml(numberText)}" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/90 text-ink">${escapeHtml(numberText)}</span></div>` : ''}
      </div>
    </a>`;
  }

  // Update semua badge countdown yang sedang tampil di grid (card list), tiap detik,
  // memakai timestamp akurat dari API. Badge tanpa timestamp dibiarkan tampilkan teks asli.
  function tickCardBadges() {
    document.querySelectorAll('[data-cd-badge]').forEach((el) => {
      const ts = parseInt(el.dataset.cdBadge, 10);
      const label = el.dataset.cdLabel || '';
      if (!ts) return;
      const short = countdownShortText(ts);
      el.textContent = short ? `${label} · ${short}` : label;
    });
  }
  setInterval(tickCardBadges, 1000);

  function searchResultCard(item) {
    const poster = item.poster || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
    const title = item.title || '';
    const meta = [item.typeText, item.date].filter(Boolean).join(' · ');
    return `
    <a href="/livechart-detail.html?id=${encodeURIComponent(item.id)}" class="poster-card group block">
      <div class="relative aspect-[2/3] w-full">
        <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" class="w-full h-full object-cover" />
        <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(title)}</h3>
          ${meta ? `<p class="text-[11px] text-paper/60 mt-1">${escapeHtml(meta)}</p>` : ''}
        </div>
        <div class="absolute top-2 right-2"><span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">LiveChart</span></div>
      </div>
    </a>`;
  }

  function renderGrid(id, items, cardFn) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!items || items.length === 0) {
      el.innerHTML = `<div class="col-span-full text-center py-20 text-paper/50">Tidak ada anime ditemukan.</div>`;
      return;
    }
    el.innerHTML = items.map(cardFn).join('');
  }

  function currentSeasonYear() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    let season = 'winter';
    if (month >= 4 && month <= 6) season = 'spring';
    else if (month >= 7 && month <= 9) season = 'summer';
    else if (month >= 10 && month <= 12) season = 'fall';
    return { season, year };
  }

  let currentSeason = '';
  let currentYear = '';

  function populateSeasonSelect() {
    const seasonSelect = document.getElementById('seasonSelect');
    const yearSelect = document.getElementById('yearSelect');
    const { season, year } = currentSeasonYear();

    SEASONS.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
      seasonSelect.appendChild(opt);
    });

    for (let y = year + 1; y >= year - 5; y--) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect.appendChild(opt);
    }

    currentSeason = season;
    currentYear = String(year);
    seasonSelect.value = currentSeason;
    yearSelect.value = currentYear;
  }

  async function loadChart() {
    gridSkeleton('chartGrid');
    document.getElementById('chartHeading').textContent = `Musim ${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} ${currentYear}`;
    try {
      const r = await fetch(`/api/livechart?action=home&season=${encodeURIComponent(currentSeason)}&year=${encodeURIComponent(currentYear)}`);
      const data = await r.json();
      renderGrid('chartGrid', data.results || [], animeCard);
    } catch (e) {
      document.getElementById('chartGrid').innerHTML = `<div class="col-span-full text-center py-20 text-crimson-300">Gagal memuat jadwal anime.</div>`;
    }
  }

  async function runSearch(query) {
    const section = document.getElementById('searchSection');
    const chartSection = document.getElementById('chartSection');
    if (!query) {
      section.classList.add('hidden');
      chartSection.classList.remove('hidden');
      return;
    }
    section.classList.remove('hidden');
    chartSection.classList.add('hidden');
    gridSkeleton('searchGrid');
    document.getElementById('searchHeading').textContent = `Hasil untuk "${query}"`;
    try {
      const r = await fetch(`/api/livechart?action=search&q=${encodeURIComponent(query)}`);
      const data = await r.json();
      renderGrid('searchGrid', data.results || [], searchResultCard);
    } catch (e) {
      document.getElementById('searchGrid').innerHTML = `<div class="col-span-full text-center py-20 text-crimson-300">Gagal memuat hasil pencarian.</div>`;
    }
  }

  populateSeasonSelect();

  document.getElementById('seasonSelect').addEventListener('change', (e) => {
    currentSeason = e.target.value;
    loadChart();
  });
  document.getElementById('yearSelect').addEventListener('change', (e) => {
    currentYear = e.target.value;
    loadChart();
  });

  const searchForm = document.getElementById('chartSearchForm');
  const searchInput = document.getElementById('chartSearchInput');
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch(searchInput.value.trim());
  });

  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('q');
  if (qParam) {
    searchInput.value = qParam;
    runSearch(qParam);
  } else {
    loadChart();
  }
})();
