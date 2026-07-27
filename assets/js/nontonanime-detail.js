(async function () {
  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get('slug') || '';

  if (!slugParam) {
    showError();
    return;
  }

  let detail = null;

  function showError() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
  }

  function extractSlug(link) {
    if (!link) return '';
    return link.replace(/\/$/, '').split('/').pop() || '';
  }

  function animePosterCard(item) {
    const poster = item.image || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
    const title = item.title || '';
    const slug = extractSlug(item.link);
    return `
    <a href="/nontonanime-detail.html?slug=${encodeURIComponent(slug)}" class="poster-card group block shrink-0 w-[150px] sm:w-[180px]">
      <div class="relative aspect-[2/3] w-full">
        <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy" class="w-full h-full object-cover" />
        <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(title)}</h3>
        </div>
      </div>
    </a>`;
  }

  function renderEpisodeList() {
    const el = document.getElementById('episodeList');
    const episodes = detail.episodes || [];
    if (episodes.length === 0) {
      el.innerHTML = `<p class="col-span-full text-paper/40 text-sm">Belum ada episode tersedia.</p>`;
      return;
    }
    // Episode biasanya tersusun terbaru-lebih-dulu di sumber; tampilkan apa adanya
    // sesuai urutan dari server supaya konsisten dengan situs asli.
    el.innerHTML = episodes
      .map((ep) => {
        const epSlug = extractSlug(ep.link);
        return `
      <a href="/nontonanime-stream.html?slug=${encodeURIComponent(epSlug)}" class="flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors">
        <div class="min-w-0">
          <p class="font-bold text-sm truncate">${escapeHtml(ep.title || 'Episode')}</p>
          ${ep.date ? `<p class="text-xs text-paper/40 mt-0.5">${escapeHtml(ep.date)}</p>` : ''}
        </div>
        <svg class="w-4 h-4 text-amber-300 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      </a>`;
      })
      .join('');
  }

  function renderRecommendations() {
    const el = document.getElementById('recommendationsSection');
    const items = detail.recommended_series || [];
    if (items.length === 0) return;
    el.innerHTML = `
      <div class="eyebrow mb-2">Rekomendasi</div>
      <h2 class="font-display text-2xl sm:text-3xl mb-6">Anime Serupa</h2>
      <div id="recRail" class="rail flex gap-4 overflow-x-auto no-scrollbar pb-2"></div>
    `;
    document.getElementById('recRail').innerHTML = items.map(animePosterCard).join('');
  }

  function render() {
    document.getElementById('pageTitle').textContent = `${detail.title} — Movixa`;
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('detailContent').classList.remove('hidden');

    const poster = detail.poster || 'https://placehold.co/400x600/12151f/eae6dd?text=No+Image';
    document.getElementById('backdropImg').style.backgroundImage = `url('${poster}')`;
    const posterImg = document.getElementById('posterImg');
    posterImg.src = poster;
    posterImg.alt = detail.title;

    document.getElementById('titleEl').textContent = detail.title;
    document.getElementById('synopsisEl').textContent = detail.synopsis || 'Sinopsis belum tersedia.';

    const genreNames = (detail.genres || []).map((g) => (typeof g === 'string' ? g : g.name)).filter(Boolean);
    document.getElementById('genreTags').innerHTML = `
      <span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">Anime</span>
      ${genreNames.map((g) => `<span class="text-xs text-paper/50 border border-white/10 rounded-full px-2.5 py-0.5">${escapeHtml(g)}</span>`).join('')}
    `;

    document.getElementById('metaRow').innerHTML = `
      ${detail.status ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Status</span>${escapeHtml(detail.status)}</div>` : ''}
      ${detail.score ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Skor</span>★ ${escapeHtml(detail.score)}</div>` : ''}
      ${detail.season ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Musim</span>${escapeHtml(detail.season)}</div>` : ''}
      ${detail.total_episodes ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Episode</span>${escapeHtml(detail.total_episodes)}</div>` : ''}
      ${detail.episode_duration ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Durasi</span>${escapeHtml(detail.episode_duration)}</div>` : ''}
      ${detail.type ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Tipe</span>${escapeHtml(detail.type)}</div>` : ''}
    `;

    if (detail.episodes && detail.episodes.length > 0) {
      const firstEpSlug = extractSlug(detail.episodes[detail.episodes.length - 1].link || detail.episodes[0].link);
      document.getElementById('watchFirstBtn').href = `/nontonanime-stream.html?slug=${encodeURIComponent(firstEpSlug)}`;
    }

    if (detail.trailer) {
      const trailerBtn = document.getElementById('trailerBtn');
      trailerBtn.href = detail.trailer;
      trailerBtn.classList.remove('hidden');
    }

    renderEpisodeList();
    renderRecommendations();
  }

  try {
    const r = await fetch(`/api/nontonanime?action=detail&slug=${encodeURIComponent(slugParam)}`);
    detail = await r.json();
    if (!detail || detail.error || !detail.title) {
      showError();
      return;
    }
    render();
  } catch (e) {
    console.error(e);
    showError();
  }
})();
