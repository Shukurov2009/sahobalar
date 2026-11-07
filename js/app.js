/* Sahobalar — application */
(function () {
  'use strict';

  const SAHABA = window.SAHABA || [];
  const BATTLES = window.BATTLES || [];
  const TIMELINE = window.TIMELINE || [];
  const SOURCES = window.SOURCES || [];
  const CATEGORIES = window.CATEGORIES || [];
  const byId = new Map(SAHABA.map(function (s) { return [s.id, s]; }));
  const battleById = new Map(BATTLES.map(function (b) { return [b.id, b]; }));
  const catLabel = Object.fromEntries(CATEGORIES.map(function (c) { return [c.id, c.label]; }));

  const state = {
    query: '',
    category: 'all',
    sort: 'az',
    favoritesOnly: false,
    favorites: loadFavorites(),
    view: 'home'
  };

  const app = document.getElementById('app');
  const header = document.getElementById('siteHeader');
  const menuBtn = document.getElementById('menuBtn');
  const mainNav = document.getElementById('mainNav');
  const toastEl = document.getElementById('toast');
  const backTop = document.getElementById('backTop');
  const progressBar = document.getElementById('readingProgress');
  let toastTimer = null;

  const esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  const icon = function (name, cls) {
    return '<svg' + (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  };

  function loadFavorites() {
    try {
      const raw = localStorage.getItem('sahobalar:favorites');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(function (id) { return byId.has(id); }) : [];
    } catch (e) { return []; }
  }
  function saveFavorites() {
    try { localStorage.setItem('sahobalar:favorites', JSON.stringify(state.favorites)); } catch (e) {}
  }
  function updateFavCount() {
    const el = document.getElementById('favCount');
    if (el) el.textContent = '(' + state.favorites.length + ')';
  }
  function isFav(id) { return state.favorites.indexOf(id) !== -1; }

  function toggleFavorite(id) {
    const person = byId.get(id);
    if (!person) return;
    if (isFav(id)) {
      state.favorites = state.favorites.filter(function (x) { return x !== id; });
      showToast(person.name + ' sevimlilardan olib tashlandi');
    } else {
      state.favorites.push(id);
      showToast(person.name + ' sevimlilarga qo\'shildi');
    }
    saveFavorites();
    updateFavoriteUI(id);
    updateFavCount();
    if (state.favoritesOnly && state.view === 'catalog') applyFilters();
  }
  function updateFavoriteUI(id) {
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (btn) {
      const fav = isFav(id);
      btn.classList.toggle('is-fav', fav);
      btn.setAttribute('aria-pressed', String(fav));
      btn.setAttribute('aria-label', fav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish');
      const label = btn.querySelector('.fav-text');
      if (label) label.textContent = fav ? 'Sevimlilarda' : 'Sevimlilarga saqlash';
    });
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2600);
  }

  function shortYear(value) {
    if (!value) return '—';
    return value.replace(/-milodiy/g, '').replace(/-hijriy/g, '-h');
  }
  function categoryName(s) {
    if (s.gender === 'ayol') return 'Sahobiyya';
    for (let i = 0; i < s.categories.length; i++) {
      if (catLabel[s.categories[i]] && s.categories[i] !== 'sahobiyya') return catLabel[s.categories[i]];
    }
    return 'Sahoba';
  }
  function conversionSortValue(s) {
    const text = String(s.converted.year);
    const match = text.match(/\d{3,4}/);
    return match ? parseInt(match[0], 10) : 9999;
  }

  /* ---------- Templates ---------- */
  function sahabaCard(s, index) {
    const fav = isFav(s.id);
    const delay = Math.min(index * 35, 280);
    return '<article class="sahaba-card reveal" style="transition-delay:' + delay + 'ms">' +
      '<div class="card-top"><span class="badge">' + esc(s.badge) + '</span>' +
      '<button class="fav-btn' + (fav ? ' is-fav' : '') + '" data-fav="' + s.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo\'shish') + '">' + icon('star') + '</button></div>' +
      '<p class="card-arabic" lang="ar" dir="rtl">' + esc(s.arabic) + '</p>' +
      '<h3><a class="stretched-link" href="#/sahoba/' + s.id + '">' + esc(s.name) + '</a></h3>' +
      '<p class="card-title">' + esc(s.title) + '</p>' +
      '<p class="card-summary">' + esc(s.summary) + '</p>' +
      '<dl class="card-meta">' +
      '<div><dt>Otasi</dt><dd title="' + esc(s.father) + '">' + esc(s.father) + '</dd></div>' +
      '<div><dt>Islom</dt><dd title="' + esc(s.converted.year) + '">' + esc(shortYear(s.converted.year)) + '</dd></div>' +
      '</dl>' +
      '<div class="card-foot"><span class="card-cat">' + esc(categoryName(s)) + '</span><span class="card-more">Batafsil ' + icon('arrow-right') + '</span></div>' +
      '</article>';
  }

  function homeView() {
    const featuredIds = ['abu-bakr', 'umar', 'ali', 'xadija', 'bilal', 'xolid'];
    const featured = featuredIds.map(function (id) { return byId.get(id); }).filter(Boolean);
    const women = SAHABA.filter(function (s) { return s.gender === 'ayol'; }).length;
    const battles = BATTLES.filter(function (b) { return b.type === 'jang'; }).length;
    const marqueeNames = ['Abu Bakr', 'Umar', 'Usmon', 'Ali', 'Hamza', 'Bilol', 'Xolid', 'Sa\'d', 'Talha', 'Zubayr', 'Salmon', 'Ammor', 'Xadicha', 'Oisha', 'Fotima', 'Nusayba', 'Abu Hurayra', 'Muoz'];
    const marquee = marqueeNames.map(function (n) { return '<span>' + n + '</span>'; }).join('');
    const preview = [TIMELINE[0], TIMELINE[5], TIMELINE[6], TIMELINE[11]].filter(Boolean);

    return '<div class="page-enter">' +
      '<section class="hero">' +
        '<div class="container hero-grid">' +
          '<div class="hero-copy">' +
            '<p class="hero-kicker"><span class="arabic">الصحابة</span><span>Rasululloh ﷺ safdoshlari</span></p>' +
            '<h1>Imonning <em>ilk yulduzlari</em></h1>' +
            '<p class="hero-lead">Sahobalar — Islom tarixining eng yorqin sahifasi. Ularning iymoni, jasorati, ilmi va fidoyiligi asrlar osha bizga yo\'l ko\'rsatib keladi. Har bir hayot — alohida saboq.</p>' +
            '<div class="hero-actions">' +
              '<a class="btn btn-gold" href="#/sahobalar">Sahobalarni kashf etish ' + icon('arrow-right') + '</a>' +
              '<a class="btn btn-outline" href="#/xronologiya">Xronologiyani ko\'rish</a>' +
            '</div>' +
            '<dl class="hero-stats">' +
              '<div><dt>' + SAHABA.length + '</dt><dd>Sahoba va sahobiyya</dd></div>' +
              '<div><dt>' + battles + '</dt><dd>Asosiy jang</dd></div>' +
              '<div><dt>' + women + '</dt><dd>Sahobiyalar</dd></div>' +
              '<div><dt>14</dt><dd>Asrlik meros</dd></div>' +
            '</dl>' +
          '</div>' +
          '<div class="hero-art" aria-hidden="true">' +
            '<div class="arch">' +
              '<div class="arch-inner">' +
                '<span class="arch-star">' + icon('star') + '</span>' +
                '<span class="arch-calligraphy" lang="ar" dir="rtl">الصحابة</span>' +
                '<span class="arch-sub">Radiyallohu anhum</span>' +
                '<span class="arch-divider"></span>' +
                '<p class="arch-verse" lang="ar" dir="rtl">رَضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ</p>' +
                '<p class="arch-caption">Alloh ulardan rozi bo\'ldi, ular ham Undan rozi bo\'ldilar.<br>Bayyina, 8; Tavba, 100</p>' +
              '</div>' +
            '</div>' +
            '<span class="arch-orbit orbit-1"></span><span class="arch-orbit orbit-2"></span>' +
          '</div>' +
        '</div>' +
        '<div class="container">' +
          '<form class="hero-search" id="homeSearch" role="search">' + icon('search') +
            '<input type="search" name="q" placeholder="Sahoba ismini qidiring: Bilol, Xadicha, Xolid..." aria-label="Sahobalarni qidirish">' +
            '<button type="submit">Qidirish</button>' +
          '</form>' +
        '</div>' +
        '<div class="name-marquee" aria-hidden="true"><div class="marquee-track">' + marquee + marquee + '</div></div>' +
      '</section>' +

      '<section class="section feature-section">' +
        '<div class="container">' +
          '<div class="section-head reveal"><div><span class="eyebrow">Nega ularni o\'rganamiz?</span><h2>Bir umrlik <em class="gold">saboq</em></h2></div>' +
          '<p>Sahobalar tarixi faqat voqealar to\'plami emas. Bu — iymon, sabr, adolat va fidoyilikning tirik maktabidir.</p></div>' +
          '<div class="feature-grid">' +
            '<article class="feature-card reveal"><span class="f-num">01</span><div class="f-icon">' + icon('shield') + '</div><h3>Iymon va sabr</h3><p>Qullik, quvg\'in va urush sharoitida ham iymonini yo\'qotmagan insonlar hayoti.</p></article>' +
            '<article class="feature-card reveal"><span class="f-num">02</span><div class="f-icon">' + icon('quill') + '</div><h3>Ilm va hikmat</h3><p>Qur\'on, hadis, fiqh va tafsirni keyingi avlodga yetkazgan buyuk ustozlar.</p></article>' +
            '<article class="feature-card reveal"><span class="f-num">03</span><div class="f-icon">' + icon('sword') + '</div><h3>Jasorat va fidoyilik</h3><p>Badr, Uhud, Xandaq va boshqa janglarda ko\'rsatilgan matonat va vafo.</p></article>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section featured-section">' +
        '<div class="container">' +
          '<div class="section-head reveal"><div><span class="eyebrow">Tanlangan hayotlar</span><h2>Eng yorqin siymolar</h2></div>' +
          '<a class="link-more" href="#/sahobalar">Barchasini ko\'rish ' + icon('arrow-right') + '</a></div>' +
          '<div class="card-grid">' + featured.map(function (s, i) { return sahabaCard(s, i); }).join('') + '</div>' +
        '</div>' +
      '</section>' +

      '<section class="verse-banner">' +
        '<div class="container">' +
          '<p class="verse-arabic" lang="ar" dir="rtl">مُحَمَّدٌ رَسُولُ اللَّهِ ۚ وَالَّذِينَ مَعَهُ أَشِدَّاءُ عَلَى الْكُفَّارِ رُحَمَاءُ بَيْنَهُمْ</p>' +
          '<p class="verse-translation">«Muhammad Allohning rasulidir. U bilan birga bo\'lganlar kofirlarga qarshi qattiq, o\'zaro rahmdildirlar».</p>' +
          '<p class="verse-source">Al-Fath surasi, 29-oyat</p>' +
        '</div>' +
      '</section>' +

      '<section class="section timeline-preview">' +
        '<div class="container">' +
          '<div class="section-head reveal"><div><span class="eyebrow">Tarix yo\'li</span><h2>Muhim burilishlar</h2></div>' +
          '<a class="link-more" href="#/xronologiya">To\'liq xronologiya ' + icon('arrow-right') + '</a></div>' +
          '<div class="tl-preview-grid">' +
            preview.map(function (t) {
              return '<a class="tl-preview-item reveal" href="#/xronologiya"><span class="year">' + esc(t.year) + '</span><span class="hijri">' + esc(t.hijri) + '</span><h3>' + esc(t.title) + '</h3><p>' + esc(t.text.slice(0, 105)) + '…</p></a>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section discover-cta">' +
        '<div class="container">' +
          '<div class="cta-box reveal">' +
            '<span class="cta-arabic" aria-hidden="true">الصحابة</span>' +
            '<div><span class="eyebrow">Bilim yo\'li</span><h2>Kimni <em>izlaysiz?</em></h2><p>Ism, laqab, qabila yoki jang nomi bo\'yicha qidiring. Har bir sahoba sahifasida otasi, Islomni qabul qilgan yili va yoshi, ustun jihatlari, jasoratlari hamda janglari keltirilgan.</p></div>' +
            '<div class="cta-actions"><a class="btn btn-gold" href="#/sahobalar">Sahobalar ro\'yxati ' + icon('arrow-right') + '</a><a class="btn btn-outline" href="#/manbalar">Manbalar bilan tanishish</a></div>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</div>';
  }

  function catalogView(params) {
    state.query = params.get('q') || '';
    state.category = params.get('cat') && catLabel[params.get('cat')] ? params.get('cat') : 'all';
    state.sort = params.get('sort') || 'az';
    state.favoritesOnly = params.get('fav') === '1';

    return '<div class="page-enter">' +
      '<section class="page-hero"><div class="container">' +
        '<nav class="breadcrumb" aria-label="Navigatsiya"><a href="#/">Bosh sahifa</a><span class="sep">✦</span><span>Sahobalar</span></nav>' +
        '<p class="hero-kicker"><span class="arabic">الصحابة</span><span>Ma\'lumotlar bazasi</span></p>' +
        '<h1>Barcha <em>sahobalar</em></h1>' +
        '<p class="page-lead">Ism, otasi, qabilasi yoki jang nomi bo\'yicha qidiring. Filtrlar orqali xalifalar, muhajirlar, ansorlar, jangchilar, olimlar va sahobiyalarni ajratib ko\'rishingiz mumkin.</p>' +
        '<div class="page-meta"><span>' + icon('users') + SAHABA.length + ' ta profil</span><span>' + icon('sword') + BATTLES.length + ' ta jang va yurish</span><span>' + icon('star') + 'Sevimlilarni saqlash</span></div>' +
      '</div></section>' +
      '<section class="catalog section-tight"><div class="container">' +
        '<div class="catalog-toolbar">' +
          '<div class="search-field">' + icon('search') + '<input class="input" id="catalogSearch" type="search" placeholder="Sahoba, otasi, qabila, laqab yoki jang..." aria-label="Qidiruv" value="' + esc(state.query) + '"></div>' +
          '<div class="toolbar-right">' +
            '<button class="fav-filter' + (state.favoritesOnly ? ' is-active' : '') + '" id="favFilter" aria-pressed="' + state.favoritesOnly + '">' + icon('star') + 'Sevimlilar <span id="favCount">(' + state.favorites.length + ')</span></button>' +
            '<select class="select sort-select" id="sortSelect" aria-label="Saralash">' +
              '<option value="az"' + (state.sort === 'az' ? ' selected' : '') + '>Alifbo bo\'yicha</option>' +
              '<option value="year"' + (state.sort === 'year' ? ' selected' : '') + '>Qabul yili bo\'yicha</option>' +
              '<option value="battles"' + (state.sort === 'battles' ? ' selected' : '') + '>Janglar soni bo\'yicha</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="filter-row" id="filterChips" role="group" aria-label="Toifalar">' +
          CATEGORIES.map(function (c) {
            return '<button class="chip' + (state.category === c.id ? ' is-active' : '') + '" data-cat="' + c.id + '">' + esc(c.label) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="results-line"><span><strong id="resultCount">' + SAHABA.length + '</strong> ta natija</span><button class="clear-filters" id="clearFilters">Filtrlarni tozalash</button></div>' +
        '<div class="card-grid" id="cardGrid"></div>' +
        '<div class="empty-state" id="emptyState" hidden><div class="empty-arabic">✦</div><h2>Hech narsa topilmadi</h2><p>Boshqa ism yoki toifani sinab ko\'ring.</p><button class="btn btn-dark" id="emptyReset">Filtrlarni tozalash</button></div>' +
      '</div></section>' +
    '</div>';
  }

  function profileView(s) {
    if (!s) return notFoundView('Bunday sahoba topilmadi', 'Havola xato bo\'lishi yoki profil nomi o\'zgargan bo\'lishi mumkin.');
    const fav = isFav(s.id);
    const idx = SAHABA.findIndex(function (x) { return x.id === s.id; });
    const prev = idx > 0 ? SAHABA[idx - 1] : null;
    const next = idx < SAHABA.length - 1 ? SAHABA[idx + 1] : null;
    const battles = (s.battles || []).map(function (entry) {
      const b = battleById.get(entry.id);
      return b ? { b: b, role: entry.role } : null;
    }).filter(Boolean);
    const facts = [
      ['To\'liq ism', s.fullName],
      ['Otasi', s.father],
      ['Qabilasi', s.tribe],
      ['Tug\'ilgan', s.born],
      ['Vafot etgan', s.died],
      ['Islomni qabul qilgan yili', s.converted.year],
      ['Qabul qilgan yoshi', s.converted.age]
    ];

    return '<div class="page-enter">' +
      '<section class="profile-hero"><div class="container">' +
        '<nav class="breadcrumb" aria-label="Navigatsiya"><a href="#/">Bosh sahifa</a><span class="sep">✦</span><a href="#/sahobalar">Sahobalar</a><span class="sep">✦</span><span>' + esc(s.name) + '</span></nav>' +
        '<div class="profile-hero-grid">' +
          '<div class="profile-intro">' +
            '<p class="profile-arabic" lang="ar" dir="rtl">' + esc(s.arabic) + '</p>' +
            '<h1>' + esc(s.name) + '</h1>' +
            '<p class="profile-title">' + esc(s.title) + '</p>' +
            '<div class="profile-tags">' + s.categories.map(function (c) { return catLabel[c] ? '<span class="badge badge-dark">' + esc(catLabel[c]) + '</span>' : ''; }).join('') + '</div>' +
            '<div class="profile-actions">' +
              '<button class="fav-detail' + (fav ? ' is-fav' : '') + '" data-fav="' + s.id + '" aria-pressed="' + fav + '">' + icon('star') + '<span class="fav-text">' + (fav ? 'Sevimlilarda' : 'Sevimlilarga saqlash') + '</span></button>' +
              (battles.length ? '<a class="btn btn-outline btn-sm" href="#/janglar">Janglar bo\'limi ' + icon('arrow-right') + '</a>' : '') +
            '</div>' +
          '</div>' +
          '<div class="profile-medallion" aria-hidden="true"><div class="medallion">' + icon('star') + '<span class="medallion-arabic" lang="ar" dir="rtl">' + (s.gender === 'ayol' ? 'رضي الله عنها' : 'رضي الله عنه') + '</span><span class="medallion-arabic bottom">SAHOBA</span></div></div>' +
        '</div>' +
      '</div></section>' +

      '<section class="profile-body section-tight"><div class="container profile-layout">' +
        '<article class="profile-main">' +
          '<section class="content-block reveal"><p class="block-kicker">Qisqacha</p><h2>Hayoti va shaxsiyati</h2><div class="prose">' + s.bio.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></section>' +
          '<section class="content-block reveal"><p class="block-kicker">Islomga qadam</p><h2>Islomni qabul qilishi</h2><div class="prose"><p><strong>' + esc(s.converted.year) + '</strong> — ' + esc(s.converted.age) + '.</p><p>' + esc(s.summary) + '</p></div></section>' +
          '<section class="content-block reveal"><p class="block-kicker">Fazilatlar</p><h2>Ustun jihatlari</h2><div class="strength-grid">' +
            s.strengths.map(function (item, i) { return '<div class="strength-item"><span class="s-num">0' + (i + 1) + '</span><span>' + esc(item) + '</span></div>'; }).join('') +
          '</div></section>' +
          '<section class="content-block reveal"><p class="block-kicker">Jasorat</p><h2>Qilgan jasoratlari</h2><ul class="heroic-list">' +
            s.heroics.map(function (p) { return '<li><p>' + esc(p) + '</p></li>'; }).join('') +
          '</ul></section>' +
          '<section class="content-block reveal"><p class="block-kicker">Janglar</p><h2>Qatnashgan janglari</h2>' +
            (battles.length ? '<div class="battle-mini-list">' + battles.map(function (item) {
              return '<a class="battle-mini" href="#/janglar?b=' + item.b.id + '"><span class="bm-year">' + esc(item.b.year) + ' • ' + esc(item.b.yearCE) + '</span><h3>' + esc(item.b.name) + '</h3><p>' + esc(item.role) + '</p></a>';
            }).join('') + '</div>' : '<div class="note-box"><strong>Janglarda bevosita qatnashmagan.</strong> ' + esc(s.noBattlesNote || "Uning xizmati iymon, sabr va Islom yo'lidagi fidoyilikda namoyon bo'lgan.") + '</div>') +
          '</section>' +
          '<section class="content-block reveal"><p class="block-kicker">Meros</p><h2>Qoldirgan izi</h2><div class="legacy-box">' + esc(s.legacy) + '</div>' +
            (s.note ? '<div class="note-box"><strong>Ilmiy izoh:</strong> ' + esc(s.note) + '</div>' : '') +
          '</section>' +
          '<section class="content-block reveal"><p class="block-kicker">Manbalar</p><h2>Foydalanilgan asarlar</h2><ul class="source-list">' +
            s.sources.map(function (src) { return '<li>' + icon('book') + '<span>' + esc(src) + '</span></li>'; }).join('') +
          '</ul></section>' +
        '</article>' +
        '<aside class="profile-aside">' +
          '<div class="fact-card"><h2>Qisqa ma\'lumot</h2><dl class="fact-list">' +
            facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') +
          '</dl></div>' +
          '<div class="aside-quote"><p>' + esc(s.summary) + '</p><span>' + (s.gender === 'ayol' ? 'Radiyallohu anha' : 'Radiyallohu anhu') + '</span></div>' +
        '</aside>' +
      '</div></section>' +
      '<div class="container"><nav class="profile-pager" aria-label="Sahobalar bo\'ylab o\'tish">' +
        (prev ? '<a class="pager-link prev" href="#/sahoba/' + prev.id + '"><span>' + icon('arrow-left') + 'Oldingi</span><strong>' + esc(prev.name) + '</strong></a>' : '<div class="pager-link"></div>') +
        (next ? '<a class="pager-link next" href="#/sahoba/' + next.id + '"><span>Keyingi' + icon('arrow-right') + '</span><strong>' + esc(next.name) + '</strong></a>' : '<div class="pager-link"></div>') +
      '</nav></div>' +
    '</div>';
  }

  function battlesView(params) {
    const focus = params.get('b') || '';
    return '<div class="page-enter">' +
      '<section class="page-hero"><div class="container">' +
        '<nav class="breadcrumb" aria-label="Navigatsiya"><a href="#/">Bosh sahifa</a><span class="sep">✦</span><span>Janglar</span></nav>' +
        '<p class="hero-kicker"><span class="arabic">الغزوات</span><span>Janglar va yurishlar</span></p>' +
        '<h1>Imon <em>maydoni</em></h1>' +
        '<p class="page-lead">Badrdan Siffingacha bo\'lgan asosiy janglar, ularning hijriy va milodiy yillari, qatnashgan sahobalar. Har bir jang kartochkasidan sahobalar profiliga o\'tish mumkin.</p>' +
        '<div class="page-meta"><span>' + icon('sword') + BATTLES.length + ' voqea</span><span>' + icon('calendar') + '2–37-hijriy</span><span>' + icon('shield') + 'Sahobalar ishtiroki</span></div>' +
      '</div></section>' +
      '<section class="battles-page section-tight"><div class="container">' +
        '<div class="battle-note">' + icon('shield') + '<p><strong>Muhim izoh:</strong> janglar ro\'yxati sahobalar hayotini o\'rganish uchun tanlab olingan. Ba\'zi janglar haqidagi tafsilotlar manbalarda farq qiladi. Jamal va Siffin kabi sahobalar o\'rtasidagi ixtiloflar alohida hurmat va ehtiyotkorlik bilan o\'rganiladi.</p></div>' +
        '<div class="era-label">Makka va Madina davri</div>' +
        '<div class="battle-list">' +
          BATTLES.filter(function (b) { return ['badr','uhud','khandaq','khaybar','muta','makka','hunayn','tabuk'].indexOf(b.id) !== -1; }).map(battleCard).join('') +
        '</div>' +
        '<div class="era-label">Fathlar davri</div>' +
        '<div class="battle-list">' +
          BATTLES.filter(function (b) { return ['yamama','qadisiyya','yarmuk','quds','misr','nihavand'].indexOf(b.id) !== -1; }).map(battleCard).join('') +
        '</div>' +
        '<div class="era-label">Fitna davri</div>' +
        '<div class="battle-list">' +
          BATTLES.filter(function (b) { return b.type === 'fitna'; }).map(battleCard).join('') +
        '</div>' +
      '</div></section>' +
    '</div>';

    function battleCard(b) {
      const participants = SAHABA.filter(function (s) { return (s.battles || []).some(function (x) { return x.id === b.id; }); });
      const shown = participants.slice(0, 8);
      return '<article class="battle-card' + (b.type === 'fitna' ? ' is-fitna' : '') + '" id="' + b.id + '">' +
        '<div class="battle-year"><strong>' + esc(b.year.replace('-hijriy', '')) + '</strong><small>hijriy • ' + esc(b.yearCE) + '</small><div class="b-loc">' + esc(b.location) + '</div></div>' +
        '<div class="battle-main"><div class="battle-head"><h2>' + esc(b.name) + '</h2><span class="battle-tag' + (b.type === 'fitna' ? ' fitna' : '') + '">' + (b.type === 'fath' ? 'Fath' : b.type === 'yurish' ? 'Yurish' : b.type === 'fitna' ? 'Fitna davri' : 'Jang') + '</span></div>' +
        '<p>' + esc(b.summary) + '</p>' +
        '<div class="participants"><span class="p-label">Ishtirokchilar</span>' +
          (shown.length ? shown.map(function (s) { return '<a class="participant" href="#/sahoba/' + s.id + '">' + esc(s.name) + '</a>'; }).join('') : '<span class="participant-more">Ma\'lumotlar qisqa</span>') +
          (participants.length > shown.length ? '<span class="participant-more">+' + (participants.length - shown.length) + ' nafar</span>' : '') +
        '</div>' +
        (b.note ? '<p style="margin-top:12px;font-size:11.5px;color:var(--ink-faint)">' + esc(b.note) + '</p>' : '') +
        '</div></article>';
    }
  }

  function timelineView() {
    return '<div class="page-enter">' +
      '<section class="page-hero"><div class="container">' +
        '<nav class="breadcrumb" aria-label="Navigatsiya"><a href="#/">Bosh sahifa</a><span class="sep">✦</span><span>Xronologiya</span></nav>' +
        '<p class="hero-kicker"><span class="arabic">التاريخ</span><span>Tarix yo\'li</span></p>' +
        '<h1>Asrlar <em>silsilasi</em></h1>' +
        '<p class="page-lead">Vahiydan to sahobalarning vafotigacha bo\'lgan asosiy voqealar. Yillar hijriy va milodiy hisobda, imkon qadar aniqlik bilan keltirilgan.</p>' +
        '<div class="page-meta"><span>' + icon('calendar') + '610–692-milodiy</span><span>' + icon('scroll') + TIMELINE.length + ' muhim voqea</span></div>' +
      '</div></section>' +
      '<section class="timeline-page section-tight"><div class="container"><div class="timeline">' +
        TIMELINE.map(function (t) {
          return '<article class="tl-item reveal"><div class="tl-year"><strong>' + esc(t.year) + '</strong><span>' + esc(t.hijri) + '</span></div><div class="tl-body">' +
            '<span class="tl-type">' + esc(t.type) + '</span><h2>' + esc(t.title) + '</h2><p>' + esc(t.text) + '</p>' +
            '<div class="tl-people">' + (t.people || []).filter(function (id) { return byId.has(id); }).map(function (id) { return '<a href="#/sahoba/' + id + '">' + esc(byId.get(id).name) + '</a>'; }).join('') + '</div>' +
          '</div></article>';
        }).join('') +
      '</div></div></section>' +
    '</div>';
  }

  function sourcesView() {
    return '<div class="page-enter">' +
      '<section class="page-hero"><div class="container">' +
        '<nav class="breadcrumb" aria-label="Navigatsiya"><a href="#/">Bosh sahifa</a><span class="sep">✦</span><span>Manbalar</span></nav>' +
        '<p class="hero-kicker"><span class="arabic">المصادر</span><span>Ilmiy asos</span></p>' +
        '<h1>Manbalar va <em>uslub</em></h1>' +
        '<p class="page-lead">Saytdagi har bir ma\'lumot klassik islom manbalariga asoslangan. Sanalar, yoshlar yoki ayrim tafsilotlarda manbalar farq qilsa, bu holat sahoba sahifasida alohida izohlanadi.</p>' +
      '</div></section>' +
      '<section class="sources-page section-tight"><div class="container sources-layout">' +
        '<div class="sources-main">' +
          '<div class="method-grid">' +
            '<article class="method-card"><span class="m-num">01</span><h3>Manba ustuvorligi</h3><p>Siyra, tabaqot, hadis va tarix kitoblari asos qilib olindi. Har bir sahoba sahifasida foydalanilgan asarlar ko\'rsatilgan.</p></article>' +
            '<article class="method-card"><span class="m-num">02</span><h3>Ehtiyotkorlik</h3><p>Aniq bo\'lmagan yosh, sana yoki jang tafsilotlari «taxminan» yoki «manbalarda farq» izohi bilan berildi.</p></article>' +
            '<article class="method-card"><span class="m-num">03</span><h3>Hurmat</h3><p>Barcha sahobalar «radiyallohu anhum» bilan yodga olinadi. Sahobalar o\'rtasidagi ixtiloflar hukm chiqarmasdan bayon etiladi.</p></article>' +
            '<article class="method-card"><span class="m-num">04</span><h3>O\'quv maqsadi</h3><p>Sayt diniy hukm chiqarish manbasi emas. Muhim masalalarda mutaxassis va ishonchli kitoblarga murojaat qilish tavsiya etiladi.</p></article>' +
          '</div>' +
          '<div class="section-head" style="margin-bottom:20px"><div><span class="eyebrow">Asosiy asarlar</span><h2 style="font-size:clamp(30px,4vw,42px)">Foydalanilgan manbalar</h2></div></div>' +
          '<div class="source-cards">' +
            SOURCES.map(function (s) { return '<article class="source-card"><span class="sc-icon">' + icon('book') + '</span><div><h3>' + esc(s.title) + '</h3><p class="sc-author">' + esc(s.author) + '</p><p>' + esc(s.note) + '</p></div></article>'; }).join('') +
          '</div>' +
        '</div>' +
        '<aside class="sources-aside">' +
          '<div class="aside-panel dark"><h2>Oltin qoida</h2><p class="arabic-quote" lang="ar" dir="rtl">رَضِيَ اللَّهُ عَنْهُمْ أَجْمَعِينَ</p><p style="margin-top:12px">Alloh barcha sahobalardan rozi bo\'lsin. Ularni o\'rganish — iymon va amalni yaxshilash yo\'li.</p></div>' +
          '<div class="aside-panel"><h2>Qanday o\'qish kerak?</h2><ul><li>Avval sahobaning qisqa ma\'lumotini o\'qing.</li><li>Keyin jasoratlari va janglarini solishtiring.</li><li>Manbalar bo\'limini ko\'rib, chuqurroq o\'rganing.</li><li>Sevimli sahobalaringizni yulduzcha bilan saqlang.</li></ul></div>' +
          '<div class="aside-panel"><h2>Loyiha haqida</h2><p>Bu sayt HTML, CSS va JavaScript asosida yaratilgan. Internetga ulanmasdan ham ishlaydi. Ma\'lumotlar <strong>js/</strong> papkasidagi fayllarda saqlanadi.</p></div>' +
        '</aside>' +
      '</div></section>' +
    '</div>';
  }

  function notFoundView(title, text) {
    return '<section class="notfound"><div><p class="nf-arabic" lang="ar" dir="rtl">؟</p><h1>' + esc(title || 'Sahifa topilmadi') + '</h1><p>' + esc(text || 'Kechirasiz, izlagan sahifangiz mavjud emas.') + '</p><a class="btn btn-dark" href="#/">Bosh sahifaga qaytish ' + icon('arrow-right') + '</a></div></section>';
  }

  /* ---------- Catalog interactions ---------- */
  function filteredList() {
    let list = SAHABA.slice();
    if (state.favoritesOnly) list = list.filter(function (s) { return isFav(s.id); });
    if (state.category !== 'all') {
      if (state.category === 'sahobiyya') list = list.filter(function (s) { return s.gender === 'ayol'; });
      else list = list.filter(function (s) { return s.categories.indexOf(state.category) !== -1; });
    }
    const q = state.query.trim().toLowerCase();
    if (q) {
      list = list.filter(function (s) {
        const catNames = s.categories.map(function (c) { return catLabel[c] || ''; }).join(' ');
        const battleNames = (s.battles || []).map(function (entry) {
          const battle = battleById.get(entry.id);
          return battle ? battle.name + ' ' + battle.location : '';
        }).join(' ');
        const hay = [s.name, s.fullName, s.title, s.summary, s.father, s.tribe, s.arabic, s.badge, catNames, battleNames].join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });
    }
    if (state.sort === 'year') list.sort(function (a, b) { return conversionSortValue(a) - conversionSortValue(b) || a.name.localeCompare(b.name); });
    else if (state.sort === 'battles') list.sort(function (a, b) { return (b.battles || []).length - (a.battles || []).length || a.name.localeCompare(b.name); });
    else list.sort(function (a, b) { return a.name.localeCompare(b.name, 'uz'); });
    return list;
  }

  function applyFilters() {
    const grid = document.getElementById('cardGrid');
    if (!grid) return;
    const list = filteredList();
    grid.innerHTML = list.map(function (s, i) { return sahabaCard(s, i); }).join('');
    const count = document.getElementById('resultCount');
    if (count) count.textContent = list.length;
    const empty = document.getElementById('emptyState');
    if (empty) empty.hidden = list.length !== 0;
    grid.hidden = list.length === 0;
    updateFavCount();
    const favFilter = document.getElementById('favFilter');
    if (favFilter) {
      favFilter.classList.toggle('is-active', state.favoritesOnly);
      favFilter.setAttribute('aria-pressed', String(state.favoritesOnly));
    }
    initReveal();
  }

  function syncCatalogURL() {
    if (state.view !== 'catalog') return;
    const params = new URLSearchParams();
    if (state.query.trim()) params.set('q', state.query.trim());
    if (state.category !== 'all') params.set('cat', state.category);
    if (state.sort !== 'az') params.set('sort', state.sort);
    if (state.favoritesOnly) params.set('fav', '1');
    const qs = params.toString();
    history.replaceState(null, '', '#/sahobalar' + (qs ? '?' + qs : ''));
  }

  function resetCatalog() {
    state.query = '';
    state.category = 'all';
    state.sort = 'az';
    state.favoritesOnly = false;
    const search = document.getElementById('catalogSearch');
    if (search) search.value = '';
    const sort = document.getElementById('sortSelect');
    if (sort) sort.value = 'az';
    document.querySelectorAll('#filterChips .chip').forEach(function (chip) {
      chip.classList.toggle('is-active', chip.dataset.cat === 'all');
    });
    syncCatalogURL();
    applyFilters();
  }

  /* ---------- Reveal ---------- */
  let observer = null;
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    }
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Router ---------- */
  function route() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const split = raw.split('?');
    const path = split[0];
    const params = new URLSearchParams(split[1] || '');
    const parts = path.split('/').filter(Boolean);
    closeMenu();
    state.view = 'home';

    if (parts.length === 0) {
      app.innerHTML = homeView();
      setMeta('Sahobalar — Islomning ilk yulduzlari', 'Sahobalar hayoti: Islomni qabul qilgan yillari, ustun jihatlari, jasoratlari, janglari va otalari haqida ma\'lumotlar.');
      jumpTop();
    } else if (parts[0] === 'sahobalar') {
      state.view = 'catalog';
      app.innerHTML = catalogView(params);
      applyFilters();
      setMeta('Sahobalar ro\'yxati — Sahobalar', 'Sahobalarni ism, qabila, jang va toifa bo\'yicha qidiring.');
      jumpTop();
      const search = document.getElementById('catalogSearch');
      if (search && params.get('q')) search.focus({ preventScroll: true });
    } else if (parts[0] === 'sahoba' && parts[1]) {
      state.view = 'profile';
      const person = byId.get(parts[1]);
      app.innerHTML = profileView(person);
      setMeta(person ? person.name + ' — Sahobalar' : 'Sahoba topilmadi', person ? person.summary : 'Sahifa topilmadi.');
      jumpTop();
    } else if (parts[0] === 'janglar') {
      state.view = 'battles';
      app.innerHTML = battlesView(params);
      setMeta('Janglar va yurishlar — Sahobalar', 'Badr, Uhud, Xandaq, Xaybar, Mu\'ta va boshqa janglar haqida.');
      jumpTop();
      const focus = params.get('b');
      if (focus) {
        setTimeout(function () {
          const el = document.getElementById(focus);
          if (el) {
            const top = el.getBoundingClientRect().top + window.pageYOffset - 96;
            window.scrollTo({ top: top, behavior: 'smooth' });
            el.style.transition = 'border-color .4s';
            el.style.borderColor = 'var(--gold)';
            setTimeout(function () { el.style.borderColor = ''; }, 1600);
          }
        }, 120);
      }
    } else if (parts[0] === 'xronologiya') {
      state.view = 'timeline';
      app.innerHTML = timelineView();
      setMeta('Xronologiya — Sahobalar', 'Vahiydan sahobalar davrigacha bo\'lgan asosiy tarixiy voqealar.');
      jumpTop();
    } else if (parts[0] === 'manbalar') {
      state.view = 'sources';
      app.innerHTML = sourcesView();
      setMeta('Manbalar — Sahobalar', 'Saytda foydalanilgan klassik islom manbalari va uslub.');
      jumpTop();
    } else {
      app.innerHTML = notFoundView();
      setMeta('Sahifa topilmadi — Sahobalar', 'Sahifa topilmadi.');
      jumpTop();
    }

    updateNav(parts[0] || 'home');
    document.body.classList.toggle('has-progress', state.view === 'profile');
    updateProgress();
    initReveal();
  }

  function jumpTop() {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    void root.offsetHeight;
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previous;
  }

  function setMeta(title, description) {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }

  function updateNav(routeKey) {
    const key = routeKey === 'sahoba' ? 'sahobalar' : routeKey;
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      link.classList.toggle('is-active', link.dataset.nav === key);
    });
  }

  function closeMenu() {
    if (!mainNav || !menuBtn) return;
    mainNav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Menyuni ochish');
    document.body.classList.remove('menu-open');
  }

  /* ---------- Scroll ---------- */
  function updateProgress() {
    if (state.view === 'profile') {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = height > 0 ? Math.min(100, Math.max(0, (window.scrollY / height) * 100)) : 0;
      if (progressBar) progressBar.style.width = ratio + '%';
    } else if (progressBar) {
      progressBar.style.width = '0%';
    }
  }
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (backTop) backTop.classList.toggle('is-visible', window.scrollY > 620);
    updateProgress();
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 780) closeMenu();
      updateProgress();
    });

    menuBtn.addEventListener('click', function () {
      const open = mainNav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
      document.body.classList.toggle('menu-open', open);
    });

    backTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    document.addEventListener('click', function (e) {
      const favBtn = e.target.closest('[data-fav]');
      if (favBtn) {
        e.preventDefault();
        toggleFavorite(favBtn.getAttribute('data-fav'));
        return;
      }
      if (e.target.closest('#emptyReset')) { resetCatalog(); return; }
      if (e.target.closest('#clearFilters')) { resetCatalog(); return; }
      if (e.target.closest('#favFilter')) {
        state.favoritesOnly = !state.favoritesOnly;
        syncCatalogURL();
        applyFilters();
        return;
      }
      const chip = e.target.closest('#filterChips .chip');
      if (chip) {
        state.category = chip.dataset.cat;
        document.querySelectorAll('#filterChips .chip').forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        syncCatalogURL();
        applyFilters();
      }
    });

    document.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'catalogSearch') {
        state.query = e.target.value;
        syncCatalogURL();
        applyFilters();
      }
    });

    document.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'sortSelect') {
        state.sort = e.target.value;
        syncCatalogURL();
        applyFilters();
      }
    });

    document.addEventListener('submit', function (e) {
      if (e.target && e.target.id === 'homeSearch') {
        e.preventDefault();
        const input = e.target.querySelector('input[name="q"]');
        const value = input ? input.value.trim() : '';
        location.hash = '#/sahobalar' + (value ? '?q=' + encodeURIComponent(value) : '');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        const search = document.getElementById('catalogSearch');
        if (search) { e.preventDefault(); search.focus(); }
        else if (state.view !== 'catalog') { e.preventDefault(); location.hash = '#/sahobalar'; setTimeout(function () { const s = document.getElementById('catalogSearch'); if (s) s.focus(); }, 250); }
      }
    });
  }

  function init() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    bindEvents();
    route();
    onScroll();
  }

  init();
})();
