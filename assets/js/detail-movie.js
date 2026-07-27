(async function () {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') === 'tv' ? 'tv' : 'movie';
  const id = parseInt(params.get('id'));

  const SERVER_LABELS = {
    Server_1_VidCore: 'VidCore',
    Server_2_VidGod: 'VidGod',
    Server_3_VidNest: 'VidNest',
    Server_4_VidFast: 'VidFast',
    Server_5_VidSrcEmbed: 'VidSrc',
    Server_6_VidEasy: 'VidEasy'
  };

  if (!id || isNaN(id)) {
    showError();
    return;
  }

  let detail = null;
  let currentSeason = 1;
  let currentEpisode = 1;
  let currentServer = 'Server_5_VidSrcEmbed';

  function showError() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
  }

  function getCurrentStreams() {
    if (type === 'movie') return detail.streams;
    const season = detail.seasons.find((s) => s.season_number === currentSeason);
    if (!season) return detail.streams;
    const ep = season.episodes.find((e) => e.episode_number === currentEpisode);
    return ep ? ep.streams : detail.streams;
  }

  function renderServerPills() {
    const streams = getCurrentStreams();
    const el = document.getElementById('serverPills');
    el.innerHTML = Object.keys(streams)
      .map((server) => `
        <button data-server="${server}" class="server-pill ${server === currentServer ? 'active' : ''} px-4 py-2 rounded-lg text-sm font-bold">
          ${SERVER_LABELS[server] || server}
        </button>
      `)
      .join('');

    el.querySelectorAll('.server-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentServer = btn.dataset.server;
        updatePlayer();
        el.querySelectorAll('.server-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function updatePlayer() {
    const streams = getCurrentStreams();
    const url = streams[currentServer] || Object.values(streams)[0];
    document.getElementById('playerFrame').src = url;

    Store.pushHistory({
      id: detail.id,
      type: detail.type,
      title: detail.title,
      year: detail.year,
      rating: detail.rating,
      genres: detail.genres,
      poster_url: detail.poster_url
    });
  }

  function renderEpisodeSelectors() {
    if (type !== 'tv' || !detail.seasons || detail.seasons.length === 0) return;
    document.getElementById('episodeSelectors').classList.remove('hidden');
    document.getElementById('episodeSelectors').classList.add('flex');

    const seasonSelect = document.getElementById('seasonSelect');
    seasonSelect.innerHTML = detail.seasons
      .map((s) => `<option value="${s.season_number}">${escapeHtml(s.name)}</option>`)
      .join('');
    seasonSelect.value = currentSeason;

    function populateEpisodes() {
      const season = detail.seasons.find((s) => s.season_number === parseInt(seasonSelect.value));
      const episodeSelect = document.getElementById('episodeSelect');
      if (!season) return;
      episodeSelect.innerHTML = season.episodes
        .map((e) => `<option value="${e.episode_number}">Ep ${e.episode_number}: ${escapeHtml(e.name)}</option>`)
        .join('');
      episodeSelect.value = currentEpisode;
    }
    populateEpisodes();

    seasonSelect.addEventListener('change', () => {
      currentSeason = parseInt(seasonSelect.value);
      currentEpisode = 1;
      populateEpisodes();
      renderServerPills();
      updatePlayer();
    });

    document.getElementById('episodeSelect').addEventListener('change', (e) => {
      currentEpisode = parseInt(e.target.value);
      renderServerPills();
      updatePlayer();
    });
  }

  function renderSeasonsAccordion() {
    if (type !== 'tv' || !detail.seasons || detail.seasons.length === 0) return;
    document.getElementById('seasonsSection').classList.remove('hidden');
    const el = document.getElementById('seasonsAccordion');

    el.innerHTML = detail.seasons
      .map((s, idx) => `
        <div class="border border-white/10 rounded-xl overflow-hidden">
          <button data-season-toggle="${idx}" class="w-full flex items-center justify-between p-4 bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left">
            <div class="flex items-center gap-3">
              <span class="font-display text-lg text-amber-300">${escapeHtml(s.name)}</span>
              <span class="text-xs text-paper/40">${s.episodes.length} episodes · ${s.air_date}</span>
            </div>
            <svg class="w-5 h-5 transition-transform accordion-chevron" data-chevron="${idx}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <div data-season-panel="${idx}" class="hidden p-4 pt-0 space-y-2">
            ${s.episodes
              .map(
                (ep) => `
              <button data-ep-season="${s.season_number}" data-ep-number="${ep.episode_number}" class="ep-jump-btn w-full flex gap-3 items-start p-3 rounded-lg hover:bg-white/5 transition-colors text-left">
                <img src="${ep.still_path || 'https://placehold.co/160x90/12151f/eae6dd?text=No+Preview'}" class="w-24 sm:w-32 aspect-video object-cover rounded-md shrink-0" loading="lazy" alt="" />
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-bold text-sm">Ep ${ep.episode_number}. ${escapeHtml(ep.name)}</span>
                  </div>
                  <p class="text-xs text-paper/50 clamp-2">${escapeHtml(ep.overview) || 'No description available.'}</p>
                  <p class="text-[11px] text-paper/30 mt-1">${ep.air_date} · ⭐ ${ep.rating}</p>
                </div>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `)
      .join('');

    el.querySelectorAll('[data-season-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.seasonToggle;
        const panel = el.querySelector(`[data-season-panel="${idx}"]`);
        const chevron = el.querySelector(`[data-chevron="${idx}"]`);
        panel.classList.toggle('hidden');
        chevron.classList.toggle('rotate-180');
      });
    });

    el.querySelectorAll('.ep-jump-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentSeason = parseInt(btn.dataset.epSeason);
        currentEpisode = parseInt(btn.dataset.epNumber);
        document.getElementById('seasonSelect').value = currentSeason;
        const episodeSelect = document.getElementById('episodeSelect');
        const season = detail.seasons.find((s) => s.season_number === currentSeason);
        episodeSelect.innerHTML = season.episodes.map((e) => `<option value="${e.episode_number}">Ep ${e.episode_number}: ${escapeHtml(e.name)}</option>`).join('');
        episodeSelect.value = currentEpisode;
        renderServerPills();
        updatePlayer();
        document.getElementById('watch').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function renderCast() {
    const el = document.getElementById('castRail');
    if (!detail.cast || detail.cast.length === 0) {
      document.getElementById('castSection').classList.add('hidden');
      return;
    }
    el.innerHTML = detail.cast
      .map(
        (c) => `
      <div class="shrink-0 w-28 text-center">
        <div class="w-24 h-24 mx-auto rounded-full overflow-hidden bg-ink-2 mb-2 marquee-ring">
          <img src="${c.profile_url || 'https://placehold.co/200x200/12151f/eae6dd?text=%3F'}" class="w-full h-full object-cover" loading="lazy" alt="${escapeHtml(c.name)}" />
        </div>
        <p class="text-sm font-bold clamp-2">${escapeHtml(c.name)}</p>
        <p class="text-xs text-paper/40 clamp-2">${escapeHtml(c.character)}</p>
      </div>
    `
      )
      .join('');
  }

  function renderWatchlistBtn() {
    const btn = document.getElementById('watchlistBtn');
    const label = document.getElementById('watchlistLabel');
    const inList = Store.isInWatchlist(detail.id, detail.type);
    label.textContent = inList ? 'In My List' : 'Add to List';
    btn.classList.toggle('marquee-gradient', inList);
    btn.classList.toggle('text-ink', inList);

    btn.addEventListener('click', () => {
      const added = Store.toggleWatchlist({
        id: detail.id, type: detail.type, title: detail.title, year: detail.year,
        rating: detail.rating, genres: detail.genres, poster_url: detail.poster_url
      });
      label.textContent = added ? 'In My List' : 'Add to List';
      btn.classList.toggle('marquee-gradient', added);
      btn.classList.toggle('text-ink', added);
    });
  }

  function render() {
    document.getElementById('pageTitle').textContent = `${detail.title} — Movixa`;
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('detailContent').classList.remove('hidden');

    if (detail.backdrop_url) {
      document.getElementById('backdropImg').style.backgroundImage = `url('${detail.backdrop_url}')`;
    }
    const posterImg = document.getElementById('posterImg');
    posterImg.src = detail.poster_url || 'https://placehold.co/400x600/12151f/eae6dd?text=No+Image';
    posterImg.alt = detail.title;

    document.getElementById('titleEl').textContent = detail.title;
    document.getElementById('taglineEl').textContent = detail.tagline || '';
    document.getElementById('overviewEl').textContent = detail.overview || 'No synopsis available.';

    const metaTags = document.getElementById('metaTags');
    metaTags.innerHTML = `
      ${reelBadge(detail.rating)}
      ${typeTag(detail.type)}
      <span class="text-paper/60 text-sm font-semibold">${detail.year}</span>
      ${detail.status ? `<span class="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-crimson-400/15 text-crimson-300">${escapeHtml(detail.status)}</span>` : ''}
      ${(detail.genres || []).slice(0, 4).map((g) => `<span class="text-xs text-paper/50 border border-white/10 rounded-full px-2.5 py-0.5">${escapeHtml(g)}</span>`).join('')}
    `;

    const creditsRow = document.getElementById('creditsRow');
    let creditsHtml = '';
    if (type === 'movie') {
      if (detail.directors && detail.directors.length) {
        creditsHtml += `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Director</span>${escapeHtml(detail.directors.join(', '))}</div>`;
      }
      if (detail.runtime_minutes) {
        creditsHtml += `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Runtime</span>${detail.runtime_minutes} min</div>`;
      }
    } else {
      if (detail.creators && detail.creators.length) {
        creditsHtml += `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Creator</span>${escapeHtml(detail.creators.join(', '))}</div>`;
      }
      creditsHtml += `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Seasons</span>${detail.number_of_seasons}</div>`;
      creditsHtml += `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Episodes</span>${detail.number_of_episodes}</div>`;
    }
    creditsRow.innerHTML = creditsHtml;

    renderEpisodeSelectors();
    renderServerPills();
    updatePlayer();
    renderCast();
    renderSeasonsAccordion();
    renderWatchlistBtn();

    const similarItems = type === 'movie' ? detail.similar_movies : detail.similar_shows;
    document.getElementById('similarHeading').textContent = type === 'movie' ? 'More Movies Like This' : 'More Series Like This';
    if (similarItems && similarItems.length > 0) {
      rail('similarRail', similarItems);
    } else {
      document.getElementById('similarRail').parentElement.classList.add('hidden');
    }
  }

  try {
    detail = await API.detail(type, id);
    if (!detail || detail.error) {
      showError();
      return;
    }
    render();
  } catch (e) {
    console.error(e);
    showError();
  }
})();
