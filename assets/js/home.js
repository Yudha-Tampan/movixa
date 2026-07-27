(async function () {
  railSkeleton('railTrendingMovies');
  railSkeleton('railTrendingSeries');
  railSkeleton('railTopRated');
  railSkeleton('railUpcoming');

  let heroItems = [];
  let heroIndex = 0;
  let heroTimer = null;

  function renderHeroPicker() {
    const el = document.getElementById('heroPicker');
    el.innerHTML = heroItems
      .map((item, i) => `
        <button data-idx="${i}" class="hero-pick-btn shrink-0 w-16 h-10 sm:w-20 sm:h-12 rounded-lg overflow-hidden relative border-2 ${i === heroIndex ? 'border-amber-400' : 'border-white/10'} transition-colors">
          <img src="${item.poster_url || ''}" class="w-full h-full object-cover ${i === heroIndex ? '' : 'opacity-50'}" alt="" />
        </button>
      `)
      .join('');
    el.querySelectorAll('.hero-pick-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        heroIndex = parseInt(btn.dataset.idx);
        showHero(heroIndex);
        resetHeroTimer();
      });
    });
  }

  function showHero(idx) {
    const item = heroItems[idx];
    if (!item) return;

    const backdrop = document.getElementById('heroBackdrop');
    backdrop.style.backgroundImage = `url('${item.backdrop_url || item.poster_url || ''}')`;
    backdrop.style.backgroundSize = 'cover';
    backdrop.style.backgroundPosition = 'center 20%';
    backdrop.style.transition = 'opacity 0.6s ease';

    document.getElementById('heroTitleSkeleton').classList.add('hidden');
    const titleEl = document.getElementById('heroTitle');
    titleEl.classList.remove('hidden');
    titleEl.textContent = item.title;

    document.getElementById('heroOverview').textContent = item.overview || '';

    const meta = document.getElementById('heroMeta');
    const genres = (item.genres || []).slice(0, 3).join(' • ');
    meta.innerHTML = `${reelBadge(item.rating)}<span class="text-paper/50 text-sm">${item.year}</span>${genres ? `<span class="text-paper/50 text-sm">${genres}</span>` : ''}${typeTag(item.type)}`;

    document.getElementById('heroWatchBtn').href = `/detail-movie.html?type=${item.type}&id=${item.id}#watch`;
    document.getElementById('heroInfoBtn').href = `/detail-movie.html?type=${item.type}&id=${item.id}`;

    renderHeroPicker();
  }

  function resetHeroTimer() {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroItems.length;
      showHero(heroIndex);
    }, 7000);
  }

  function renderContinueWatching() {
    const hist = Store.getHistory();
    if (hist.length === 0) return;
    document.getElementById('continueWatchingSection').classList.remove('hidden');
    rail('railContinue', hist.slice(0, 12));
  }

  try {
    const data = await API.home();
    heroItems = data.hero_banner || [];
    if (heroItems.length > 0) {
      showHero(0);
      resetHeroTimer();
    }
    rail('railTrendingMovies', data.trending_movies || []);
    rail('railTrendingSeries', data.trending_series || []);
    rail('railTopRated', data.all_time_best || []);
    rail('railUpcoming', data.upcoming || []);
    renderContinueWatching();
  } catch (e) {
    console.error(e);
    document.getElementById('heroTitleSkeleton').classList.add('hidden');
    document.getElementById('heroTitle').classList.remove('hidden');
    document.getElementById('heroTitle').textContent = 'Something went wrong';
    document.getElementById('heroOverview').textContent = 'Could not load featured content. Please refresh the page.';
  }
})();
