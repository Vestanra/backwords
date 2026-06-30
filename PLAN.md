# BackWords 🪺

Веб-застосунок для вивчення англійських слів: вводиш слово → підтягується вимова
(IPA + аудіо), визначення й приклади (як у Cambridge Dictionary) → зберігаєш у свій
особистий словник. Згодом — режими тренування та повторення.

> Робочий документ. Оновлюємо по ходу роботи. Мова: українська
> (README — англійською, для портфоліо).

---

## 🎯 Що це і для кого

- **Особистий словник:** кожен користувач має свій набір слів (multi-user).
- **Фокус на вимові:** IPA + програвання mp3.
- **Натхнення:** dictionary.cambridge.org.
- **Адаптивний веб (mobile-first)** — гарно відкривається з телефона, як `running-calculator`.
  Можливий майбутній нативний застосунок — окремий тренувальний етап (не зараз).

---

## 🧱 Стек (рішення прийняті)

| Шар | Технологія | Чому |
|---|---|---|
| UI | **React 19 + Vite + TypeScript** | Як у `running-events-nextrun` (найсвіжіший проєкт); TS ловить помилки на компіляції |
| Стилі | TBD (дизайн — через Claude) | Лишаємо гнучким; ймовірно styled-components (вже знайома) або CSS modules |
| Бекенд/БД | **Supabase** (Postgres + Auth + RLS; пізніше Edge Functions) | Одне рішення = база + акаунти + безпечний проксі для AI-ключа. Free tier |
| Словник | **dictionaryapi.dev** (Free Dictionary API) | Без ключа; дає IPA, audio (mp3), визначення, приклади |
| AI (Фаза 2) | OpenAI / Claude API через Edge Function | Приклади, пояснення, колокації, поради. Ключ — лише на сервері |
| Деплой | **GitHub Pages** (як `running-calculator`) | Безкоштовно; SPA з `404.html`-трюком для роутингу |

---

## 🧭 Ключові архітектурні рішення (і чому)

1. **Кешуємо результат у себе.** Зовнішні API (словник, потім AI) викликаються
   **один раз — у момент додавання слова**. Результат зберігаємо в Supabase. Список і
   тренування працюють уже з нашої бази → менше викликів (ліміти/гроші), миттєве завантаження.
2. **Multi-user через Auth + RLS.** Кожен юзер має `user_id`; Row Level Security пускає
   до рядка лише власника. 1 база — кожен бачить лише свої слова. (Саме тому Supabase,
   а не localStorage.)
3. **`status` як основа + ручне керування.** Слово має статус `new | learning | learned`
   (історія + база для повторень). Користувач може **міняти статус вручну** і **видаляти**
   слово (hard-delete; RLS delete-політика вже є). Тобто статус — основний механізм, але
   видалення теж підтримуємо.
4. **API-ключ ніколи не у фронтенді.** OpenAI/Claude викликаємо через Supabase Edge
   Function (проксі), щоб ключ лишався на сервері. (Фаза 2.)
5. **`anon key` — публічний за задумом.** Його кладемо у фронтенд (через `VITE_`-env),
   і це безпечно: захист дають **RLS-політики на сервері**, а не схованість ключа.

---

## 🗃️ Модель даних — таблиця `words`

```sql
create table public.words (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid()
                   references auth.users(id) on delete cascade,
  term             text not null,
  ipa              text,
  audio_url        text,
  definitions      jsonb not null default '[]'::jsonb,
  status           text not null default 'new'
                   check (status in ('new','learning','learned')),
  -- розклад повторень (Leitner); заповнюється під час тренувань (Фаза 3)
  box              smallint not null default 0,
  last_reviewed_at timestamptz,
  next_review_at   timestamptz,            -- null = не заплановано; <= now() => "повторити"
  times_seen       integer not null default 0,
  times_correct    integer not null default 0,
  created_at       timestamptz not null default now(),

  unique (user_id, term)
);

alter table public.words enable row level security;

create policy "select own words" on public.words
  for select using (auth.uid() = user_id);

create policy "insert own words" on public.words
  for insert with check (auth.uid() = user_id);

create policy "update own words" on public.words
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "delete own words" on public.words
  for delete using (auth.uid() = user_id);

-- швидкі вибірки "що повторити" та сортування
create index words_user_due_idx on public.words (user_id, next_review_at);
```

Поля коротко:

