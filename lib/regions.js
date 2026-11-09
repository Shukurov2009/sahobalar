'use strict';

/**
 * Vercel `x-vercel-ip-country-region` sarlavhasi ISO 3166-2 kodini beradi
 * (masalan, UZ-TO yoki faqat TO). Quyida O'zbekiston viloyatlari to'liq
 * nomlari keltirilgan. Boshqa davlatlar uchun kod ko'rinishida qoladi.
 */
const REGIONS = {
  UZ: {
    AN: 'Andijon viloyati',
    BU: 'Buxoro viloyati',
    FA: "Farg'ona viloyati",
    JI: 'Jizzax viloyati',
    NG: 'Namangan viloyati',
    NW: 'Navoiy viloyati',
    QA: 'Qashqadaryo viloyati',
    QR: "Qoraqalpog'iston Respublikasi",
    SA: 'Samarqand viloyati',
    SI: 'Sirdaryo viloyati',
    SU: 'Surxondaryo viloyati',
    TK: 'Toshkent shahri',
    TO: 'Toshkent viloyati',
    XO: 'Xorazm viloyati'
  },
  // Qo'shni davlatlar uchun eng ko'p uchraydigan hududlar
  KZ: {
    ALA: 'Almati',
    AST: 'Astana',
    SHY: 'Shimkent',
    TUR: 'Turkiston'
  },
  KG: {
    GB: 'Bishkek',
    O: 'Osh'
  },
  TJ: {
    DU: 'Dushanbe',
    SU: "Sug'd"
  },
  TM: {
    A: 'Ashxobod',
    M: 'Mari'
  },
  TR: {
    '34': 'Istanbul',
    '06': 'Anqara',
    '35': 'Izmir'
  }
};

function normalizeRegion(country, region) {
  const c = String(country || '').toUpperCase();
  let r = String(region || '').toUpperCase();
  if (r.startsWith(c + '-')) r = r.slice(c.length + 1);
  return { country: c, code: r };
}

function regionName(country, region) {
  const { country: c, code } = normalizeRegion(country, region);
  if (!code) return '';
  const map = REGIONS[c];
  if (map && map[code]) return map[code];
  return c ? c + '-' + code : code;
}

module.exports = { regionName, normalizeRegion };
