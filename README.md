# penta spoof — сайт + админ-панель + раздача спуфера

React 19 + Vite + Tailwind, бэк **Supabase** (Postgres + Auth + Storage, бесплатный тариф).
Хэш-роутер — работает на любом статик-хостинге без настроек сервера.

## Страницы

| hash | что |
|---|---|
| `#/` | лендинг: слои подмены, версия, кнопки входа |
| `#/register` | регистрация: юзер + пароль + автоматическое считывание HWID |
| `#/login` | вход по юзеру и паролю |
| `#/gate` | активация 24-симв ключа (6 групп по 4, вставка целого ключа работает) |
| `#/dash` | дашборд: лицензия, HWID, версия, кнопка скачать, changelog |
| `#/admin` | админ-панель: генератор ключей, юзеры, баны, сброс HWID, логи, конфиг билда |

## Ключ

24 символа `A-Z0-9` без похожих (`O/0/I/1`). Отображение: `XXXX-XXXX-XXXX-XXXX-XXXX-XXXX`.
Генерация — в админке batch'ем (1–200 за раз) или в БД через `select public.gen_key();`.
Первое использование привязывает ключ к HWID; при `max_hwid_binds = 1` повторная активация
на другой машине падает с ошибкой.

## Порядок запуска — 15 минут

### 1. Supabase (бэк)

1. https://supabase.com → **New project** (регион ближайший).
2. **SQL Editor** → вставить целиком `supabase/schema.sql` → **Run**.
3. **Authentication → Providers → Email**: выключить *Confirm email* (иначе вход не сработает без письма).
4. **Project Settings → API**: скопировать `Project URL` и `anon public key`.

### 2. Локальный прогон

```bash
cp .env.example .env      # вписать VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:5173
```

### 3. Свой админ

1. На сайте `#/register` — создать аккаунт (например `swan` / пароль).
2. Supabase → **SQL Editor**:

```sql
update public.profiles set role='admin' where username='swan';
```

3. Перезайти → на дашборде появится кнопка **админ-панель** (`#/admin`).

### 4. Файл спуфера

Вариант A — Supabase Storage (рекомендую):
1. **Storage → New bucket** → имя `builds`, **Public bucket = on**.
2. Загрузить `penta-spoof-1.0.0.zip`.
3. Кликнуть по файлу → **Copy public URL**.

Вариант B — любое другое место (Google Drive прямая ссылка, свой VPS, GitHub Releases).
Главное — прямая ссылка на файл, без HTML-обёртки.

### 5. Привязать ссылку

`#/admin` → вкладка **конфиг билда** → вставить URL в `download_url` → **сохранить ссылку**.
Там же `latest_version` и `changelog` (оба видны юзерам в кабинете).

### 6. Бесплатный хост — фронт

**Netlify** (проще всего):
1. https://app.netlify.com → **Add new site → Deploy manually**.
2. Локально `npm run build` → перетащить папку `dist` в окно браузера.
3. Сайт сразу на `https://<имя>.netlify.app`. Домен меняется в **Site settings → Change site name**.

Либо через git: **Import from Git** → репозиторий → build `npm run build`, publish `dist`,
переменные `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` в **Site settings → Environment variables**.

**Cloudflare Pages** (быстрее в РФ/СНГ):
1. https://pages.cloudflare.com → **Create project → Direct Upload** → папка `dist`.
2. Или Connect to Git: build command `npm run build`, output `dist`, env-переменные там же.

**Vercel**: `npm i -g vercel && vercel --prod`, env через `vercel env add`.

Все три бесплатны, без карточки. Netlify даёт 100 GB трафика/мес, Cloudflare Pages — безлимит.

## Что где лежит

| файл | что |
|---|---|
| `src/App.tsx` | роутер + guard на закрытые страницы |
| `src/lib/supabase.ts` | клиент, `readHwid()` (canvas+экран+таймзона), `fmtKey()`, `validKey()` |
| `src/lib/session.tsx` | сессия, вход/регистрация (логин синтезируется как `<ник>@penta.local`), `activate()` |
| `src/pages/Landing.tsx` | лендинг |
| `src/pages/Auth.tsx` | вход и регистрация |
| `src/pages/Gate.tsx` | 24-симв ключ, автопереход между группами, вставка целого ключа |
| `src/pages/Dashboard.tsx` | кабинет, скачивание, changelog |
| `src/pages/Admin.tsx` | генератор ключей, юзеры, баны, сброс HWID, логи, конфиг |
| `supabase/schema.sql` | таблицы, RLS, `activate_key()`, `gen_key()`, триггер профиля |

## Логика активации (`public.activate_key`)

1. Нормализация ключа: upper + удаление разделителей.
2. Проверки: существует / не отозван / не занят другим юзером / HWID совпадает при однобиндовом ключе.
3. Запись `used_by`, `used_at`, `bound_hwid`.
4. Срок: база = `max(now, expires_at)` юзера → `+ duration_days`.
5. Профиль получает `plan` и новый `expires_at`, в `key_events` пишется событие `activated`.

## Что допилить потом

- **Настоящий HWID-ридер**: сейчас считается в браузере (canvas+экран+таймзона). Для жёсткой
  привязки добавить в спуфер экспорт `GetBinding()` (SMBIOS UUID + volume serial + MAC до спуфа)
  и проверять подпись на бэке — тогда браузерный отпечаток станет вторым фактором.
- **Смена пароля / email** — сейчас только вход.
- **Тикеты** — таблица + вкладка в админке.
- **Edge Function для скачивания** — вместо публичного URL бакета: подписанная ссылка с проверкой
  активной лицензии (закрытый бакет + `createSignedUrl`), чтобы файл не утёк по прямой ссылке.
- **Ограничение регистраций** — капча (Turnstile) + rate limit на `auth.signUp`.
