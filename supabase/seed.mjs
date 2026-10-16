/* =========================================================
   Giovane Gentile — наповнення бази демо-товарами.

   Запуск:
     SUPABASE_PAT=<supabase personal access token> \
     SUPABASE_PROJECT_REF=<ref проєкту> \
     node supabase/seed.mjs

   Спочатку створює таблиці (supabase/schema.sql), потім
   генерує ~104 тематичні товари з фото та вставляє їх.
   Жодних секретів у файлі немає — усе береться з env.
   ========================================================= */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const PAT = process.env.SUPABASE_PAT;
const REF = process.env.SUPABASE_PROJECT_REF;
if (!PAT || !REF) {
  console.error('Потрібні env: SUPABASE_PAT і SUPABASE_PROJECT_REF');
  process.exit(1);
}
const API = `https://api.supabase.com/v1/projects/${REF}/database/query`;
const sql = async (query) => {
  const r = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${t.slice(0, 300)}`);
  try { return JSON.parse(t); } catch (e) { return t; }
};

const META = {
  'Сорочки':             { group:'clothing', cat:'odyag',     sub:'sorochky',  noun:'Чоловіча сорочка', code:'SR', price:[9800,24800],  materials:['бавовна','льон','бавовна та льон'] },
  'Трикотаж':            { group:'clothing', cat:'odyag',     sub:'trykotazh', noun:'Чоловічий джемпер', code:'TR', price:[14900,46900], materials:['вовна мериноса','кашемір','вовна та кашемір'] },
  'Піджаки та костюми':  { group:'clothing', cat:'odyag',     sub:'pidzhaky',  noun:'Чоловічий піджак',  code:'PD', price:[39800,98000], materials:['вовна','вовна та шовк','льон'] },
  'Штани':               { group:'clothing', cat:'odyag',     sub:'shtany',    noun:'Чоловічі штани',    code:'ST', price:[11900,29800], materials:['вовна','бавовна','льон'] },
  'Верхній одяг':        { group:'clothing', cat:'odyag',     sub:'verkhniy',  noun:'Чоловіча куртка',   code:'VO', price:[48000,124000],materials:['вовна та кашемір','нейлон з пуховим наповнювачем','замша'] },
  'Туфлі':               { group:'shoes',    cat:'vzuttya',   sub:'tufli',     noun:'Чоловічі туфлі',    code:'TF', price:[21900,38900], materials:['гладка теляча шкіра','зерниста шкіра','замша'] },
  'Лофери':              { group:'shoes',    cat:'vzuttya',   sub:'lofery',    noun:'Чоловічі лофери',   code:'LF', price:[18900,34900], materials:['замша','гладка теляча шкіра','зерниста шкіра'] },
  'Кеди та кросівки':    { group:'shoes',    cat:'vzuttya',   sub:'kedy',      noun:'Чоловічі кросівки', code:'KD', price:[16900,32900], materials:['замша та текстиль','гладка шкіра','замша'] },
  'Черевики':            { group:'shoes',    cat:'vzuttya',   sub:'cherevyky', noun:'Чоловічі черевики', code:'CH', price:[24900,42900], materials:['зерниста шкіра','замша','гладка теляча шкіра'] },
  'Ремені':              { group:'belts',    cat:'aksesuary', sub:'remeni',    noun:'Чоловічий ремінь',  code:'RM', price:[6800,16900],  materials:['теляча шкіра','замша','плетена шкіра'] },
  'Рюкзаки та сумки':    { group:'one',      cat:'aksesuary', sub:'ryukzaky',  noun:'Чоловічий рюкзак',  code:'RK', price:[24900,64900], materials:['замша','гладка шкіра','нейлон та шкіра'] },
  'Головні убори':       { group:'one',      cat:'aksesuary', sub:'ubory',     noun:'Чоловіча шапка',    code:'UB', price:[6900,15900],  materials:['кашемір','вовна мериноса','вовна та кашемір'] },
  'Шарфи':               { group:'one',      cat:'aksesuary', sub:'sharfy',    noun:'Чоловічий шарф',    code:'SF', price:[8900,21900],  materials:['кашемір','шовк','вовна та кашемір'] },
};
const BRANDS = ['Loro Piana','Brunello Cucinelli','ZILLI','Billionaire','Kiton','Canali','Zegna'];
const SIZES = {
  shoes:['39','40','40.5','41','41.5','42','42.5','43','43.5','44','45','46'],
  clothing:['46','48','50','52','54','56'],
  belts:['85','90','95','100','105'],
  one:['One size'],
};
const COLORS = ['темно-синій','чорний','коричневий','сірий','бежевий','оливковий','кремовий'];
const COLOR_CODES = { 'темно-синій':'NB','чорний':'BK','коричневий':'BR','сірий':'GR','бежевий':'BG','оливковий':'OL','кремовий':'CR' };
const TEXTS = {
  shoes:{ lead:'Анатомічна устілка та гнучка підошва забезпечують комфорт протягом усього дня. Модель пасує як до класичного костюма, так і до casual-образу.', care:'Догляд: використовуйте засоби для шкіри або замші відповідного кольору, зберігайте взуття з колодками в оригінальному пильнику.' },
  clothing:{ lead:'Сучасна посадка та якісна тканина, яка добре тримає форму. Легко поєднується з іншими речами гардероба — від ділового до повсякденного стилю.', care:'Догляд: делікатне прання при 30 °C або професійна хімчистка, сушити в розправленому вигляді.' },
  belts:{ lead:'Класична пряжка, акуратні краї та ручна обробка шкіри. Універсальний аксесуар для костюма й джинсів.', care:'Догляд: зберігайте в розгорнутому вигляді, уникайте тривалого контакту з водою.' },
  one:{ lead:'Стриманий дизайн і продумані деталі роблять аксесуар універсальним доповненням до будь-якого образу.', care:'Догляд: зберігайте в оригінальному пильнику, делікатне чищення відповідно до матеріалу.' },
};
// Тематичні фото (Unsplash). Циклічно розподіляються між товарами.
const IMG_POOL = ['1521572163474-6864f9cf17ab','1507003211169-0a1dd7228f2d','1542291026-7eec264c27ff','1489987707025-afc232f7ea0f','1596755094514-f87e34085b2c','1594938298603-c8148c4dae35','1593030761757-71fae45fa0e7','1600269452121-4f2416e55c28','1620799140408-edc6dcb6d633','1576871337622-98d48d1cf531','1578932750294-f5075e85f44a','1551232864-3f0890e580d9','1617137968427-85924c800a22','1560243563-062bfc001d68','1543163521-1bf539c55dd2','1549298916-b41d501d3772','1595950653106-6c9ebd614d3a','1608667508764-33cf0726b13a','1491553895911-0055eca6402d','1460353581641-37baddab0fa2','1606107557195-0e29a4b5b4aa','1611312449408-fcece27cdbb7','1517438476312-10d79c077509','1473966968600-fa801b869a1a','1600185365926-3a2ce3cdb9eb','1434389677669-e08b4cac3105'];
const img = (id) => `https://images.unsplash.com/photo-${id}?w=640&h=860&fit=crop&q=80`;

function seeded(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

const PER_SUB = 8;
const products = [];
let imgIdx = 0;
for (const [category, meta] of Object.entries(META)) {
  for (let i = 1; i <= PER_SUB; i++) {
    const id = `${meta.cat}-${meta.sub}-${i}`;
    const rnd = seeded(id);
    const pick = (a) => a[Math.floor(rnd()*a.length)];
    const brand = pick(BRANDS), material = pick(meta.materials), color = pick(COLORS);
    const isNew = rnd() > 0.68, sale = rnd() > 0.78;
    const base = Math.round((meta.price[0] + rnd()*(meta.price[1]-meta.price[0]))/10)*10 - 8;
    const price = sale ? Math.round(base*0.6/10)*10 - 1 : base;
    const sizesList = SIZES[meta.group];
    const sizes = sizesList.map((label)=>({label, available: sizesList.length===1 || rnd()>0.28}));
    if(!sizes.some(s=>s.available)) sizes[0].available = true;
    const sku = `GG-${meta.code}-${Math.floor(rnd()*9000)+1000}-${COLOR_CODES[color]}`;
    const text = TEXTS[meta.group==='one'?'one':meta.group];
    const images = [0,1,2].map(() => img(IMG_POOL[(imgIdx++) % IMG_POOL.length]));
    products.push({
      id, name:`${meta.noun} ${brand}`, brand, category, cat_key:meta.cat, sub_key:meta.sub,
      cat_title: meta.cat==='odyag'?'Одяг':meta.cat==='vzuttya'?'Взуття':'Аксесуари',
      price, old_price: sale?base:null, sale, is_new:isNew, sku, material, color, sizes,
      description:`${meta.noun} від ${brand}: італійська якість, продумані деталі та бездоганна посадка. ${text.lead.split('. ')[0]}.`,
      full_description:[
        `Кожна деталь цієї моделі ${brand} створена з увагою до якості: ретельно підібрані матеріали, акуратні шви та класичний італійський підхід до крою.`,
        text.lead, `Матеріал — ${material}, колір — ${color}. Виготовлено в Італії.`, text.care,
      ],
      attributes:{ 'Бренд':brand,'Матеріал':material,'Колір':color,'Вид':category,'Розмір':sizesList.length===1?'One size':`${sizesList[0]}–${sizesList[sizesList.length-1]}`,'Країна виробника':'Італія' },
      images,
    });
  }
}

const esc = (v) => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const run = async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const ddl = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await sql(ddl);
  console.log('Схема застосована');
  await sql('truncate public.products');
  const cols = ['id','name','brand','category','cat_key','sub_key','cat_title','price','old_price','sale','is_new','sku','material','color','sizes','description','full_description','attributes','images','sort'];
  const rows = products.map((p,i)=>`(${[p.id,p.name,p.brand,p.category,p.cat_key,p.sub_key,p.cat_title,p.price,p.old_price,p.sale,p.is_new,p.sku,p.material,p.color,p.sizes,p.description,p.full_description,p.attributes,p.images,i].map(esc).join(',')})`);
  for (let i = 0; i < rows.length; i += 40) {
    await sql(`insert into public.products (${cols.join(',')}) values ${rows.slice(i,i+40).join(',')}`);
    console.log('Вставлено', Math.min(i+40, rows.length), '/', rows.length);
  }
  console.log('Готово:', (await sql('select count(*)::int n from public.products'))[0]);
};
run().catch((e) => { console.error('ПОМИЛКА', e.message); process.exit(1); });
