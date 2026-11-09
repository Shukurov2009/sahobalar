/*
 * Sahobalar — yengil analitika.
 *
 * Nima yuboriladi: sahifa manzili, tashrif vaqti, til, ekran o'lchami,
 * qurilma modeli (User-Agent Client Hints orqali) va tashqi manba.
 * IP manzil saqlanmaydi. Cookie ishlatilmaydi — faqat localStorage'dagi
 * tasodifiy tashrifchi ID si.
 */
(function () {
  'use strict';

  var API = '/api/track';
  var VID_KEY = 'sahobalar_vid';
  var SID_KEY = 'sahobalar_sid';

  // Do Not Track / Global Privacy Control hurmat qilinadi.
  if (
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.globalPrivacyControl === true
  ) {
    return;
  }

  // Faqat HTTPS (yoki lokal test) muhitida ishlaydi.
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (location.protocol !== 'https:' && !isLocal) return;

  function makeId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch (err) {
      /* eski brauzer */
    }
    return 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function getStored(storage, key) {
    try {
      return storage.getItem(key) || '';
    } catch (err) {
      return '';
    }
  }

  function setStored(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch (err) {
      /* private mode */
    }
  }

  var existingVid = getStored(localStorage, VID_KEY);
  var isNewVisitor = !existingVid;
  var vid = existingVid || makeId();
  if (!existingVid) setStored(localStorage, VID_KEY, vid);

  var sid = getStored(sessionStorage, SID_KEY);
  if (!sid) {
    sid = makeId();
    setStored(sessionStorage, SID_KEY, sid);
  }

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (resolve) {
        setTimeout(function () {
          resolve(null);
        }, ms);
      })
    ]);
  }

  function deviceInfo() {
    var info = {
      model: '',
      platform: '',
      platformVersion: '',
      brand: '',
      browser: '',
      mobile: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
    };

    if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
      info.platform = navigator.userAgentData.platform || '';
      info.mobile = Boolean(navigator.userAgentData.mobile);
      return navigator.userAgentData
        .getHighEntropyValues(['model', 'platformVersion', 'brands'])
        .then(function (high) {
          info.model = high.model || '';
          info.platformVersion = high.platformVersion || '';
          var brands = high.brands || navigator.userAgentData.brands || [];
          info.brand = brands
            .map(function (item) {
              return item && item.brand ? item.brand : '';
            })
            .filter(function (brand) {
              return brand && !/Not.?A.?Brand/i.test(brand);
            })
            .join(', ');
          return info;
        })
        .catch(function () {
          return info;
        });
    }

    return Promise.resolve(info);
  }

  function externalReferrer() {
    try {
      if (!document.referrer) return '';
      var parsed = new URL(document.referrer);
      if (parsed.host === location.host) return '';
      return document.referrer.slice(0, 480);
    } catch (err) {
      return '';
    }
  }

  var lastPath = '';
  var lastSentAt = 0;

  function track() {
    var path = location.pathname + (location.hash || '');
    var now = Date.now();
    if (path === lastPath && now - lastSentAt < 1200) return;
    lastPath = path;
    lastSentAt = now;

    var sentNew = isNewVisitor;
    isNewVisitor = false;

    withTimeout(deviceInfo(), 900).then(function (device) {
      var payload = {
        vid: vid,
        sid: sid,
        new: sentNew,
        path: path.slice(0, 290),
        title: (document.title || '').slice(0, 180),
        ref: externalReferrer(),
        lang: navigator.language || '',
        tz: '',
        screen: (screen.width || 0) + 'x' + (screen.height || 0),
        dpr: window.devicePixelRatio || 1,
        device: device || {}
      };

      try {
        payload.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      } catch (err) {
        payload.tz = '';
      }

      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {
        /* analitika sayt ishiga xalal bermaydi */
      });
    });
  }

  if (document.visibilityState === 'prerender') {
    document.addEventListener('visibilitychange', function onVisible() {
      if (document.visibilityState !== 'prerender') {
        document.removeEventListener('visibilitychange', onVisible);
        track();
      }
    });
  } else {
    track();
  }

  window.addEventListener('hashchange', function () {
    // app.js sarlavhani yangilashga ulgursin.
    setTimeout(track, 120);
  });

  window.addEventListener('popstate', function () {
    setTimeout(track, 120);
  });
})();
