(async function () {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id') || '';

  if (!idParam) {
    showError();
    return;
  }

  let detail = null;

  function showError() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
  }

  const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // startDate dari API bisa berupa ISO penuh ("2027-01-15"), ISO sebagian
  // ("2027-01" / "2027"), atau teks status apa adanya ("TBA", "Winter 2027").
  // Fungsi ini hanya memformat pola ISO yang valid; selain itu ditampilkan
  // persis seperti aslinya supaya tidak salah menampilkan informasi.
  function formatStartDate(raw) {
    if (!raw) return raw;
    const isoFull = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoFull) {
      const [, y, m, d] = isoFull;
      return `${parseInt(d, 10)} ${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
    }
    const isoMonth = raw.match(/^(\d{4})-(\d{2})$/);
    if (isoMonth) {
      const [, y, m] = isoMonth;
      return `${MONTHS_ID[parseInt(m, 10) - 1]} ${y}`;
    }
    const isoYear = raw.match(/^(\d{4})$/);
    if (isoYear) return raw;
    return raw;
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
    if (detail.alternateTitles && detail.alternateTitles.length > 0) {
      document.getElementById('altTitleEl').textContent = detail.alternateTitles.join(' · ');
      document.getElementById('altTitleEl').classList.remove('hidden');
    }
    document.getElementById('synopsisEl').textContent = detail.description || 'Sinopsis belum tersedia.';

    const genreTags = document.getElementById('genreTags');
    genreTags.innerHTML = `
      <span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">LiveChart</span>
      ${(detail.genres || []).map((g) => `<span class="text-xs text-paper/50 border border-white/10 rounded-full px-2.5 py-0.5">${escapeHtml(g)}</span>`).join('')}
    `;

    document.getElementById('metaRow').innerHTML = `
      ${detail.status ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Status</span>${escapeHtml(detail.status)}</div>` : ''}
      ${detail.startDate ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Tanggal Tayang</span>${escapeHtml(formatStartDate(detail.startDate))}</div>` : ''}
      ${detail.studios && detail.studios.length ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Studio</span>${escapeHtml(detail.studios.join(', '))}</div>` : ''}
      ${detail.rating ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Skor</span>★ ${escapeHtml(String(detail.rating))}${detail.ratingCount ? ` (${detail.ratingCount})` : ''}</div>` : ''}
      ${detail.episodesCount ? `<div><span class="text-paper/40 block text-xs uppercase tracking-wider mb-0.5">Total Episode</span>${detail.episodesCount}</div>` : ''}
    `;

    let hasActiveCountdown = false;
    if (detail.nextEpisode && detail.nextEpisode.numberText) {
      const banner = document.getElementById('countdownBanner');
      const textEl = document.getElementById('countdownText');
      const grid = document.getElementById('countdownGrid');
      banner.classList.remove('hidden');
      textEl.textContent = detail.nextEpisode.numberText;

      if (detail.nextEpisode.timestamp) {
        hasActiveCountdown = true;
        grid.classList.remove('hidden');
        startFullCountdown(grid, detail.nextEpisode.timestamp, () => {
          textEl.textContent = `${detail.nextEpisode.numberText} · Sudah tayang`;
          grid.classList.add('hidden');
        });
      } else {
        // Tidak ada timestamp akurat dari sumber, sembunyikan grid angka
        // supaya tidak menampilkan waktu yang salah/tidak akurat.
        grid.classList.add('hidden');
      }
    }

    // Kotak jadwal ringkas (mis. "EP1 · TV (JP)" + tanggal tayang / status TBA).
    // Hanya ditampilkan kalau TIDAK ada countdown angka yang sedang aktif di atas,
    // supaya informasinya tidak dobel/redundan untuk anime yang sudah tayang berkala.
    const scheduleBox = document.getElementById('scheduleBox');
    const epTextRaw = (detail.nextEpisode && detail.nextEpisode.numberText) || 'EP1 · TV (JP)';
    const timeText = detail.startDate ? formatStartDate(detail.startDate) : (detail.status || null);
    if (timeText && !hasActiveCountdown) {
      scheduleBox.classList.remove('hidden');
      document.getElementById('scheduleEpText').textContent = epTextRaw;
      document.getElementById('scheduleTimeText').textContent = timeText;
    }

    if (detail.hashtags && detail.hashtags.length > 0) {
      document.getElementById('hashtagRow').innerHTML = detail.hashtags
        .map((h) => `<span class="text-xs text-amber-300/80 font-semibold">${escapeHtml(h)}</span>`)
        .join('');
      document.getElementById('hashtagRow').classList.remove('hidden');
    }

    renderVideos();
    renderStreams();
  }

  function renderVideos() {
    const el = document.getElementById('videoList');
    const videos = detail.videos || [];
    if (videos.length === 0) {
      document.getElementById('videoSection').classList.add('hidden');
      return;
    }
    el.innerHTML = videos
      .map((v) => {
        const embed = v.embedUrl || (v.youtubeUrl ? v.youtubeUrl.replace('watch?v=', 'embed/') : '');
        return `
      <div class="shrink-0 w-[280px] sm:w-[340px] rounded-xl overflow-hidden bg-ink-2 marquee-ring">
        <div class="relative aspect-video w-full bg-black">
          ${embed ? `<iframe class="w-full h-full" src="${embed}" allowfullscreen frameborder="0" loading="lazy"></iframe>` : ''}
        </div>
        <div class="p-3">
          <p class="font-bold text-sm line-clamp-1">${escapeHtml(v.title || 'Promotional Video')}</p>
          ${v.duration ? `<p class="text-xs text-paper/40 mt-0.5">${escapeHtml(v.duration)}</p>` : ''}
        </div>
      </div>`;
      })
      .join('');
    enableDragScroll(el);
  }

  function renderCharacters(chars) {
    const section = document.getElementById('characterSection');
    const el = document.getElementById('characterList');
    if (!chars || chars.length === 0) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
    el.innerHTML = chars
      .map((c) => {
        const roleLabel = c.role === 'MAIN' ? 'Main Character' : c.role === 'SUPPORTING' ? 'Supporting' : c.role === 'BACKGROUND' ? 'Background' : (c.role || '');
        const roleColor = c.role === 'MAIN' ? 'text-amber-300' : 'text-paper/40';
        return `
      <div class="shrink-0 w-[130px] sm:w-[150px] select-none">
        <div class="aspect-[3/4] w-full rounded-xl overflow-hidden bg-ink-2 marquee-ring mb-2">
          <img src="${c.image}" alt="${escapeHtml(c.name)}" loading="lazy" draggable="false" class="w-full h-full object-cover pointer-events-none" />
        </div>
        <p class="font-bold text-xs leading-tight line-clamp-2">${escapeHtml(c.name)}</p>
        ${roleLabel ? `<p class="text-[10px] uppercase tracking-wider mt-0.5 ${roleColor}">${escapeHtml(roleLabel)}</p>` : ''}
      </div>`;
      })
      .join('');
    enableDragScroll(el);
  }

  function renderStreams() {
    const el = document.getElementById('streamList');
    const streams = detail.streams || [];
    if (streams.length === 0) {
      document.getElementById('streamSection').classList.add('hidden');
      return;
    }
    el.innerHTML = streams
      .map(
        (s) => `
      <a href="${s.link}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3.5 transition-colors">
        <div class="min-w-0">
          <p class="font-bold text-sm">${escapeHtml(s.name)}</p>
          ${s.desc ? `<p class="text-xs text-paper/50 mt-0.5 line-clamp-1">${escapeHtml(s.desc)}</p>` : ''}
        </div>
        <svg class="w-4 h-4 text-paper/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
      </a>`
      )
      .join('');
  }

  async function loadCharacters() {
    const searchTitle = detail.title || (detail.alternateTitles && detail.alternateTitles[0]);
    if (!searchTitle) {
      document.getElementById('characterSection').classList.add('hidden');
      return;
    }
    try {
      const r = await fetch(`/api/livechart?action=characters&title=${encodeURIComponent(searchTitle)}`);
      const data = await r.json();
      renderCharacters(data && data.characters ? data.characters : []);
    } catch (e) {
      console.error(e);
      document.getElementById('characterSection').classList.add('hidden');
    }
  }

  try {
    const r = await fetch(`/api/livechart?action=detail&id=${encodeURIComponent(idParam)}`);
    detail = await r.json();
    if (!detail || detail.error || !detail.title) {
      showError();
      return;
    }
    render();
    // Karakter diambil dari sumber terpisah (AniList) dan tidak menghambat
    // tampilnya info utama, jadi dipanggil belakangan secara independen.
    loadCharacters();
  } catch (e) {
    console.error(e);
    showError();
  }
})();
