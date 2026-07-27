# Movixa

Website streaming dan direktori anime, gabungan empat sumber data:

1. Home (home.html) - movies dan TV series dari TMDB, mengikuti pola scraping Hurawatch (dynamic API key dari config.js, mapping genre, dan 6 server streaming embed).
2. Dracin (dracin.html) - drama Asia sub Indonesia dari Dracinema, di-scrape langsung dari HTML dan API internal situs tersebut (regex native, tanpa dependency cheerio).
3. NontonAnime (nontonanime.html) - anime sub Indonesia dari NontonAnimeID, di-scrape dengan cheerio (parser HTML). Punya player streaming (iframe multi-server via AJAX WordPress + nonce) dan link download per format/resolusi.
4. LiveChart (livechart.html) - jadwal rilis anime musiman dari LiveChart.me, di-scrape dari HTML halaman (native fetch + regex, tanpa dependency cheerio/axios). Bukan sumber nonton, melainkan direktori info: studio, tanggal tayang, countdown episode berikutnya (real-time, akurat berbasis timestamp), daftar karakter (dari AniList), PV trailer, dan link streaming resmi (Crunchyroll dll).

## Struktur

```
/
  home.html               Homepage - hero banner rotating, trending rails (TMDB)
  movies.html             Katalog film (popular/now playing/top rated/upcoming)
  tv.html                 Katalog TV (popular/airing today/on the air/top rated)
  top-imdb.html           Ranking Top IMDb (movie/tv)
  search.html             Hasil pencarian (TMDB)
  detail-movie.html       Detail + player + season/episode + cast + similar (TMDB)
  watchlist.html          My List and riwayat tontonan gabungan (localStorage)
  dracin.html             Katalog drama Dracin, filter genre
  dracin-detail.html      Detail drama + player video native (HLS/MP4) + episode list
  nontonanime.html        Katalog anime NontonAnimeID (episode terbaru, ongoing, filter genre)
  nontonanime-detail.html Detail anime: sinopsis, metadata, daftar episode, rekomendasi
  nontonanime-stream.html Player streaming episode (iframe multi-server) + link download
  livechart.html          Jadwal anime musiman (season/year selector) + pencarian LiveChart
  livechart-detail.html   Detail anime LiveChart: info lengkap, karakter (AniList), PV trailer, link streaming resmi
  package.json            Dependency, auto-install oleh Vercel saat build
  vercel.json             Konfigurasi routing, install command, and function Vercel
  api/
    _lib.js            Shared helper TMDB (fetch, format item, generate stream)
    home.js            GET /api/home
    movies.js          GET /api/movies?filter=&page=
    tv.js              GET /api/tv?filter=&page=
    top-imdb.js        GET /api/top-imdb?type=&page=
    search.js          GET /api/search?q=&page=
    detail.js          GET /api/detail?type=&id=
    dracin.js          Endpoint gabungan Dracin, satu file untuk semua aksi:
                          GET /api/dracin?action=home
                          GET /api/dracin?action=collections
                          GET /api/dracin?action=movies&genre=&page=
                          GET /api/dracin?action=search&q=
                          GET /api/dracin?action=detail&slug=
                          GET /api/dracin?action=play&path=
    nontonanime.js     Endpoint gabungan NontonAnimeID, satu file untuk semua aksi (pakai cheerio):
                          GET /api/nontonanime?action=home
                          GET /api/nontonanime?action=search&page=&genre=&...filters
                          GET /api/nontonanime?action=search-simple&q=&page=
                          GET /api/nontonanime?action=ongoing&page=&sort=
                          GET /api/nontonanime?action=popular&page=
                          GET /api/nontonanime?action=schedule
                          GET /api/nontonanime?action=genres&sort=
                          GET /api/nontonanime?action=detail&slug=
                          GET /api/nontonanime?action=stream&slug=
                          GET /api/nontonanime?action=iframe&post_id=&nume=&server=&nonce=&ajax_url=
    livechart.js       Endpoint gabungan LiveChart, satu file untuk semua aksi:
                          GET /api/livechart?action=home&season=&year=
                          GET /api/livechart?action=search&q=
                          GET /api/livechart?action=detail&id=
                          GET /api/livechart?action=characters&title=
  assets/
    css/style.css      Design tokens and komponen kustom (di atas Tailwind CDN)
    js/
      common.js             API client TMDB, localStorage store, render helpers
      chrome.js             Navbar (hamburger sidebar) + bottom nav + footer shared
      home.js                Logic homepage
      catalog.js             Logic movies.html and tv.html
      detail-movie.js        Logic halaman detail TMDB
      dracin.js               Logic halaman katalog Dracin
      dracin-detail.js        Logic halaman detail Dracin, player HLS/MP4
      nontonanime.js           Logic halaman katalog NontonAnime
      nontonanime-detail.js    Logic halaman detail anime, daftar episode
      nontonanime-stream.js    Logic halaman player streaming, ganti server via AJAX, download links
      livechart.js             Logic halaman jadwal musiman + pencarian LiveChart
      livechart-detail.js      Logic halaman detail LiveChart, render karakter (AniList), PV & link streaming resmi
```

## Navigasi

