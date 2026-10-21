# ToolTrack Frontend

The web client for ToolTrack — the catalog of construction tools, appliances and
the cases they are kept in. Browse, search, add and edit item cards from a
desktop or a phone on site.

Vite + React + TypeScript + [Mantine](https://mantine.dev), talking to the Node
API in the sibling `Backend/` directory. No server of its own: the build is a
static bundle.

- [CLAUDE.md](CLAUDE.md) — how the code is organised and why.
- [`tooltrack-backend/docs/api.md`](https://github.com/lukaszspaczynski/tooltrack-backend/blob/main/docs/api.md)
  — the API this client is written against.

## Local development

The API has to be running first:

```bash
cd ../Backend
npm run db:up
npm run db:schema:apply   # first time only
npm run dev               # http://localhost:37411
```

Then:

```bash
npm install
npm run dev               # http://localhost:5173
```

Vite forwards `/api` to the API, so the browser sees one origin and the session
cookie is first-party — no CORS in development. Point it somewhere else with
`VITE_API_PROXY_TARGET`.

A fresh database has no accounts. Register from the app (every new account is a
**viewer**, so you will see the catalog and nothing else), then promote
yourself:

```bash
cd ../Backend
npm run user:admin -- --email you@example.com
```

## What is in the app

| Screen             | Needs           | What it does                                                                                                                |
| ------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Sign in / Sign up  | —               | Sign in, or open a viewer account                                                                                           |
| Catalog            | `catalog.read`  | Search, filter by kind (tool, appliance, case), category and condition, sort, paginate — every filter is in the URL         |
| Item card          | `catalog.read`  | Everything on the card: parameters, photos, manuals, place; edit, move, duplicate and delete with `catalog.write`           |
| New item           | `catalog.write` | Add a card by hand, or import one from the product page of a supported shop or maker                                        |
| Item photos        | `catalog.write` | Upload from a phone, paste a URL, pick from the web search or from photos already stored — multi-select, stored server-side |
| Background removal | `catalog.write` | Wand on a photo: method, parameters, original and result side by side, saved only on approval                               |
| Manuals            | `catalog.read`  | Every PDF in the catalog with the cards that keep it; add and delete with `catalog.write`                                   |
| Manufacturers      | `catalog.read`  | The makers the cards point at, with their colours and logos; edit with `catalog.write`                                      |
| Organiser          | `catalog.read`  | Which items lie in which case — "what is in box 4"; arrange with `catalog.write`                                            |
| Labels             | `catalog.read`  | Every label generated, printed as one A4 sheet; redraw a batch with `catalog.write`                                         |
| Addresses          | `catalog.read`  | The places items and organisers are kept: workshops, sites, vans; edit with `catalog.write`                                 |
| Photos             | `catalog.read`  | Every photo in the system; delete one or a batch with `catalog.write`, with the affected cards named first                  |
| Settings           | `catalog.read`  | Which search engines my account uses; API keys and cutout methods for the whole installation with `users.manage`            |
| Users              | `users.manage`  | Change roles, disable and delete accounts                                                                                   |

The menu and every button are rendered from the `capabilities` list the API
returns, so nothing is offered that the server would refuse.

Photos are served by the API (`/api/items/:id/photos/:photoId/file`) and used
directly as `<img src>`. The web search behind _Search the web_ only runs
when its button is pressed — see the backend README for the provider it uses
and how to point it at Google.

## Verification

```bash
npm run typecheck
npm test          # node:test over the pure modules
npm run lint      # oxlint
npm run build
```

## Deployment

`npm run build` writes a static `dist/`. Serve it from anything, with two
requirements:

1. **SPA fallback** — unknown paths must return `index.html`, or a refresh on
   `/items/7` will 404.
2. **Same origin as the API, or an allowlisted one.** Behind one reverse proxy
   (`/` to the bundle, `/api` to the Node service) nothing else is needed. If
   the API really lives on another origin, set `VITE_API_BASE_URL` at build
   time and put this origin on the backend's `TOOLTRACK_ALLOWED_ORIGINS` — a
   cookie session across origins needs both halves.
