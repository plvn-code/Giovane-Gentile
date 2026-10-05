# Архитектура

## Файлы
```
index.html        главная
catalog.html      каталог (по URL-параметрам)
wishlist.html     обране
account.html      кабінет
product.html      сторінка товару (?id=)
css/styles.css    все стили (токены → компоненты → страницы → Responsive)
js/main.js        общее: Wishlist, сердечки, toast, шапка, мобильное меню, reveal, карусели главной, контактная форма, formatPhone
js/auth.js        Auth (аккаунты, сессия), окно входа/регистрации/SMS-кода, меню «Кабінет»
js/products.js    CATALOG, labelsFor, getProduct(id) (демо-генератор / REAL_PRODUCTS), relatedProducts, formatPrice
js/catalog.js     рендер страницы каталога
js/cart.js        Cart (localStorage gg_cart), мини-корзина в шапке и мобильной шапке
js/product.js     страница товара: галерея, размеры, корзина, обране, мета, поделиться, аккордеон, супутні товари
js/wishlist.js    рендер списка бажань (и на wishlist.html, и в кабинете), «Поділитися»
js/account.js     кабинет: вкладки, профиль, заказы
assets/video/     сюда положить свой hero.mp4 (см. README.txt)
docs/             документация проекта
```

Порядок подключения скриптов: `main.js` → `auth.js` → `cart.js` → далее по странице: catalog (`products.js` → `catalog.js`), product (`products.js` → `product.js`), account (`wishlist.js` → `account.js`), wishlist (`wishlist.js`).

## Данные и хранилища (localStorage)
| Ключ | Что | Формат |
|---|---|---|
| `gg_wishlist` | список бажань | `[{ id, category, section, name?, price?, oldPrice?, image?, sale, link, addedAt }]` |
| `gg_users` | демо-аккаунты | `{ "380XXXXXXXXX": { phone, name, city, branch, createdAt, orders: [...] } }` |
| `gg_session` | кто вошёл | номер телефона (только цифры) |
| `gg_cart` | кошик | `[{ key: 'id|размер', id, name, category, size, price, oldPrice, qty, sale, image }]` |

Все обращения к localStorage обёрнуты в try/catch. События: `wishlist:change`, `auth:change`, `cart:change`. Между вкладками синхронизация идёт через событие `storage`.

### Заказ (`orders[]`)
```js
{ id: 'GG-240163', date, payment: 'paid' | 'cod', status: 'В дорозі', delivery: 'Нова Пошта · Київ, Відділення №12', demo: true,
  items: [{ category, name, sku, size, qty, price, image? }] }
```
`cod` означает оплату при получении: в UI это «Не оплачено» с пояснением, что товар можно осмотреть и отказаться.

## URL
- `catalog.html?cat=odyag|vzuttya|aksesuary|new|sale&sub=<slug>`
  - **odyag:** sorochky, trykotazh, pidzhaky, shtany, verkhniy
  - **vzuttya:** tufli, lofery, kedy, cherevyky
  - **aksesuary:** remeni, ryukzaky, ubory, sharfy
  - **new / sale:** odyag, vzuttya, aksesuary
- `wishlist.html?shared=<base64 JSON>` — чужой список в режиме просмотра, кнопка «Зберегти до мого обраного».
- `account.html#profile | #orders | #wishlist` — вкладки кабинета.
- `product.html?id=<id>` — страница товара; id как у карточек (см. ниже). Неверный id → «Товар не знайдено».

## ID товаров для сердечек (пока фото и реальных товаров нет)
- Главная: `home-new-N`, `home-sale-N`.
- Каталог: `<cat>-<sub|all>-N`.

Когда появятся настоящие товары, ID нужно заменить на артикулы.

## Товар (`getProduct(id)` → объект)
```js
{ id, demo, name, category, catKey, subKey, catTitle, brand, price, oldPrice, sale, sku,
  sizes: [{ label, available }], tags: [...], description, fullDescription: [абзаци],
  attributes: { Бренд, Матеріал, Колір, Вид, Розмір, 'Країна виробника' }, images: [] }
```
Демо-генератор: бренд из BRANDS (Loro Piana, Brunello Cucinelli, ZILLI, Billionaire), цена из диапазона категории (`META`), Sale = −40%, размеры по группе (взуття 39–46, одяг 46–56, ремені 85–105, інше One size), ~28% размеров «немає в наявності».

## Где подставлять реальные данные
- **Карусели главной:** массив `PRODUCTS` в начале `js/main.js` (`category`, `name`, `price`, `oldPrice`, `image`, `badge`).
- **Карточки каталога:** функция `catalogCard()` в `js/catalog.js`.
- **Страница товара:** объект `REAL_PRODUCTS` в `js/products.js` (ключ — id товара); `images[]` покажутся в галерее вместо SOON.
- **Видео hero:** `src` у `<video class="hero__video">` в `index.html`. Сейчас это Pexels-видео 12084856 по ссылке.
- **Логотипы брендов:** сейчас текстовые вордмарки в `index.html` (`.brand__logo--*`). Нужны настоящие файлы логотипов от заказчика.

## Бэкенд (пока нет) — что подключать
- `sendSmsCode` / `verifySmsCode` в `js/auth.js` → API отправки SMS (TurboSMS / Firebase Phone Auth).
- Хранилище `Auth` (`gg_users`) → база клиентов на сервере, пароль хранить хешем на сервере.
- `branchesFor(city)` в `js/account.js` → API Новой Почты (`Address.getWarehouses`).
- Контактная форма в `initForm()` (`main.js`) — сейчас только показывает «Дякуємо». Нужно подключить отправку в Telegram-бот или на email.