- **Hamburger menu** (ikon garis tiga di kiri header, semua ukuran layar): membuka sidebar slide-in dari kiri berisi section utama untuk berpindah sumber data — Home, Dracin, NontonAnime, LiveChart — plus semua fitur (Movies, TV Shows, Top IMDb, My List, Cari).
- **Bottom navigation** (muncul otomatis di layar mobile/tablet, tersembunyi di layar besar `lg:`): Home, Top List, Movie (tombol tengah menonjol), TV, My List — dipakai konsisten di semua halaman termasuk NontonAnime dan LiveChart karena navigasi khusus masing-masing (filter/search/season selector) sudah ada langsung di halaman.
- Navbar horizontal klasik tetap tersedia di layar besar (`lg:` ke atas) sebagai tambahan, termasuk link NontonAnime dan LiveChart.

## Kenapa Dracin, NontonAnime, dan LiveChart digabung jadi satu file api masing-masing

Vercel Hobby plan membatasi maksimal 12 serverless functions per deployment. Supaya jumlah function tetap kecil dan aman dari limit ini, semua aksi tiap sumber digabung jadi satu file dengan parameter query `?action=` sebagai router internal, bukan file terpisah per aksi:
- `api/dracin.js`: home, collections, movies, search, detail, play
- `api/nontonanime.js`: home, search, search-simple, ongoing, popular, schedule, genres, detail, stream, iframe
- `api/livechart.js`: home (jadwal musiman), search, detail, characters

Total function saat ini 9, masih di bawah limit.

## Fitur

- Navbar terpadu: hamburger sidebar (Home/Dracin/NontonAnime/LiveChart + semua fitur) dan bottom nav mobile
- Home: hero rotator otomatis, trending rails, katalog dengan pagination, player 6 server switchable, season/episode selector untuk TV
- Dracin: katalog drama dengan filter genre, player video native mendukung HLS (via hls.js) dan MP4 langsung, episode list, rekomendasi drama serupa
- NontonAnime: katalog anime dengan episode terbaru, ongoing populer, filter genre, halaman detail dengan sinopsis dan metadata (status/tipe/musim/skor/durasi), player streaming iframe dengan beberapa pilihan server (switchable via AJAX), navigasi episode sebelumnya/selanjutnya, dan link download per format/resolusi
- LiveChart: jadwal rilis anime per musim (season/year selector), pencarian database LiveChart, halaman detail berisi sinopsis, status, tanggal tayang, studio, skor rating, hashtag Twitter/X, countdown episode berikutnya, daftar karakter (nama, gambar, role) dari AniList dalam carousel geser, PV/trailer embed dalam carousel geser, dan daftar link streaming resmi (Crunchyroll, dsb) — murni direktori info, tanpa player nonton di situs ini
- Watchlist and Continue Watching gabungan (localStorage), mendukung item dari Home/Dracin (LiveChart tidak masuk watchlist karena bukan konten streaming)
- Skeleton loading di semua rail/grid
- Fully responsive, dark theme dengan aksen gradasi amber ke crimson (Marquee Noir)

## Setup deploy (Vercel)

1. Push folder ini ke repo GitHub, pastikan seluruh isi folder ada langsung di root repo (bukan di dalam subfolder tambahan), termasuk `package.json`.
2. Import ke Vercel.
3. Set framework preset ke Other.
4. Deploy.

Tidak ada environment variable yang wajib. API key TMDB diambil otomatis dari https://hurawatch.sx/config.js saat runtime dengan fallback key jika gagal. API key Dracin sudah disematkan di kode. NontonAnimeID dan LiveChart tidak memerlukan API key, hanya membaca halaman publik masing-masing situs. `cheerio` (dipakai NontonAnimeID untuk parsing HTML) terdaftar di `package.json` sebagai dependency dan otomatis ter-install oleh Vercel lewat `installCommand: npm install` saat build/deploy — tidak perlu setup manual apa pun.

## Catatan

- Semua endpoint /api/* di-cache di edge Vercel (s-maxage) untuk mengurangi beban ke sumber asli, kecuali `action=iframe` NontonAnimeID yang selalu fresh karena URL-nya bisa berubah per sesi/nonce.
- Player Home menggunakan iframe embed pihak ketiga; player Dracin menggunakan tag video native dengan hls.js untuk stream m3u8; player NontonAnime menggunakan iframe embed dengan beberapa server pilihan (diganti via AJAX WordPress memakai nonce hasil scraping halaman episode); LiveChart tidak punya player internal, hanya PV trailer embed dan tautan keluar ke platform streaming resmi.
- Countdown episode berikutnya di halaman LiveChart detail dihitung live di browser dari `nextEpisode.timestamp` (Unix epoch, hasil scraping halaman resmi LiveChart) dan diperbarui tiap detik, sehingga akurat mengikuti waktu asli, bukan teks statis.
- Data karakter di halaman LiveChart detail diambil dari AniList GraphQL API (`https://graphql.anilist.co`, publik tanpa API key), dicocokkan berdasarkan judul anime. Bila judul tidak ditemukan di AniList, section karakter otomatis disembunyikan.
- Situs ini sendiri tidak menghosting file video atau gambar apa pun.
