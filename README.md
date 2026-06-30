# BackWords

A web app for learning English vocabulary. Type a word → get its pronunciation
(IPA + audio), definitions and example sentences (Cambridge-style) → save it to your
personal dictionary. Later: training & spaced-repetition modes.

**Status:** 🚧 Phase 1 — add & save words.

## Stack

React 19 · Vite · TypeScript · Supabase (Auth + Postgres + Row Level Security +
Edge Functions) · [Free Dictionary API](https://dictionaryapi.dev) ·
Google Gemini (Ukrainian translation). Deployed to GitHub Pages.

## AI translation (Gemini via Edge Function)

When a word is looked up, a Ukrainian translation is suggested by Google Gemini.
The call does **not** go directly from the browser — the Gemini API key would be
exposed in the client bundle. Instead it goes through a Supabase Edge Function
(`supabase/functions/translate`) that holds the key as a server-side secret:

```
browser → Edge Function (key lives here) → Gemini → translation
```

The function also requires a signed-in user (`getUser()`), so the public anon
key alone cannot call it. Gemini sees the word *and its definition*, which lets
it pick the right sense for polysemous words and phrasal verbs (e.g. "pass out"
→ «знепритомніти», not a literal word-by-word guess). The suggestion is editable
before saving, and any failure (quota, network) just leaves the field blank.

### Deploying the function

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set GEMINI_API_KEY=<your-gemini-key>
npx supabase functions deploy translate --no-verify-jwt
```

`--no-verify-jwt` lets the function handle CORS and do its own auth check; it is
still protected by the `getUser()` gate inside.

## Accounts: registration is closed by design

There is **no public sign-up** — only sign-in. This is intentional, not an
oversight:

- **It's a personal app** for me and a few friends, not a public product.
- **It protects the Gemini free-tier quota.** The translation function is gated
  to signed-in users; if anyone could register, anyone could burn the daily
  quota. With open registration off, only accounts I create can call it.

New users are added by hand in the Supabase dashboard (Authentication → Users).
Disabling sign-up is done at the source (Supabase Auth settings) — hiding the UI
alone wouldn't stop a direct API call, so the real switch is server-side.

## Roadmap & decisions

See **[PLAN.md](./PLAN.md)** (Ukrainian) for the full roadmap, data model and the
reasoning behind each architectural decision.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev                  # http://localhost:5173/backwords/
```

Other scripts: `npm run build` (type-check + production build), `npm run preview`
(serve the build locally), `npm run lint`.

## Environment variables

| Name | Description |
|------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key — safe in the client; access is protected by RLS |
