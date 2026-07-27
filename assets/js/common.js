
const API = {
  async home() {
    const r = await fetch('/api/home');
    if (!r.ok) throw new Error('Failed to load home');
    return r.json();
  },
  async movies(filter = 'popular', page = 1) {
    const r = await fetch(`/api/movies?filter=${filter}&page=${page}`);
    if (!r.ok) throw new Error('Failed to load movies');
    return r.json();
  },
  async tv(filter = 'popular', page = 1) {
    const r = await fetch(`/api/tv?filter=${filter}&page=${page}`);
    if (!r.ok) throw new Error('Failed to load tv shows');
    return r.json();
  },
  async topImdb(type = 'movie', page = 1) {
    const r = await fetch(`/api/top-imdb?type=${type}&page=${page}`);
    if (!r.ok) throw new Error('Failed to load top imdb');
    return r.json();
  },
  async search(query, page = 1) {
    const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}`);
    if (!r.ok) throw new Error('Search failed');
    return r.json();
  },
  async detail(type, id) {
    const r = await fetch(`/api/detail?type=${type}&id=${id}`);
    if (!r.ok) throw new Error('Failed to load detail');
    return r.json();
  }
};

const Store = {
  KEY_HISTORY: 'hura_history',
  KEY_LIST: 'hura_watchlist',

  getHistory() {
    try { return JSON.parse(localStorage.getItem(this.KEY_HISTORY)) || []; } catch { return []; }
  },
  pushHistory(item) {
    let hist = this.getHistory().filter((h) => !(h.id === item.id && h.type === item.type));
    hist.unshift({ ...item, watched_at: Date.now() });
    hist = hist.slice(0, 40);
    localStorage.setItem(this.KEY_HISTORY, JSON.stringify(hist));
  },
  getWatchlist() {
    try { return JSON.parse(localStorage.getItem(this.KEY_LIST)) || []; } catch { return []; }
  },
  toggleWatchlist(item) {
    let list = this.getWatchlist();
    const exists = list.find((h) => h.id === item.id && h.type === item.type);
    if (exists) {
      list = list.filter((h) => !(h.id === item.id && h.type === item.type));
    } else {
      list.unshift({ ...item, added_at: Date.now() });
    }
    localStorage.setItem(this.KEY_LIST, JSON.stringify(list));
    return !exists;
  },
  isInWatchlist(id, type) {
    return this.getWatchlist().some((h) => h.id === id && h.type === type);
  }
};

function starIcon(extraClass = '') {
  return `<svg class="w-3.5 h-3.5 ${extraClass}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z"/></svg>`;
}

function reelBadge(rating) {
  return `<span class="reel-badge text-xs font-bold text-amber-100">${starIcon()}${rating ? rating.toFixed(1) : 'N/A'}</span>`;
}

function typeTag(type) {
  const labels = { tv: 'Series', movie: 'Film', anime: 'Anime', dracin: 'Dracin' };
  const label = labels[type] || 'Film';
  return `<span class="text-[10px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/10 text-paper/80">${label}</span>`;
}

function posterCard(item) {
  const poster = item.poster_url || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
  const genres = (item.genres || []).slice(0, 2).join(' • ');
  return `
  <a href="/detail-movie.html?type=${item.type}&id=${item.id}" class="poster-card group block shrink-0 w-[150px] sm:w-[180px]">
    <div class="relative aspect-[2/3] w-full">
      <img src="${poster}" alt="${escapeHtml(item.title)}" loading="lazy" class="w-full h-full object-cover" />
      <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
        <div class="flex items-center gap-1.5 mb-1.5">${reelBadge(item.rating)}</div>
        <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(item.title)}</h3>
        <p class="text-[11px] text-paper/60 mt-1">${item.year || ''}${genres ? ' · ' + genres : ''}</p>
      </div>
      <div class="absolute top-2 right-2">${typeTag(item.type)}</div>
    </div>
  </a>`;
}

function itemDetailUrl(item) {
  if (item.type === 'anime' || item.type === 'livechart') return `/livechart-detail.html?id=${encodeURIComponent(item.id)}`;
  if (item.type === 'dracin') return `/dracin-detail.html?slug=${encodeURIComponent(item.id)}`;
  return `/detail-movie.html?type=${item.type}&id=${item.id}`;
}

function posterGridCard(item) {
  const poster = item.poster_url || 'https://placehold.co/500x750/12151f/eae6dd?text=No+Image';
  const genres = (item.genres || []).slice(0, 2).join(' • ');
  const rankBadge = item.imdb_rank
    ? `<span class="absolute top-2 left-2 z-10 font-display text-2xl text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">#${item.imdb_rank}</span>`
    : '';
  return `
  <a href="${itemDetailUrl(item)}" class="poster-card group block">
    <div class="relative aspect-[2/3] w-full">
      ${rankBadge}
      <img src="${poster}" alt="${escapeHtml(item.title)}" loading="lazy" class="w-full h-full object-cover" />
      <div class="poster-overlay absolute inset-0 flex flex-col justify-end p-3">
        <div class="flex items-center gap-1.5 mb-1.5">${reelBadge(item.rating)}</div>
        <h3 class="font-display text-base leading-tight text-paper line-clamp-2">${escapeHtml(item.title)}</h3>
        <p class="text-[11px] text-paper/60 mt-1">${item.year || ''}${genres ? ' · ' + genres : ''}</p>
      </div>
      <div class="absolute top-2 right-2">${typeTag(item.type)}</div>
    </div>
  </a>`;
}

