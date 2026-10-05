/* =========================================================
   Giovane Gentile — каталог і дані товарів

   CATALOG — розділи та підрозділи (використовують catalog.js і product.js).

   ⚠ ДЕМО: справжніх товарів поки немає. getProduct(id) генерує
   правдоподібні дані (назва, бренд, ціна, розміри, характеристики)
   за категорією картки — однаково для одного й того самого id.
   Коли з'являться реальні товари, заповніть REAL_PRODUCTS:
   getProduct() спочатку шукає товар там.
   ========================================================= */

const CATALOG = {
  odyag: {
    title: 'Одяг',
    subs: {
      sorochky: 'Сорочки',
      trykotazh: 'Трикотаж',
      pidzhaky: 'Піджаки та костюми',
      shtany: 'Штани',
      verkhniy: 'Верхній одяг',
    },
  },
  vzuttya: {
    title: 'Взуття',
    subs: {
      tufli: 'Туфлі',
      lofery: 'Лофери',
      kedy: 'Кеди та кросівки',
      cherevyky: 'Черевики',
    },
  },
  aksesuary: {
    title: 'Аксесуари',
    subs: {
      remeni: 'Ремені',
      ryukzaky: 'Рюкзаки та сумки',
      ubory: 'Головні убори',
      sharfy: 'Шарфи',
    },
  },
  new: {
    title: 'Новинки',
    subs: { odyag: 'Одяг', vzuttya: 'Взуття', aksesuary: 'Аксесуари' },
  },
  sale: {
    title: 'Sale',
    badge: 'Sale',
    subs: { odyag: 'Одяг', vzuttya: 'Взуття', aksesuary: 'Аксесуари' },
  },
};

/* Назви підкатегорій для підписів карток (для «Новинки» / «Sale» — усі підкатегорії групи) */
function labelsFor(catKey, subKey) {
  const cat = CATALOG[catKey];

  if (catKey === 'new' || catKey === 'sale') {
    const groups = subKey ? [subKey] : Object.keys(cat.subs);
    return groups.flatMap((g) => Object.values(CATALOG[g].subs));
  }
  return subKey ? [cat.subs[subKey]] : Object.values(cat.subs);
}

/* ---------- Реальні товари (заповнити, коли будуть) ----------
   'id': { name, category, brand, price, oldPrice, sku, sizes: [{ label, available }],
           description, fullDescription: [..], attributes: { Матеріал, Колір, ... }, images: [..] }
*/
const REAL_PRODUCTS = {};

/* ---------- Довідники для демо-даних ---------- */
const BRANDS = ['Loro Piana', 'Brunello Cucinelli', 'ZILLI', 'Billionaire'];

const SIZES = {
  shoes: ['39', '40', '40.5', '41', '41.5', '42', '42.5', '43', '43.5', '44', '45', '46'],
  clothing: ['46', '48', '50', '52', '54', '56'],
  belts: ['85', '90', '95', '100', '105'],
  one: ['One size'],
};

