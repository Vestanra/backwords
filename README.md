# word-nest 🪺

A web app for learning English vocabulary. Type a word → get its pronunciation
(IPA + audio), definitions and example sentences (Cambridge-style) → save it to your
personal dictionary. Later: training & spaced-repetition modes.

**Status:** 🚧 Phase 1 — add & save words.

## Stack

React 19 · Vite · TypeScript · Supabase (Auth + Postgres + Row Level Security) ·
[Free Dictionary API](https://dictionaryapi.dev). Deployed to GitHub Pages.

## Roadmap & decisions

See **[PLAN.md](./PLAN.md)** (Ukrainian) for the full roadmap, data model and the
reasoning behind each architectural decision.

## Local development

> The Vite app is not scaffolded yet — this section applies once it is.

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

## Environment variables

| Name | Description |
|------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key — safe in the client; access is protected by RLS |
