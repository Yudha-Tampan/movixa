(function () {
  const headerHtml = `
  <header id="siteHeader" class="fixed top-0 inset-x-0 z-50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-2 sm:gap-4">
          <button id="hamburgerBtn" aria-label="Buka menu" class="p-2 -ml-2 text-paper/80 hover:text-amber-300 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <a href="/home.html" class="flex items-center gap-2 shrink-0">
            <span class="relative w-8 h-8 rounded-lg marquee-gradient flex items-center justify-center font-display text-ink text-lg">M</span>
            <span class="font-display text-xl tracking-wide">MOV<span class="marquee-text">IXA</span></span>
          </a>
        </div>

        <nav class="hidden lg:flex items-center gap-7 text-sm font-semibold">
          <a data-nav-link href="/home.html" class="text-paper/70 hover:text-amber-300 transition-colors">Home</a>
          <a data-nav-link href="/dracin.html" class="text-paper/70 hover:text-amber-300 transition-colors">Dracin</a>
          <a data-nav-link href="/nontonanime.html" class="text-paper/70 hover:text-amber-300 transition-colors">NontonAnime</a>
          <a data-nav-link href="/livechart.html" class="text-paper/70 hover:text-amber-300 transition-colors">LiveChart</a>
          <a data-nav-link href="/movies.html" class="text-paper/70 hover:text-amber-300 transition-colors">Movies</a>
          <a data-nav-link href="/tv.html" class="text-paper/70 hover:text-amber-300 transition-colors">TV Shows</a>
          <a data-nav-link href="/top-imdb.html" class="text-paper/70 hover:text-amber-300 transition-colors">Top IMDb</a>
          <a data-nav-link href="/watchlist.html" class="text-paper/70 hover:text-amber-300 transition-colors">My List</a>
        </nav>

        <div class="flex items-center gap-3">
          <form id="navSearchForm" class="hidden sm:flex items-center relative">
            <input id="navSearchInput" type="text" placeholder="Search titles..."
              class="w-40 lg:w-64 bg-white/5 border border-white/10 rounded-full py-2 pl-4 pr-9 text-sm placeholder:text-paper/40 focus:w-56 lg:focus:w-72 focus:border-amber-400/50 transition-all outline-none" />
            <button type="submit" aria-label="Search" class="absolute right-3 text-paper/50 hover:text-amber-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </button>
          </form>
          <a href="/search.html" aria-label="Search" class="sm:hidden p-2 text-paper/80 hover:text-amber-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </a>
        </div>
      </div>
    </div>
  </header>

  <div id="sidebarOverlay" class="hidden fixed inset-0 bg-ink/80 backdrop-blur-sm z-[60]"></div>

  <aside id="sidebarMenu" class="fixed top-0 left-0 h-full w-[280px] max-w-[80vw] bg-ink-2 border-r border-white/10 z-[70] -translate-x-full transition-transform duration-300 ease-out overflow-y-auto">
    <div class="flex items-center justify-between h-16 px-5 border-b border-white/10">
      <a href="/home.html" class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-lg marquee-gradient flex items-center justify-center font-display text-ink text-lg">M</span>
        <span class="font-display text-xl tracking-wide">MOV<span class="marquee-text">IXA</span></span>
      </a>
      <button id="sidebarCloseBtn" aria-label="Tutup menu" class="p-2 text-paper/60 hover:text-amber-300">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <nav class="p-4 space-y-1">
      <div class="eyebrow px-2 mb-2 mt-1">Jelajah</div>
      <a data-sidebar-link href="/home.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h4a1 1 0 001-1V10"/></svg>
        Home
      </a>
      <a data-sidebar-link href="/dracin.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        Dracin
      </a>
      <a data-sidebar-link href="/nontonanime.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        NontonAnime
      </a>
      <a data-sidebar-link href="/livechart.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        LiveChart
      </a>

      <div class="eyebrow px-2 mb-2 mt-6">Fitur</div>
      <a data-sidebar-link href="/movies.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M3 4h18v16H3V4z"/></svg>
        Movies
      </a>
      <a data-sidebar-link href="/tv.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM8 21h8"/></svg>
        TV Shows
      </a>
      <a data-sidebar-link href="/top-imdb.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z"/></svg>
        Top IMDb
      </a>
      <a data-sidebar-link href="/watchlist.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        My List
      </a>
      <a data-sidebar-link href="/search.html" class="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-paper/80 hover:bg-white/5 hover:text-amber-300 transition-colors">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        Cari
      </a>
    </nav>

    <div class="px-5 py-4 mt-4 border-t border-white/10 text-xs text-paper/30">
      &copy; ${new Date().getFullYear()} Movixa
    </div>
  </aside>

  <nav id="bottomNav" data-bottom-nav="default" class="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-ink-2/95 backdrop-blur-md border-t border-white/10">
    <div class="grid grid-cols-5 h-16">
      <a data-bottom-link href="/home.html" class="bottom-nav-item flex flex-col items-center justify-center gap-1 text-paper/50 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h4a1 1 0 001-1V10"/></svg>
        <span class="text-[10px] font-bold">Home</span>
      </a>
      <a data-bottom-link href="/top-imdb.html" class="bottom-nav-item flex flex-col items-center justify-center gap-1 text-paper/50 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7L2 9.2l7.1-.6L12 2z"/></svg>
        <span class="text-[10px] font-bold">Top List</span>
      </a>
      <a data-bottom-link href="/movies.html" class="bottom-nav-item flex flex-col items-center justify-center gap-1 text-paper/50 transition-colors -mt-4">
        <span class="w-12 h-12 rounded-full marquee-gradient flex items-center justify-center shadow-lg shadow-crimson-400/20">
          <svg class="w-6 h-6 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M3 4h18v16H3V4z"/></svg>
        </span>
        <span class="text-[10px] font-bold">Movie</span>
      </a>
      <a data-bottom-link href="/tv.html" class="bottom-nav-item flex flex-col items-center justify-center gap-1 text-paper/50 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM8 21h8"/></svg>
        <span class="text-[10px] font-bold">TV</span>
      </a>
      <a data-bottom-link href="/watchlist.html" class="bottom-nav-item flex flex-col items-center justify-center gap-1 text-paper/50 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        <span class="text-[10px] font-bold">My List</span>
      </a>
    </div>
  </nav>`;

  const footerHtml = `
  <footer class="border-t border-white/5 mt-24 mb-16 lg:mb-0">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
      <div class="md:col-span-1">
        <a href="/home.html" class="flex items-center gap-2 mb-3">
          <span class="w-7 h-7 rounded-lg marquee-gradient flex items-center justify-center font-display text-ink text-base">M</span>
          <span class="font-display text-lg">MOV<span class="marquee-text">IXA</span></span>
        </a>
        <p class="text-sm text-paper/50 leading-relaxed">Every marquee tells a story. Stream movies, series, dracin, and anime in one place.</p>
      </div>
      <div>
        <h4 class="eyebrow mb-4">Browse</h4>
        <ul class="space-y-2 text-sm text-paper/60">
          <li><a href="/dracin.html" class="hover:text-amber-300">Dracin</a></li>
          <li><a href="/nontonanime.html" class="hover:text-amber-300">NontonAnime</a></li>
          <li><a href="/livechart.html" class="hover:text-amber-300">LiveChart</a></li>
          <li><a href="/movies.html" class="hover:text-amber-300">Movies</a></li>
          <li><a href="/tv.html" class="hover:text-amber-300">TV Shows</a></li>
          <li><a href="/top-imdb.html" class="hover:text-amber-300">Top IMDb</a></li>
          <li><a href="/watchlist.html" class="hover:text-amber-300">My List</a></li>
        </ul>
      </div>
      <div>
        <h4 class="eyebrow mb-4">Filters</h4>
        <ul class="space-y-2 text-sm text-paper/60">
          <li><a href="/movies.html?filter=now_playing" class="hover:text-amber-300">Now Playing</a></li>
          <li><a href="/movies.html?filter=upcoming" class="hover:text-amber-300">Upcoming</a></li>
          <li><a href="/tv.html?filter=airing_today" class="hover:text-amber-300">Airing Today</a></li>
          <li><a href="/tv.html?filter=on_the_air" class="hover:text-amber-300">On The Air</a></li>
        </ul>
      </div>
      <div>
        <h4 class="eyebrow mb-4">Notice</h4>
        <p class="text-sm text-paper/50 leading-relaxed">This site indexes public metadata for reference only and links to third-party embed players. We host no video files ourselves.</p>
      </div>
    </div>
    <div class="border-t border-white/5 py-6 text-center text-xs text-paper/30">
      &copy; ${new Date().getFullYear()} Movixa. Data courtesy of TMDB, Dracinema, NontonAnimeID, and LiveChart. Not affiliated with any of them.
    </div>
  </footer>`;

  function openSidebar() {
    document.getElementById('sidebarMenu').classList.remove('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function closeSidebar() {
    document.getElementById('sidebarMenu').classList.add('-translate-x-full');
    document.getElementById('sidebarOverlay').classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const headerMount = document.getElementById('headerMount');
    const footerMount = document.getElementById('footerMount');
    if (headerMount) headerMount.outerHTML = headerHtml;
    if (footerMount) footerMount.outerHTML = footerHtml;
    initNavbar();
    highlightActiveNav();
    initSidebar();
    initBottomNavVariant();
    initBottomNav();
    initBodyPadding();

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);

    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', closeSidebar);

    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('[data-sidebar-link]').forEach((link) => {
      link.addEventListener('click', closeSidebar);
    });
  });

  function initSidebar() {
    const path = window.location.pathname;
    document.querySelectorAll('[data-sidebar-link]').forEach((el) => {
      if (el.getAttribute('href') === path) {
        el.classList.add('bg-white/5', 'text-amber-300');
      }
    });
  }

  function initBottomNav() {
    const path = window.location.pathname;
    document.querySelectorAll('[data-bottom-link]').forEach((el) => {
      if (el.getAttribute('href') === path) {
        el.classList.remove('text-paper/50');
        el.classList.add('text-amber-300');
      }
    });
  }

  function initBottomNavVariant() {
    const defaultNav = document.getElementById('bottomNav');
    if (defaultNav) defaultNav.classList.remove('hidden');
  }

  function initBodyPadding() {
    if (window.innerWidth < 1024) {
      document.body.classList.add('pb-16');
    }
  }
})();