const META = {
  'Сорочки': { group: 'clothing', cat: 'odyag', sub: 'sorochky', noun: 'Чоловіча сорочка', code: 'SR', price: [9800, 24800], materials: ['бавовна', 'льон', 'бавовна та льон'] },
  'Трикотаж': { group: 'clothing', cat: 'odyag', sub: 'trykotazh', noun: 'Чоловічий джемпер', code: 'TR', price: [14900, 46900], materials: ['вовна мериноса', 'кашемір', 'вовна та кашемір'] },
  'Піджаки та костюми': { group: 'clothing', cat: 'odyag', sub: 'pidzhaky', noun: 'Чоловічий піджак', code: 'PD', price: [39800, 98000], materials: ['вовна', 'вовна та шовк', 'льон'] },
  'Штани': { group: 'clothing', cat: 'odyag', sub: 'shtany', noun: 'Чоловічі штани', code: 'ST', price: [11900, 29800], materials: ['вовна', 'бавовна', 'льон'] },
  'Верхній одяг': { group: 'clothing', cat: 'odyag', sub: 'verkhniy', noun: 'Чоловіча куртка', code: 'VO', price: [48000, 124000], materials: ['вовна та кашемір', 'нейлон з пуховим наповнювачем', 'замша'] },
  'Туфлі': { group: 'shoes', cat: 'vzuttya', sub: 'tufli', noun: 'Чоловічі туфлі', code: 'TF', price: [21900, 38900], materials: ['гладка теляча шкіра', 'зерниста шкіра', 'замша'] },
  'Лофери': { group: 'shoes', cat: 'vzuttya', sub: 'lofery', noun: 'Чоловічі лофери', code: 'LF', price: [18900, 34900], materials: ['замша', 'гладка теляча шкіра', 'зерниста шкіра'] },
  'Кеди та кросівки': { group: 'shoes', cat: 'vzuttya', sub: 'kedy', noun: 'Чоловічі кросівки', code: 'KD', price: [16900, 32900], materials: ['замша та текстиль', 'гладка шкіра', 'замша'] },
  'Черевики': { group: 'shoes', cat: 'vzuttya', sub: 'cherevyky', noun: 'Чоловічі черевики', code: 'CH', price: [24900, 42900], materials: ['зерниста шкіра', 'замша', 'гладка теляча шкіра'] },
  'Ремені': { group: 'belts', cat: 'aksesuary', sub: 'remeni', noun: 'Чоловічий ремінь', code: 'RM', price: [6800, 16900], materials: ['теляча шкіра', 'замша', 'плетена шкіра'] },
  'Рюкзаки та сумки': { group: 'one', cat: 'aksesuary', sub: 'ryukzaky', noun: 'Чоловічий рюкзак', code: 'RK', price: [24900, 64900], materials: ['замша', 'гладка шкіра', 'нейлон та шкіра'] },
  'Головні убори': { group: 'one', cat: 'aksesuary', sub: 'ubory', noun: 'Чоловіча шапка', code: 'UB', price: [6900, 15900], materials: ['кашемір', 'вовна мериноса', 'вовна та кашемір'] },
  'Шарфи': { group: 'one', cat: 'aksesuary', sub: 'sharfy', noun: 'Чоловічий шарф', code: 'SF', price: [8900, 21900], materials: ['кашемір', 'шовк', 'вовна та кашемір'] },
};
/* Підписи з каруселей головної → категорії */
const ALIASES = { 'Піджаки': 'Піджаки та костюми', 'Аксесуари': 'Ремені', 'Кеди, кросівки': 'Кеди та кросівки' };

const COLORS = ['темно-синій', 'чорний', 'коричневий', 'сірий', 'бежевий', 'оливковий', 'кремовий'];
const COLOR_CODES = { 'темно-синій': 'NB', 'чорний': 'BK', 'коричневий': 'BR', 'сірий': 'GR', 'бежевий': 'BG', 'оливковий': 'OL', 'кремовий': 'CR' };

const TEXTS = {
  shoes: {
    lead: 'Анатомічна устілка та гнучка підошва забезпечують комфорт протягом усього дня. Модель пасує як до класичного костюма, так і до casual-образу.',
    care: 'Догляд: використовуйте засоби для шкіри або замші відповідного кольору, зберігайте взуття з колодками в оригінальному пильнику.',
  },
  clothing: {
    lead: 'Сучасна посадка та якісна тканина, яка добре тримає форму. Легко поєднується з іншими речами гардероба — від ділового до повсякденного стилю.',
    care: 'Догляд: делікатне прання при 30 °C або професійна хімчистка, сушити в розправленому вигляді.',
  },
  belts: {
    lead: 'Класична пряжка, акуратні краї та ручна обробка шкіри. Універсальний аксесуар для костюма й джинсів.',
    care: 'Догляд: зберігайте в розгорнутому вигляді, уникайте тривалого контакту з водою.',
  },
  one: {
    lead: 'Стриманий дизайн і продумані деталі роблять аксесуар універсальним доповненням до будь-якого образу.',
    care: 'Догляд: зберігайте в оригінальному пильнику, делікатне чищення відповідно до матеріалу.',
  },
};

