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

  function setPlayerLoading(isLoading) {
    document.getElementById('playerLoading').classList.toggle('hidden', !isLoading);
  }

  function loadIframe(url) {
    if (!url) return;
    setPlayerLoading(true);
    const frame = document.getElementById('videoFrame');
    frame.src = url;
    frame.addEventListener('load', () => setPlayerLoading(false), { once: true });
    // Fallback: kalau event load tidak terpicu (mis. karena kebijakan cross-origin
    // provider embed), tetap sembunyikan loading setelah beberapa detik.
    setTimeout(() => setPlayerLoading(false), 4000);
  }

  async function switchServer(server, btnEl) {
    if (!detail.nonce) {
      alert('Nonce tidak tersedia, tidak bisa mengganti server.');
      return;
    }
    document.querySelectorAll('.server-btn').forEach((b) => {
      b.classList.remove('marquee-gradient', 'text-ink');
      b.classList.add('bg-white/5');
    });
    if (btnEl) {
      btnEl.classList.add('marquee-gradient', 'text-ink');
      btnEl.classList.remove('bg-white/5');
    }

    setPlayerLoading(true);
    try {
      const url = `/api/nontonanime?action=iframe&post_id=${encodeURIComponent(server.post_id)}&nume=${encodeURIComponent(server.nume)}&server=${encodeURIComponent(server.server_type || server.server_name)}&nonce=${encodeURIComponent(detail.nonce)}&ajax_url=${encodeURIComponent(detail.ajax_url || '')}`;
      const r = await fetch(url);
      const data = await r.json();
      if (data.iframe_url) {
        loadIframe(data.iframe_url);
      } else {
        setPlayerLoading(false);
        alert('Gagal memuat server ini. Coba server lain.');
      }
    } catch (e) {
      console.error(e);
      setPlayerLoading(false);
      alert('Gagal memuat server ini. Coba server lain.');
    }
  }

  function renderServers() {
    const section = document.getElementById('serverSection');
    const servers = detail.video_servers || [];
    if (servers.length === 0) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
    const el = document.getElementById('serverList');
    el.innerHTML = servers
      .map(
        (s, i) => `
      <button data-server-idx="${i}" class="server-btn ${s.is_active ? 'marquee-gradient text-ink' : 'bg-white/5'} font-bold text-sm px-4 py-2.5 rounded-full transition-colors hover:opacity-90">
        ${escapeHtml(s.server_name)}
      </button>`
      )
      .join('');

    el.querySelectorAll('.server-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.serverIdx, 10);
        switchServer(servers[idx], btn);
      });
    });
  }

  function renderDownloads() {
    const section = document.getElementById('downloadSection');
    const groups = detail.download_links || [];
    if (groups.length === 0) {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
    document.getElementById('downloadList').innerHTML = groups
      .map(
        (g) => `
      <div>
        <p class="font-bold text-sm text-amber-300 mb-2">${escapeHtml(g.format || 'Unknown')}</p>
        <div class="flex flex-wrap gap-2">
          ${(g.links || [])
            .map(
              (l) => `
            <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors">${escapeHtml(l.label || 'Download')}</a>`
            )
            .join('')}
        </div>
      </div>`
      )
      .join('');
  }

  function render() {
    document.getElementById('pageTitle').textContent = `${detail.title || 'Streaming'} — Movixa`;
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('streamContent').classList.remove('hidden');

    document.getElementById('titleEl').textContent = detail.title || '';

    if (detail.anime_title && detail.anime_link) {
      const animeSlug = extractSlug(detail.anime_link);
      document.getElementById('animeLinkBtn').href = `/nontonanime-detail.html?slug=${encodeURIComponent(animeSlug)}`;
      document.getElementById('animeLinkText').textContent = detail.anime_title;
    }

    if (detail.prev_episode_link) {
      const btn = document.getElementById('prevEpBtn');
      btn.href = `/nontonanime-stream.html?slug=${encodeURIComponent(extractSlug(detail.prev_episode_link))}`;
      btn.classList.remove('hidden');
    }
    if (detail.next_episode_link) {
      const btn = document.getElementById('nextEpBtn');
      btn.href = `/nontonanime-stream.html?slug=${encodeURIComponent(extractSlug(detail.next_episode_link))}`;
      btn.classList.remove('hidden');
    }
    if (detail.all_episodes_link && detail.anime_link) {
      const btn = document.getElementById('allEpsBtn');
      btn.href = `/nontonanime-detail.html?slug=${encodeURIComponent(extractSlug(detail.anime_link))}`;
      btn.classList.remove('hidden');
    }

    if (detail.default_video_url) {
      loadIframe(detail.default_video_url);
    } else {
      setPlayerLoading(false);
    }

    renderServers();
    renderDownloads();
  }

  try {
    const r = await fetch(`/api/nontonanime?action=stream&slug=${encodeURIComponent(slugParam)}`);
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
