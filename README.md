# Sahobalar — Islomning ilk yulduzlari

O'zbek tilidagi, islomiy nafis uslubdagi sahobalar ma'lumotlar sayti. Har bir sahoba uchun otasi, qabilasi, Islomni qabul qilgan yili va yoshi, ustun jihatlari, jasoratlari, janglari va manbalar keltirilgan.

## Ishga tushirish

**Eng oson usul:** `start.bat` faylini ikki marta bosing. Sayt brauzerda ochiladi.

Yoki terminalda:

```bash
node server.js
```

So'ngra brauzerda `http://localhost:4173` manzilini oching.

Alternativ: `index.html` faylini to'g'ridan-to'g'ri brauzerda ochish ham mumkin (barcha ma'lumotlar mahalliy fayllarda).

## Tuzilma

```
sahobalar/
  index.html
  start.bat
  server.js
  css/
    base.css
    pages.css
  js/
    data-battles.js    — janglar, xronologiya, manbalar
    data-sahaba-1.js   — sahobalar (1-qism)
    data-sahaba-2.js   — sahobalar (2-qism)
    data-sahaba-3.js   — sahobalar (3-qism)
    data-sahaba-4.js   — sahobalar va sahobiyalar (4-qism)
    app.js             — qidiruv, filtr, sahifa va navigatsiya
  assets/
    fonts/             — mahalliy shriftlar
    pattern-star.svg
    favicon.svg
```

## Imkoniyatlar

- 46 ta sahoba va sahobiyya profili
- Ism, otasi, qabila, laqab va jang nomi bo'yicha qidiruv
- Xalifalar, muhajirlar, ansorlar, jangchilar, olimlar, roviylar, sahobiyalar filtrlari
- Sevimlilarni brauzerda saqlash
- 16 ta jang va yurish, ishtirokchilar bilan
- 25 ta tarixiy voqea xronologiyasi
- Klassik manbalar ro'yxati va ilmiy izohlar
- Mobil qurilmalarga moslashgan dizayn
- Internetsiz ishlaydi; tashqi CDN ishlatilmaydi

## Ma'lumot qo'shish

Yangi sahoba qo'shish uchun `js/data-sahaba-4.js` faylidagi massivga yangi obyekt qo'shing. Maydonlar namunasi mavjud profillarda ko'rsatilgan. Janglar `js/data-battles.js` faylidagi `BATTLES` massivida.

## Ilmiy izoh

Sanalar, yoshlar va ayrim tafsilotlar bo'yicha klassik manbalarda farq bo'lishi mumkin. Saytda bunday holatlar «taxminan» yoki «manbalarda farq» izohi bilan berilgan. Sayt o'quv-ma'rifiy maqsadda tuzilgan va diniy hukm chiqarish manbasi emas.
