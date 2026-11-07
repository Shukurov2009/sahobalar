/* Sahobalar — janglar, xronologiya, manbalar */
window.CATEGORIES = [
  { id: "all", label: "Barchasi" },
  { id: "xalifa", label: "Xalifalar" },
  { id: "muhajir", label: "Muhajirlar" },
  { id: "ansor", label: "Ansorlar" },
  { id: "jangchi", label: "Jangchilar" },
  { id: "olim", label: "Olimlar" },
  { id: "roviy", label: "Roviylar" },
  { id: "sahobiyya", label: "Sahobiyalar" },
  { id: "shahid", label: "Shahidlar" }
];

window.BATTLES = [
  {
    id: "badr", name: "Badr al-Kubra", year: "2-hijriy", yearCE: "624", location: "Badr quduqlari",
    type: "jang", summary: "Islom tarixidagi ilk yirik g'alaba. 313 nafar sahoba 1000 ga yaqin qurayshiy qo'shiniga qarshi jang qildi. Musulmonlar uchun bu jang iymon, intizom va Allohga tavakkulning amaliy saboqi bo'ldi.",
    note: "Badr jangi Ramazon oyida bo'lib o'tgan."
  },
  {
    id: "uhud", name: "Uhud jangi", year: "3-hijriy", yearCE: "625", location: "Uhud tog'i",
    type: "jang", summary: "Quraysh qo'shini Madinaga yurish qildi. Dastlabki muvaffaqiyatdan so'ng o'qchilar pozitsiyani tark etgani sabab vaziyat o'zgardi. Hamza ibn Abd al-Muttalib va Mus'ab ibn Umayr shu jangda shahid bo'ldi.",
    note: "Uhud — sabr, itoat va ogohlantirishning buyuk saboqlaridan biri."
  },
  {
    id: "khandaq", name: "Xandaq (Ahzob) jangi", year: "5-hijriy", yearCE: "627", location: "Madina atrofi",
    type: "jang", summary: "Quraysh va ittifoqchi qabilalar Madinani qamal qildi. Salman al-Forsiyning taklifi bilan shahar atrofida xandaq qazildi; qamal natijasiz tugadi.",
    note: "Bu jangda mudofaa strategiyasi va jamoa birligi namoyon bo'ldi."
  },
  {
    id: "khaybar", name: "Xaybar fath", year: "7-hijriy", yearCE: "628", location: "Xaybar vohasi",
    type: "fath", summary: "Xaybar yaqinidagi yahudiy qal'alari fath etildi. Rivoyatlarga ko'ra, Ali ibn Abi Tolib bayroqni ko'tarib, qal'aning eshigini ochishda jasorat ko'rsatdi.",
    note: "Xaybar fathidan keyin Islom davlatining shimoliy chegaralari mustahkamlandi."
  },
  {
    id: "muta", name: "Mu'ta jangi", year: "8-hijriy", yearCE: "629", location: "Mu'ta, Shom chegarasi",
    type: "jang", summary: "Zayd ibn Horisa, Ja'far ibn Abi Tolib va Abdulloh ibn Ravoha qo'mondonligidagi qo'shin Rum va ittifoqchilariga qarshi yurish qildi. Uch qo'mondon shahid bo'ldi; Xolid ibn al-Valid armiyani saqlab qoldi.",
    note: "Mu'ta — Islom qo'shinining Shom yo'nalishidagi ilk yirik harbiy yurishi."
  },
  {
    id: "makka", name: "Makka fathi", year: "8-hijriy", yearCE: "630", location: "Makka",
    type: "fath", summary: "Makka deyarli qon to'kilmasdan fath etildi. Ka'ba butlardan tozalandi, payg'ambarimiz kechirish va rahm-shafqat namunasi ko'rsatdi.",
    note: "Fath kuni Bilol ibn Raboh Ka'ba tomida azon o'qigan."
  },
  {
    id: "hunayn", name: "Hunayn jangi", year: "8-hijriy", yearCE: "630", location: "Hunayn vodiysi",
    type: "jang", summary: "Havozin qabilasi va uning ittifoqchilariga qarshi jang. Dastlabki tarqoqlikdan so'ng musulmonlar yana birlashib, g'alaba qozondi.",
    note: "Hunayn jangida payg'ambarimiz alohida sabot va rahbarlik ko'rsatdi."
  },
  {
    id: "tabuk", name: "Tabuk yurishi", year: "9-hijriy", yearCE: "630", location: "Tabuk",
    type: "yurish", summary: "Rum imperiyasi chegarasiga qarab qilingan eng uzoq yurish. Jang bo'lmadi, ammo qiyinchilik, saxovat va tayyorgarlik imtihoni bo'ldi. Usmon ibn Affon qo'shinni katta mablag' bilan ta'minladi.",
    note: "Tabuk yurishi «qiyinchilik yurishi» sifatida ham tanilgan."
  },
  {
    id: "yamama", name: "Yamama jangi", year: "11-hijriy", yearCE: "632", location: "Yamama",
    type: "jang", summary: "Musaylima al-Kazzob va uning tarafdorlariga qarshi jang. Ko'plab qorilar shahid bo'ldi; keyinchalik Qur'onni jamlash ishlari jadallashtirildi.",
    note: "Bu jang Abu Bakrning xalifaligi davrida bo'lib o'tdi."
  },
  {
    id: "qadisiyya", name: "Qodisiyya jangi", year: "15-hijriy", yearCE: "636", location: "Qodisiyya",
    type: "jang", summary: "Fors imperiyasiga qarshi hal qiluvchi jang. Sa'd ibn Abi Vaqqos qo'mondonlik qildi; musulmonlar g'alaba qozonib, Fors tomon yo'l ochdi.",
    note: "Jang Umar ibn al-Xattobning xalifaligi davrida bo'ldi."
  },
  {
    id: "yarmuk", name: "Yarmuk jangi", year: "15-hijriy", yearCE: "636", location: "Yarmuk daryosi",
    type: "jang", summary: "Rum qo'shiniga qarshi hal qiluvchi jang. Xolid ibn al-Valid va Abu Ubayda ibn al-Jarroh boshchiligidagi musulmon qo'shini g'alaba qozondi.",
    note: "Yarmuk g'alabasi Shom fathlarini tezlashtirdi."
  },
  {
    id: "quds", name: "Quddus fath", year: "16-hijriy", yearCE: "637", location: "Quddus",
    type: "fath", summary: "Quddus sulh yo'li bilan ochildi. Umar ibn al-Xattob shaharga kirib, ahdga vafo va adolat ko'rsatdi.",
    note: "Quddus fathida qon to'kilmasligi uchun sulh shartlari qabul qilindi."
  },
  {
    id: "misr", name: "Misr fath", year: "19–21-hijriy", yearCE: "640–642", location: "Misr",
    type: "fath", summary: "Amr ibn al-Os boshchiligida Misr fath etildi. Fustat shahriga asos solindi; ilm va savdo markazi shakllandi.",
    note: "Misr fathlari Umar davrida boshlanib, Uthman davrida yakunlandi."
  },
  {
    id: "nihavand", name: "Nihavand jangi", year: "21-hijriy", yearCE: "642", location: "Nihavand",
    type: "jang", summary: "Forslarning so'nggi yirik qarshiligi sindirildi. Tarixchilar bu g'alabani «fathlar fathi» deb atagan.",
    note: "Bu jangdan so'ng Fors hududlarida Islom hukmronligi mustahkamlandi."
  },
  {
    id: "jamal", name: "Jamal jangi", year: "36-hijriy", yearCE: "656", location: "Basra yaqini",
    type: "fitna", summary: "Sahobalar o'rtasidagi siyosiy ixtilof davri. Ali ibn Abi Tolib, Talha ibn Ubaydulloh va Zubayr ibn al-Avvom ishtirok etdi. Tarixchilar bu voqeani fitna davri sifatida o'rganadi.",
    note: "Sayt bu kabi voqealarni hurmat bilan, tarixiy fakt sifatida bayon etadi."
  },
  {
    id: "siffin", name: "Siffin jangi", year: "37-hijriy", yearCE: "657", location: "Siffin",
    type: "fitna", summary: "Ali ibn Abi Tolib va Muoviya ibn Abu Sufyon qo'shinlari o'rtasidagi siyosiy ixtilof. Ammar ibn Yosir shu jangda shahid bo'ldi.",
    note: "Bu voqea sahobalar o'rtasidagi siyosiy ziddiyat sifatida o'rganiladi, oddiy jang emas."
  }
];

