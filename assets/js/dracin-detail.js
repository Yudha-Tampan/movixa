(async function () {
  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get('slug') || '';
  const idParam = params.get('id') || '';

  if (!slugParam) {
    showError();
    return;
  }

  const fullSlugId = idParam ? `${slugParam}-${idParam}` : slugParam;

  let detail = null;
  let hlsInstance = null;
  let currentEpisodeNumber = 1;

  function showError() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
  }

  function dracinPosterCard(item) {
    const cover = item.cover || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
    return `
    <a href="/dracin-detail.html?slug=${encodeURIComponent(item.slug)}&id=${encodeURIComponent(item.id)}" class="poster-card group block shrink-0 w-[150px] sm:w-[180px]">
      <div class="relative aspect-[2/3] w-full">
        <img src="${cover}" alt="${escapeHtml(item.title)}" loading="lazy" class="w-full h-full object-cover" />
        <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
          <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(item.title)}</h3>
        </div>
      </div>
    </a>`;
  }

  function loadVideo(url) {
    const video = document.getElementById('videoPlayer');
    const loadingEl = document.getElementById('playerLoading');
    loadingEl.classList.remove('hidden');

    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    const isM3u8 = url.includes('.m3u8');

    if (isM3u8 && window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls();
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
        loadingEl.classList.add('hidden');
        video.play().catch(() => {});
      });
      hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
        if (data.fatal) loadingEl.classList.add('hidden');
      });
    } else {
      video.src = url;
      video.addEventListener('loadedmetadata', () => loadingEl.classList.add('hidden'), { once: true });
      video.play().catch(() => {});
    }
  }

  async function playEpisode(episodeUrl, episodeNumber) {
    currentEpisodeNumber = episodeNumber;
    document.getElementById('nowPlayingTitle').textContent = `Episode ${episodeNumber}`;
    highlightActiveEpisode(episodeNumber);

    try {
      const r = await fetch(`/api/dracin?action=play&path=${encodeURIComponent(episodeUrl)}`);
      const data = await r.json();
      const sources = data.videoSources || [];
      if (sources.length === 0) {
        alert('Tidak ada sumber video ditemukan untuk episode ini.');
        return;
      }
      const best = sources.reduce((a, b) => ((b.quality || 0) > (a.quality || 0) ? b : a), sources[0]);
      loadVideo(best.url);

      Store.pushHistory({
        id: detail.id, type: 'dracin', title: `${detail.title} — Episode ${episodeNumber}`,
        year: '', rating: null, genres: (detail.genres || []).map((g) => g.name), poster_url: detail.cover,
        dracinSlug: detail.slug, dracinId: detail.id, episodeUrl, episodeNumber
      });
    } catch (e) {
      console.error(e);
      alert('Gagal memuat video. Silakan coba lagi.');
    }
  }

  function highlightActiveEpisode(episodeNumber) {
    document.querySelectorAll('.ep-btn').forEach((btn) => {
      const isActive = parseInt(btn.dataset.epNumber) === episodeNumber;
      btn.classList.toggle('marquee-gradient', isActive);
      btn.classList.toggle('text-ink', isActive);
      btn.classList.toggle('bg-white/5', !isActive);
    });
  }

  function renderEpisodeList() {
    const el = document.getElementById('episodeList');
    if (!detail.episodes || detail.episodes.length === 0) {
      el.innerHTML = `<p class="col-span-full text-paper/40 text-sm">Belum ada episode tersedia.</p>`;
      return;
    }
    el.innerHTML = detail.episodes
      .map(
        (ep) => `
      <button data-ep-number="${ep.number}" data-ep-url="${escapeHtml(ep.url)}" class="ep-btn bg-white/5 hover:bg-white/10 font-bold text-sm py-2.5 rounded-lg transition-colors">
        ${ep.number}
      </button>`
      )
      .join('');

    el.querySelectorAll('.ep-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        playEpisode(btn.dataset.epUrl, parseInt(btn.dataset.epNumber));
        document.getElementById('watch').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function renderRecommendations() {
    const el = document.getElementById('recommendationsSection');
    if (!detail.recommendations || detail.recommendations.length === 0) return;

    el.innerHTML = detail.recommendations
      .map(
        (section, idx) => `
      <div class="mb-14">
        <div class="eyebrow mb-2">Rekomendasi</div>
        <h2 class="font-display text-2xl sm:text-3xl mb-6">${escapeHtml(section.sectionTitle)}</h2>
        <div id="recRail${idx}" class="rail flex gap-4 overflow-x-auto no-scrollbar pb-2"></div>
      </div>
    `
      )
      .join('');

    detail.recommendations.forEach((section, idx) => {
      document.getElementById(`recRail${idx}`).innerHTML = section.movies.map(dracinPosterCard).join('');
    });
  }

  function renderWatchlistBtn() {
    const btn = document.getElementById('watchlistBtn');
    const label = document.getElementById('watchlistLabel');
    const inList = Store.isInWatchlist(detail.id, 'dracin');
    label.textContent = inList ? 'Tersimpan' : 'Simpan';
    btn.classList.toggle('marquee-gradient', inList);
    btn.classList.toggle('text-ink', inList);

    btn.addEventListener('click', () => {
      const added = Store.toggleWatchlist({
        id: detail.id, type: 'dracin', title: detail.title, year: '',
        rating: null, genres: (detail.genres || []).map((g) => g.name), poster_url: detail.cover
      });
      label.textContent = added ? 'Tersimpan' : 'Simpan';
      btn.classList.toggle('marquee-gradient', added);
      btn.classList.toggle('text-ink', added);
    });
  }

  function render() {
    document.getElementById('pageTitle').textContent = `${detail.title} — Movixa`;
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('detailContent').classList.remove('hidden');

    if (detail.cover) {
      document.getElementById('backdropImg').style.backgroundImage = `url('${detail.cover}')`;
    }
    const posterImg = document.getElementById('posterImg');
    posterImg.src = detail.cover || 'https://placehold.co/400x600/12151f/eae6dd?text=No+Image';
    posterImg.alt = detail.title;

    document.getElementById('titleEl').textContent = detail.title;
    document.getElementById('synopsisEl').textContent = detail.synopsis || 'Sinopsis belum tersedia.';

    const genreTags = document.getElementById('genreTags');
    genreTags.innerHTML = `
      <span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">Dracin</span>
      ${(detail.genres || []).map((g) => `<span class="text-xs text-paper/50 border border-white/10 rounded-full px-2.5 py-0.5">${escapeHtml(g.name)}</span>`).join('')}
    `;

    document.getElementById('epsCountRow').innerHTML = `
      <div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Total Episode</span>${detail.episodes ? detail.episodes.length : 0}</div>
    `;

    renderEpisodeList();
    renderRecommendations();
    renderWatchlistBtn();

    if (detail.episodes && detail.episodes.length > 0) {
      playEpisode(detail.episodes[0].url, detail.episodes[0].number);
    }
  }

  try {
    const r = await fetch(`/api/dracin?action=detail&slug=${encodeURIComponent(fullSlugId)}`);
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
