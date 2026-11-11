# Contributing to Flarewise

Thanks for helping. Flarewise is a static Crohn’s-friendly food catalog — no
backend, no accounts, and no personal health data in the repo.

Non-developers can suggest foods from the in-app **Add** form (see the
[README](README.md)). This page is for people changing code or food JSON
directly.

## Quick start

```bash
npm install
npm run validate-data
npm test
npm run dev
```

| Script | Role |
|--------|------|
| `npm run dev` | Local Vite app |
| `npm run build` | Production build to `dist/` |
| `npm run validate-data` | Schema + ID + tag checks on every food JSON |
| `npm test` | Unit tests (filters, dial mapping, submit helpers) |
| `npm run lint` | oxlint |
| `npm run export-catalog` | Refresh `catalog.json` / `llms` exports |
| `npm run seed-split` | Split `scripts/seed-bundle.json` into item files |

Before a PR:

```bash
npm run validate-data && npm test && npm run lint && npm run build
```

CI (`.github/workflows/ci.yml`) runs the same gate on every pull request.

## Adding or editing a food

1. One file per dish: `src/data/items/<category>/<id>.json`
2. `id` must match the filename (without `.json`)
3. At least **two** `tags`
4. `safetyTier` must match the `crohnsScore` band in [`src/data/rubric.json`](src/data/rubric.json) (`9.0–10.0` `flare-safe`, `7.5–8.9` `low-risk`, `6.5–7.4` `remission-road`, `1.0–6.4` `danger-zone`)
5. **Vacation foods (theme parks & cruises):** Must include `"vacation"` (or `"disney-cruise"` / `"cruise"`) in `tags`, plus destination tags (`"disneyland"`, `"california-adventure"`, `"knotts-berry-farm"`, `"disney-wonder"`, `"disney-magic"`, `"disney-treasure"`) when applicable. Vacation items are hidden by default unless **Vacation mode** is active in the Filters pane.
6. **Citrus & lactose guardrails:** Set `citrusFree: false` if any lemon, lime, orange, grapefruit (`1.0` hard avoid), yuzu/ponzu, or bergamot/Earl Grey is present. Naturally aged hard cheeses are `lactoseSafe: true`; unaged dairy/cream/ice cream is `lactoseSafe: false`.
7. Required fields: [`src/data/schema.json`](src/data/schema.json)
8. Run `npm run validate-data` — this is the hard gate before merge/deploy

### In-app suggest path

1. `/submit` → fill the form → **Submit for review** (pre-filled GitHub issue)
2. Maintainer applies `approved-food`
3. Ingest workflow validates (same gates as CI), commits the JSON to `main`,
   closes the issue, and deploy follows from that push

Offline drafts park in on-device storage; when back online, finish them one at
a time from the waiting list.

Labels to create on a new repo: [`.github/LABELS.md`](.github/LABELS.md)
(`new-food`, `approved-food`).

### Manual offline check

1. Load the app online once, then DevTools → Network → Offline
2. **Add** a complete food → **Save for later**
3. Go online again → banner / waiting list → **Submit for review**

## App notes

- React + Vite + TypeScript + Tailwind
- Catalog filters are URL-driven (`q`, `tag`, `meal`, …) so links are shareable
- Stars / grocery / Works·Iffy·Trigger notes are **localStorage only** — never
  commit them
- `research/` is gitignored private notes — do not add it

## Publishing (GitHub Pages + Cloudflare)

Live app: **https://flarewise.menas.co**

| Piece | Setting |
|-------|---------|
| Pages source | Settings → Pages → Source: **GitHub Actions** |
| Custom domain | `flarewise.menas.co` (GitHub Pages) |
| Build base | `VITE_BASE=/` (hostname root, not `/flarewise/`) |
| CNAME file | `public/CNAME` → `flarewise.menas.co` (copied into `dist/`) |
| Cloudflare DNS | Zone `menas.co`: `flarewise` **CNAME** → `iammenasco.github.io` (**DNS only** / grey cloud so GitHub can issue HTTPS) |
| Share / unfurl | Site OG in `index.html` + `/og.png`; per-food pages at `/f/<id>/` (built by `npm run export-catalog`) |
| Labels | `new-food`, `approved-food` (see [LABELS.md](.github/LABELS.md)) |

Push to `main` runs deploy. Issue submit links use `VITE_GITHUB_OWNER=iammenasco` / `VITE_GITHUB_REPO=flarewise`.

## What not to commit

- Anything under `research/`
- Personal medical notes, bot configs, API keys, or `.env` files
- Generated `dist/` output

## License

By contributing you agree your changes are MIT-licensed with the project.
