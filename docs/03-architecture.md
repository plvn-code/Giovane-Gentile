# Архитектура

## Файлы
```
index.html        главная
catalog.html      каталог (по URL-параметрам)
wishlist.html     обране
account.html      кабінет
css/styles.css    все стили (токены → компоненты → страницы → Responsive)
js/main.js        общее: Wishlist, сердечки, toast, шапка, мобильное меню, reveal, карусели главной, контактная форма, formatPhone
js/auth.js        Auth (аккаунты, сессия), окно входа/регистрации/SMS-кода, меню «Кабінет»
js/catalog.js     CATALOG (разделы/подразделы), рендер страницы каталога
js/wishlist.js    рендер списка бажань (и на wishlist.html, и в кабинете), «Поділитися»
js/account.js     кабинет: вкладки, профиль, заказы
assets/video/     сюда положить свой hero.mp4 (см. README.txt)
docs/             документация проекта
```

Порядок подключения скриптов: `main.js` → `auth.js` → (`catalog.js` | `wishlist.js` + `account.js`).

## Данные и хранилища (localStorage)
| Ключ | Что | Формат |
|---|---|---|
| `gg_wishlist` | список бажань | `[{ id, category, section, name?, price?, oldPrice?, image?, sale, link, addedAt }]` |
| `gg_users` | демо-аккаунты | `{ "380XXXXXXXXX": { phone, name, city, branch, createdAt, orders: [...] } }` |
| `gg_session` | кто вошёл | номер телефона (только цифры) |

Все обращения к localStorage обёрнуты в try/catch. События: `wishlist:change`, `auth:change`. Между вкладками синхронизация идёт через событие `storage`.

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

## ID товаров для сердечек (пока фото и реальных товаров нет)
- Главная: `home-new-N`, `home-sale-N`.
- Каталог: `<cat>-<sub|all>-N`.

Когда появятся настоящие товары, ID нужно заменить на артикулы.

## Где подставлять реальные данные
- **Карусели главной:** массив `PRODUCTS` в начале `js/main.js` (`category`, `name`, `price`, `oldPrice`, `image`, `badge`).
- **Карточки каталога:** функция `catalogCard()` в `js/catalog.js`.
- **Видео hero:** `src` у `<video class="hero__video">` в `index.html`. Сейчас это Pexels-видео 12084856 по ссылке.
- **Логотипы брендов:** сейчас текстовые вордмарки в `index.html` (`.brand__logo--*`). Нужны настоящие файлы логотипов от заказчика.

## Бэкенд (пока нет) — что подключать
- `sendSmsCode` / `verifySmsCode` в `js/auth.js` → API отправки SMS (TurboSMS / Firebase Phone Auth).
- Хранилище `Auth` (`gg_users`) → база клиентов на сервере, пароль хранить хешем на сервере.
- `branchesFor(city)` в `js/account.js` → API Новой Почты (`Address.getWarehouses`).
- Контактная форма в `initForm()` (`main.js`) — сейчас только показывает «Дякуємо». Нужно подключить отправку в Telegram-бот или на email.