window.TIMELINE = [
  { year: "610", hijri: "Vahiy yili", type: "Vahiy", title: "Vahyning boshlanishi", text: "Hira g'orida ilk vahiy nozil bo'ldi. Xadicha bint Xuvaylid, Abu Bakr, Ali va Zayd ibn Horisa ilk musulmonlar safida bo'ldi.", people: ["xadija", "abu-bakr", "ali", "zayd"] },
  { year: "613", hijri: "Da'vat", type: "Da'vat", title: "Ochiq da'vat boshlanishi", text: "Payg'ambarimiz ﷺ ochiq da'vatga kirishdi. Makka mushriklari musulmonlarga qarshilik va azob-uqubatlarni boshladi.", people: ["abu-bakr", "bilal", "ammar", "sumayya"] },
  { year: "615", hijri: "Hijrat", type: "Hijrat", title: "Habashistonga birinchi hijrat", text: "Makka musulmonlarining bir qismi Habashistonga hijrat qildi. Shu yillarda Sumayya bint Xayyot Islomning ilk shahidasi bo'ldi.", people: ["usmon", "jafar", "sumayya"] },
  { year: "616", hijri: "Da'vat", type: "Da'vat", title: "Hamza va Umar Islomda", text: "Hamza ibn Abd al-Muttalib va Umar ibn al-Xattob Islomni qabul qildi. Bu musulmonlarning ochiq faoliyatiga kuch berdi.", people: ["hamza", "umar"] },
  { year: "619", hijri: "G'am yili", type: "Sinov", title: "G'am yili", text: "Xadicha bint Xuvaylid va Abu Tolib vafot etdi. Payg'ambarimiz ﷺ uchun og'ir sinov davri boshlandi.", people: ["xadija"] },
  { year: "622", hijri: "1-hijriy", type: "Hijrat", title: "Madinaga hijrat", text: "Payg'ambarimiz ﷺ Abu Bakr bilan Madinaga hijrat qildi. Ansorlar muhojirlarni birodarlik bilan qabul qildi.", people: ["abu-bakr", "anas", "abu-ayyub", "muoz"] },
  { year: "624", hijri: "2-hijriy", type: "Jang", title: "Badr al-Kubra", text: "Musulmonlar Badrda ilk yirik g'alabaga erishdi. Jangda Abu Bakr, Umar, Ali, Hamza va boshqa sahobalar qatnashdi.", people: ["abu-bakr", "umar", "ali", "hamza", "bilal"] },
  { year: "625", hijri: "3-hijriy", type: "Jang", title: "Uhud jangi", text: "Uhudda og'ir sinov bo'ldi. Hamza ibn Abd al-Muttalib va Mus'ab ibn Umayr shahid bo'ldi.", people: ["hamza", "musab", "talha", "zubayr"] },
  { year: "627", hijri: "5-hijriy", type: "Jang", title: "Xandaq jangi", text: "Madina atrofida xandaq qazildi. Qamal natijasiz tugadi; Salman al-Forsiyning taklifi muhim rol o'ynadi.", people: ["salman", "ammar", "huzayfa"] },
  { year: "628", hijri: "7-hijriy", type: "Fath", title: "Xaybar fath etildi", text: "Xaybar qal'alari fath etildi. Ali ibn Abi Tolib bayroqni ko'tarib, jasorat ko'rsatdi.", people: ["ali", "abu-hurayra", "jafar"] },
  { year: "629", hijri: "8-hijriy", type: "Jang", title: "Mu'ta jangi", text: "Zayd ibn Horisa, Ja'far ibn Abi Tolib va Abdulloh ibn Ravoha shahid bo'ldi. Xolid ibn al-Valid qo'shinni saqlab qoldi.", people: ["zayd", "jafar", "ibn-ravoha", "xolid"] },
  { year: "630", hijri: "8–9-hijriy", type: "Fath", title: "Makka, Hunayn va Tabuk", text: "Makka fath etildi, Hunayn jangida g'alaba qozonildi va Tabuk yurishi amalga oshirildi. Islom davlati kengaydi.", people: ["abu-bakr", "umar", "usmon", "abbos", "adi"] },
  { year: "632", hijri: "11-hijriy", type: "Sinov", title: "Rasululloh ﷺ ning vafoti", text: "Payg'ambarimiz ﷺ vafot etdi. Abu Bakr xalifa bo'ldi; Yamama jangida ko'plab qorilar shahid bo'ldi.", people: ["abu-bakr", "fotima", "abu-hurayra"] },
  { year: "634", hijri: "13-hijriy", type: "Xalifa", title: "Abu Bakr vafoti, Umar xalifaligi", text: "Abu Bakr vafot etdi va Umar ibn al-Xattob xalifa bo'ldi. Uning davrida Shom va Fors fathlari jadal davom etdi.", people: ["abu-bakr", "umar", "xolid", "abu-ubayda"] },
  { year: "636", hijri: "15-hijriy", type: "Jang", title: "Qodisiyya va Yarmuk", text: "Fors va Rum imperiyalariga qarshi hal qiluvchi g'alabalar qozonildi. Sa'd ibn Abi Vaqqos va Xolid ibn al-Valid qo'mondonlik qildi.", people: ["sad-abi-waqqas", "xolid", "abu-ubayda"] },
  { year: "637", hijri: "16-hijriy", type: "Fath", title: "Quddus fath etildi", text: "Umar ibn al-Xattob Quddusni sulh yo'li bilan qabul qildi va adolat ko'rsatdi.", people: ["umar"] },
  { year: "639", hijri: "18-hijriy", type: "Sinov", title: "Amvos vabosi", text: "Shomda vabo tarqaldi. Abu Ubayda ibn al-Jarroh va Muoz ibn Jabal shu vaboda vafot etdi.", people: ["abu-ubayda", "muoz"] },
  { year: "640–642", hijri: "19–21-hijriy", type: "Fath", title: "Misr fath etildi", text: "Amr ibn al-Os boshchiligida Misr fath etildi; Fustat shahri bunyod etildi.", people: ["amr-as"] },
  { year: "644", hijri: "23-hijriy", type: "Xalifa", title: "Umar shahid bo'ldi", text: "Umar ibn al-Xattob xalifalik paytida shahid bo'ldi. Uthman ibn Affon xalifa etib saylandi.", people: ["umar", "usmon"] },
  { year: "656", hijri: "35-hijriy", type: "Fitna", title: "Uthman shahid bo'ldi", text: "Uthman ibn Affon o'z uyida shahid bo'ldi. Ali ibn Abi Tolib xalifa bo'ldi; Jamal voqeasi yuz berdi.", people: ["usmon", "ali", "talha", "zubayr", "oisha"] },
  { year: "657", hijri: "37-hijriy", type: "Fitna", title: "Siffin voqeasi", text: "Ali va Muoviya qo'shinlari o'rtasida siyosiy ixtilof yuz berdi. Ammar ibn Yosir shahid bo'ldi.", people: ["ali", "ammar"] },
  { year: "661", hijri: "40-hijriy", type: "Xalifa", title: "Ali shahid bo'ldi", text: "Ali ibn Abi Tolib Kufada shahid bo'ldi. Uning ilmi va jasorati islom tarixida chuqur iz qoldirdi.", people: ["ali"] },
  { year: "669", hijri: "49-hijriy", type: "Jang", title: "Abu Ayyubning vafoti", text: "Abu Ayyub al-Ansoriy Konstantinopol yurishida vafot etdi. U Payg'ambarni uyida mehmon qilgan sahobadir.", people: ["abu-ayyub"] },
  { year: "678", hijri: "57–58-hijriy", type: "Vafot", title: "Oisha va Abu Hurayra vafoti", text: "Oisha bint Abu Bakr va Abu Hurayra vafot etdi. Ular hadis va fiqh ilmida chuqur iz qoldirdi.", people: ["oisha", "abu-hurayra"] },
  { year: "692", hijri: "73-hijriy", type: "Vafot", title: "Asmo bint Abu Bakr vafoti", text: "Asmo bint Abu Bakr hijratning fidoyi sahobiyasi sifatida uzoq umr ko'rib vafot etdi.", people: ["asmo"] }
];