- `id` — UUID, авто-генерується.
- `user_id` — власник рядка; `default auth.uid()` (підставляється сам), `on delete cascade`.
- `term` — слово, **нормалізоване** (lowercase + trim).
- `ipa`, `audio_url` — транскрипція + mp3 (nullable — не для кожного слова є).
- `definitions` — **JSONB**: вкладена структура з Dictionary API
  (частини мови → визначення → приклади).
- `status` — `new | learning | learned` (захист `check` на рівні БД). **Групування** у UI —
  саме за статусом (вкладки), без ручних тегів/колод.
- `box`, `last_reviewed_at`, `next_review_at`, `times_seen`, `times_correct` — поля
  **розкладу повторень** (Leitner). Додані наперед, щоб не мігрувати під тренування (Фаза 3).
  Вкладка **«Повторити»** — *похідна*: слова, де `next_review_at <= now()`. Тобто слово не
  живе вічно в «повторити» — воно стає due → ти його повторюєш → повертається в learning/learned.
- `created_at` — для сортування й повторень.
- `unique (user_id, term)` — одне слово на юзера не двічі. Захист на рівні **БД**, а не в
  JS → немає **race condition** від подвійного кліку.

**RLS:** `using (...)` = які рядки видно/чіпати; `with check (...)` = що дозволено записати.
Навіть якщо хтось через DevTools спробує дістати чужі слова — БД поверне порожньо.

---

## 🔄 Користувацький флоу (Фаза 1)

```
ввід слова
  → lookup у dictionaryapi.dev (на сабміт: Enter / кнопка)
  → картка-прев'ю (IPA, 🔊, визначення, приклади)
  → кнопка «Додати»
  → запис у Supabase (words)
  → показ у списку «Мої слова»
```

Розділяємо **«прев'ю»** і **«зберегти»**. Lookup робимо **на сабміт, а не live-debounce**:
dictionaryapi.dev матчить ціле слово (не префікс), тож запити по неповних словах давали б
переважно 404 і марний трафік.

---

## 🗺️ Роадмеп

### Фаза 1 — Додавання + збереження (поточна)

- [x] Рішення по стеку, базі та моделі даних
- [x] Створити репозиторій + цей план
- [x] Зскафолдити React + Vite + TS застосунок
- [x] Підключити `@supabase/supabase-js` (клієнт + env)
- [x] Auth: реєстрація / вхід (Supabase Auth)
- [x] Екран пошуку: ввід → dictionaryapi.dev → прев'ю-картка
- [x] Кнопка «Додати» → запис у `words`
- [x] Список «Мої слова» (аудіо, зміна статусу, видалення, вкладки-фільтри)
- [x] Адаптив (mobile-first) — базова гумова сітка; детальний дизайн пізніше через Claude design
- [ ] **Створити Supabase-проєкт + застосувати схему `words` + RLS** ← ручний крок користувача;
      без нього код є, але runtime (auth/збереження) не запрацює
- [ ] Деплой на GitHub Pages

### Фаза 2 — Збагачення

> **Обмеження: усе має лишатися безкоштовним.** Платний LLM (OpenAI/Claude за токени +
> картка) — неприйнятно. Рішення відкладено; повернемось перед стартом фази.
> Безкоштовні варіанти без картки: синоніми/приклади зі словника, [Datamuse API](https://www.datamuse.com/api/)
> (колокації, схожі слова), або free-tier LLM (напр. Google Gemini) — лише якщо влаштує.

- [ ] Обрати безкоштовне джерело збагачення (без LLM / free-tier LLM)
- [ ] Приклади, пояснення, колокації, поради при додаванні слова

### Фаза 3 — Тренування

- [ ] Зміна `status` (learning / learned)
- [ ] Режими тренувань (flashcards, тести)
- [ ] Spaced repetition

---

## 💸 Безкоштовність — нотатки

- **Supabase Free:** ~500 MB БД, ~50k користувачів, без картки. Проєкт «засинає» після
  ~7 днів простою → кнопка **Restore**, дані не зникають.
- **Фаза 1 = $0** (Supabase + dictionaryapi.dev).
- **Вимога: $0 і далі.** Фаза 2 (збагачення) — лише безкоштовні джерела; платний LLM
  відкладено/під питанням (див. Фаза 2).

---

## 📝 Конвенції

- Робочі зміни — через **гілки + PR**, не пушимо прямо в `main` після старту.
- `.env.local` — тільки локально, у `.gitignore`. Перелік змінних — у `.env.example`.
- Префікс env для Vite — `VITE_` (інакше змінна не потрапить у браузерний бандл).
