# ToolTrack Frontend

The web client for ToolTrack — the catalog of construction tools. Browse,
search, add and edit tool cards from a desktop or a phone on site.

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

| Screen             | Needs          | What it does                                                                                     |
| ------------------ | -------------- | ------------------------------------------------------------------------------------------------ |
| Sign in / Sign up  | —              | Sign in, or open a viewer account                                                                |
| Catalog            | `tools.read`   | Search, filter by category and condition, sort, paginate                                         |
| Item card          | `tools.read`   | Everything on the card; edit and delete with `tools.write`                                       |
| New item           | `tools.write`  | Add a card; the category field suggests the ones already in use                                  |
| Item photos        | `tools.write`  | Upload from a phone, paste a URL, or pick from the web search — multi-select, stored server-side |
| Background removal | `tools.write`  | Wand on a photo: method, parameters, original and result side by side, saved only on approval    |
| Photos             | `tools.read`   | Every photo in the system; delete one or a batch, with the affected tools named first            |
| Settings           | `tools.read`   | Which search engines my account uses; API keys for the whole installation with `users.manage`    |
| Users              | `users.manage` | Change roles, disable and delete accounts                                                        |

The menu and every button are rendered from the `capabilities` list the API
returns, so nothing is offered that the server would refuse.

Photos are served by the API (`/api/tools/:id/photos/:photoId/file`) and used
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
   `/tools/7` will 404.
2. **Same origin as the API, or an allowlisted one.** Behind one reverse proxy
   (`/` to the bundle, `/api` to the Node service) nothing else is needed. If
   the API really lives on another origin, set `VITE_API_BASE_URL` at build
   time and put this origin on the backend's `TOOLTRACK_ALLOWED_ORIGINS` — a
   cookie session across origins needs both halves.