/* Детермінований «випадковий» генератор на основі id */
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Розбір id картки → { category, sale, isNew, catKey, subKey, index } */
function parseProductId(id) {
  const m = String(id || '').match(/^home-(new|sale)-(\d+)$/);
  if (m) {
    const list = (typeof PRODUCTS !== 'undefined' && PRODUCTS[m[1]]) || [];
    const p = list[Number(m[2]) - 1];
    if (!p) return null;
    return { category: ALIASES[p.category] || p.category, sale: m[1] === 'sale', isNew: m[1] === 'new', catKey: m[1], subKey: null, index: Number(m[2]) };
  }

  const c = String(id || '').match(/^([a-z]+)-([a-z]+)-(\d+)$/);
  if (!c || !CATALOG[c[1]]) return null;
  const [, catKey, sub, n] = c;
  const subKey = sub === 'all' ? null : sub;
  if (subKey && !CATALOG[catKey].subs[subKey]) return null;
  const labels = labelsFor(catKey, subKey);
  const category = labels[(Number(n) - 1) % labels.length];
  return { category, sale: catKey === 'sale', isNew: catKey === 'new', catKey, subKey, index: Number(n) };
}

function getProduct(id) {
  if (REAL_PRODUCTS[id]) return { id, ...REAL_PRODUCTS[id] };

  const info = parseProductId(id);
  if (!info || !META[info.category]) return null;

  const meta = META[info.category];
  const rnd = seeded(id);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  const brand = pick(BRANDS);
  const material = pick(meta.materials);
  const color = pick(COLORS);
  const base = Math.round((meta.price[0] + rnd() * (meta.price[1] - meta.price[0])) / 10) * 10 - 8;
  const price = info.sale ? Math.round(base * 0.6 / 10) * 10 - 1 : base;
  const sizesList = SIZES[meta.group];
  const sizes = sizesList.map((label) => ({ label, available: sizesList.length === 1 || rnd() > 0.28 }));
  if (!sizes.some((s) => s.available)) sizes[0].available = true;

  const sku = `GG-${meta.code}-${Math.floor(rnd() * 9000) + 1000}-${COLOR_CODES[color]}`;
  const text = TEXTS[meta.group === 'one' ? 'one' : meta.group];
  const tags = [info.category];
  if (info.isNew) tags.push('Новинки');
  if (info.sale) tags.push('Sale');

  return {
    id,
    demo: true,
    name: `${meta.noun} ${brand}`,
    category: info.category,
    catKey: meta.cat,
    subKey: meta.sub,
    catTitle: CATALOG[meta.cat].title,
    brand,
    price,
    oldPrice: info.sale ? base : null,
    sale: info.sale,
    sku,
    sizes,
    tags,
    description: `${meta.noun} від ${brand}: італійська якість, продумані деталі та бездоганна посадка. ${text.lead.split('. ')[0]}.`,
    fullDescription: [
      `Кожна деталь цієї моделі ${brand} створена з увагою до якості: ретельно підібрані матеріали, акуратні шви та класичний італійський підхід до крою.`,
      text.lead,
      `Матеріал — ${material}, колір — ${color}. Виготовлено в Італії.`,
      text.care,
    ],
    attributes: {
      'Бренд': brand,
      'Матеріал': material,
      'Колір': color,
      'Вид': info.category,
      'Розмір': sizesList.length === 1 ? 'One size' : `${sizesList[0]}–${sizesList[sizesList.length - 1]}`,
      'Країна виробника': 'Італія',
    },
    images: [],
    source: info,
  };
}

/* Супутні товари: інші товари тієї ж підкатегорії */
function relatedProducts(product, count = 8) {
  const ids = [];
  for (let n = 1; ids.length < count && n <= 40; n += 1) {
    const id = `${product.catKey}-${product.subKey}-${n}`;
    if (id !== product.id) ids.push(id);
  }
  return ids.map(getProduct).filter(Boolean);
}

const formatPrice = (n) => `${Math.round(n).toLocaleString('uk-UA').replace(/\s|,/g, ' ')} ₴`;