window.SOURCES = [
  { title: "Al-Qur'on al-Karim", author: "Allohning kalomi", note: "Sahobalar fazilati va ularning hayotiga oid oyatlarning asosiy manbasi." },
  { title: "As-Siyra an-Nabawiyya", author: "Ibn Hishom (vaf. 833)", note: "Payg'ambarimiz ﷺ hayoti va sahobalarning ilk davri haqidagi eng mashhur siyra kitoblaridan biri." },
  { title: "At-Tabaqot al-Kubro", author: "Ibn Sa'd (vaf. 845)", note: "Sahobalar va tobi'inlarning hayoti, qabilalari, fazilatlari haqidagi katta biografik to'plam." },
  { title: "Sahih al-Buxoriy", author: "Imom al-Buxoriy (vaf. 870)", note: "Sahobalarning fazilatlari, janglar va Payg'ambarimiz ﷺ davriga oid ishonchli hadislar." },
  { title: "Sahih Muslim", author: "Imom Muslim (vaf. 875)", note: "Sahobalar hayoti va fazilatlariga oid ishonchli hadis to'plami." },
  { title: "Tarix ar-Rusul va al-Muluk", author: "At-Tabariy (vaf. 923)", note: "Xalifalar davri, fathlar va janglar tarixi bo'yicha muhim manba." },
  { title: "Al-Isti'ob fi ma'rifat al-ashob", author: "Ibn Abd al-Barr (vaf. 1071)", note: "Sahobalarning ismlari, nasablari va hayotlari haqidagi qomusiy asar." },
  { title: "Usd al-G'oba fi ma'rifat as-sahoba", author: "Ibn al-Asir (vaf. 1233)", note: "Sahobalar biografiyasiga bag'ishlangan keng qamrovli asar." },
  { title: "Siyar a'lam an-Nubalo", author: "Az-Zahabiy (vaf. 1348)", note: "Sahobalar va ilk islom ulamolarining hayoti bo'yicha ishonchli tadqiqot." },
  { title: "Al-Isaba fi tamyiz as-sahoba", author: "Ibn Hajar al-Asqaloniy (vaf. 1449)", note: "Sahobalarni aniqlash va ularning biografiyasini yig'ish borasidagi eng keng asarlardan biri." }
];
