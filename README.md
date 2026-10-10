# fiber-queue

A local-first knitting/crochet project queue that cross-references your actual yarn stash against pattern requirements — built because Ravelry's own queue UI is hard to sort/filter, and "yardage per project" always ends up as a manual spreadsheet exercise otherwise.

It answers two directions of the same question:

- **Per project**: "do I have enough of the right yarn for this pattern?"
- **Per yarn**: "what can I actually make with this pile of stash?" — including mixing two different colorways/weights for patterns worked with strands held together.

## Features

- **Add from Ravelry** — paste a pattern URL, it pulls name, category, craft, yardage, weight, needle/hook sizes, gauge, suggested yarn, and photo automatically. Detects duplicates by Ravelry pattern ID before adding.
- **Manual entry** — for patterns that aren't on Ravelry at all, including a pasted reference-image URL.
- **Yarn inventory** — synced live from a Google Sheet (no copy-paste), normalized to a common weight scale since the sheet and Ravelry never agree on labels.
- **Matching** — same-colorway stash rows pool together and get checked against a pattern's yardage requirement, weight-class by weight-class. Patterns worked with multiple strands held together (e.g. a lace + a worsted held double) get matched per-strand.
- **"What can I make?"** — the reverse lookup: select stash colorways and see every project at that weight you have enough for. Select exactly two different weights and it also checks which held-together patterns call for that specific pairing.
- **Breathability** — Ravelry's pattern tags (lace, cables, colorwork, ribbed, ...) get turned into an airy/dense/neutral signal per pattern, filterable alongside weight and category. Useful for "I have a lot of warm DK merino, which of my 100 queued patterns will actually be wearable indoors" style triage.
- **Yarn notes** — a suggested-use note per yarn (brand-wide or colorway-specific), either hand-written from experience or a live-derived guess from the fiber content (alpaca drapes and sags, cotton has no stretch, mohair adds warmth and a halo, etc.) when no note has been saved yet.
- **Queue / Completed tabs**, category-grouped sections with a fixed display order, filters for status/category/craft/weight/breathability/pattern-status/designer.

## Stack

- **Server**: Express + better-sqlite3 + zod, TypeScript, port 4201
- **Web**: React + Vite, TypeScript, port 4175 (proxies `/api` and `/images` to the server)
- **Data**: SQLite at `data/fiber-queue.db`; images downloaded to `data/images/` — both gitignored, local-only

## Getting started

```bash
npm install
```

Create `.env.local` in the project root:

```
RAVELRY_API_KEY=read-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RAVELRY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
YARN_SHEET_ID=<the id from your Google Sheet's URL>
```

Ravelry credentials come from a free personal, read-only key at [ravelry.com/pro/developer](https://www.ravelry.com/pro/developer) (you may need to join the `ravelry-api` group first). The Google Sheet needs to be shared "anyone with the link" — the server fetches its CSV export directly, no Google auth involved.

```bash
npm run dev
```

Opens the server on `:4201` and the web app on `:4175`.

## How the data actually flows

- **Ravelry**: a plain pattern URL (no login) embeds the numeric pattern ID in its HTML, which resolves to a full API call for structured data. Weight is normalized from Ravelry's `yarn_weight.name` to a 0–6 CYC bucket. Tunisian crochet has no distinct `craft` value in Ravelry's data — it's detected from a `tunisian` tag buried in `pattern_attributes`.
- **Yarn sheet**: fetched directly via Google's CSV export endpoint on every sync — a full replace, not a merge, since there's no stable key across sheet edits. Yarn notes live in a separate table for exactly this reason: a note attached to the `yarns` table itself would get wiped on every sync.
- **Category**: Ravelry's full breadcrumb (`Categories > Clothing > Sweater > Pullover`) gets collapsed to a short section name (`Pullover`) server-side at fetch/refresh time, with a couple of manual overrides for category names that are really the same thing (`Sleeveless Top`/`Tee` → `Tops`).
- **Per-size and per-strand yardage**: Ravelry only exposes one combined yardage range for the whole size run and the whole combined weight — per-size and per-strand breakdowns live in free-text materials descriptions in whatever format the designer chose, so those are filled in by hand rather than guessed at unreliably.