function skeletonCard() {
  return `<div class="shrink-0 w-[150px] sm:w-[180px] aspect-[2/3] rounded-[0.9rem] skeleton"></div>`;
}

function skeletonGridCard() {
  return `<div class="aspect-[2/3] rounded-[0.9rem] skeleton"></div>`;
}

// --- Countdown akurat berbasis timestamp Unix (detik) ---
// timestamp harus dalam detik (Unix epoch), sesuai data-timestamp/data-countdown-bar-timestamp
// hasil scraping LiveChart. Semua perhitungan pakai Date.now() browser saat ini,
// jadi selalu sinkron dengan waktu asli, bukan teks statis.
function countdownParts(timestampSeconds) {
  if (!timestampSeconds) return null;
  const targetMs = timestampSeconds * 1000;
  const diffMs = targetMs - Date.now();
  const past = diffMs <= 0;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);
  return { days, hours, minutes, seconds, past, diffMs };
}

function countdownShortText(timestampSeconds) {
  const p = countdownParts(timestampSeconds);
  if (!p) return '';
  if (p.past) return 'Sudah tayang';
  if (p.days > 0) return `${p.days}h ${p.hours}j`;
  if (p.hours > 0) return `${p.hours}j ${p.minutes}m`;
  return `${p.minutes}m ${p.seconds}d`;
}

// Merender + auto-update countdown penuh (days/hours/minutes/seconds) tiap detik ke dalam elemen container.
// container harus punya 4 child dengan [data-cd="days|hours|minutes|seconds"].
// Otomatis berhenti sendiri kalau elemen sudah lepas dari DOM (hemat resource, cegah memory leak).
function startFullCountdown(container, timestampSeconds, onExpire) {
  if (!container || !timestampSeconds) return;
  const nodes = {
    days: container.querySelector('[data-cd="days"]'),
    hours: container.querySelector('[data-cd="hours"]'),
    minutes: container.querySelector('[data-cd="minutes"]'),
    seconds: container.querySelector('[data-cd="seconds"]'),
  };

  function tick() {
    if (!document.body.contains(container)) {
      clearInterval(timer);
      return;
    }
    const p = countdownParts(timestampSeconds);
    if (!p) return;
    if (p.past) {
      clearInterval(timer);
      if (typeof onExpire === 'function') onExpire();
      return;
    }
    if (nodes.days) nodes.days.textContent = String(p.days);
    if (nodes.hours) nodes.hours.textContent = String(p.hours);
    if (nodes.minutes) nodes.minutes.textContent = String(p.minutes);
    if (nodes.seconds) nodes.seconds.textContent = String(p.seconds);
  }

  tick();
  const timer = setInterval(tick, 1000);
  return timer;
}

// Aktifkan drag-to-scroll pakai mouse untuk elemen carousel horizontal (class .rail).
// Di perangkat mobile, scroll horizontal dengan jari (touch) sudah native dari browser
// tanpa perlu JS tambahan; fungsi ini khusus menambah dukungan drag pakai mouse di desktop,
// jadi tidak perlu tombol panah kiri/kanan sama sekali.
function enableDragScroll(el) {
  if (!el || el.dataset.dragScrollBound) return;
  el.dataset.dragScrollBound = '1';

  let isDown = false;
  let startX = 0;
  let scrollLeftStart = 0;
  let moved = false;

  el.addEventListener('mousedown', (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX - el.offsetLeft;
    scrollLeftStart = el.scrollLeft;
  });

  el.addEventListener('mouseleave', () => { isDown = false; });
  el.addEventListener('mouseup', () => { isDown = false; });

  el.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - startX;
    if (Math.abs(walk) > 5) moved = true;
    el.scrollLeft = scrollLeftStart - walk;
  });

  // Cegah link ikut ke-klik kalau user habis drag (bukan sekadar tap/klik biasa).
  el.addEventListener('click', (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function rail(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(posterCard).join('');
}

function grid(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.map(posterGridCard).join('');
}

function railSkeleton(id, count = 8) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = Array(count).fill(0).map(skeletonCard).join('');
}

function gridSkeleton(id, count = 18) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = Array(count).fill(0).map(skeletonGridCard).join('');
}

function initNavbar() {
  const btn = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }

  const scrollHeader = document.getElementById('siteHeader');
  if (scrollHeader) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        scrollHeader.classList.add('bg-ink/90', 'backdrop-blur-md', 'border-b', 'border-white/5');
      } else {
        scrollHeader.classList.remove('bg-ink/90', 'backdrop-blur-md', 'border-b', 'border-white/5');
      }
    });
  }

  const searchForm = document.getElementById('navSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = document.getElementById('navSearchInput').value.trim();
      if (q) window.location.href = `/search.html?q=${encodeURIComponent(q)}`;
    });
  }
}

function highlightActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('[data-nav-link]').forEach((el) => {
    if (el.getAttribute('href') === path) {
      el.classList.add('text-amber-300');
      el.classList.remove('text-paper/70');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  highlightActiveNav();
});
