# ToolTrack Frontend — working notes

The web client for ToolTrack, the construction tool catalog. It is read on a
phone, on site, by people wearing gloves: mobile-first, large controls, no
screen that needs a horizontal scroll.

Vite + React + TypeScript + Mantine, talking to the Node API in the sibling
`Backend/` directory. There is no server of its own — this is a static bundle.

## Shape of the code

```
src/
├── api/                 The whole HTTP surface. Nothing else calls fetch.
│   ├── client.ts            request(), ApiError, the base URL
│   ├── types.ts             The contract, mirroring Backend/docs/api.md
│   └── auth.ts tools.ts users.ts
├── session/             Who is signed in and what they may do
│   ├── SessionContext.ts    The context, the hook, the query key
│   ├── SessionProvider.tsx  Resolves /auth/me once for the whole app
│   └── RequireCapability.tsx  Route guard
├── features/<domain>/
│   ├── pages/               One folder-level file per route
│   ├── components/          Domain components used by those pages
│   └── *.ts                 Pure helpers, with tests next to them
├── components/layout/   The app shell
└── theme.ts
```

## How it works

- **Capabilities, never roles.** `GET /api/auth/me` returns
  `capabilities: ['tools.read', ...]`, and every guard, menu item and button
  asks `can('tools.write')`. Comparing `user.role === 'admin'` anywhere would
  be a second answer to a question the server's route policy already answers,
  and the two would drift.
- **The UI only decides what is worth rendering.** The API refuses the same
  calls on its own, so a stale capability list can produce a worse screen, not
  a permission.
- **List state lives in the URL.** `features/tools/listParams.ts` is the only
  translation between the address bar and the API query, so a filtered view can
  be sent as a link and the back button works.
- **One fetch wrapper.** `api/client.ts` sends the cookie, parses errors and
  throws `ApiError` with the status. Screens branch on the status: 401 means
  log in, 403 means ask an admin, 409 means a conflict with an existing row.
- **Server state is TanStack Query, not useState.** Cache keys: `['tools',
query]`, `['tool', id]`, `['tool-categories']`, `['users']`, `['session']`.
  A mutation invalidates what it changed — a new tool changes the list _and_
  the category list.

## Photos

`api/photos.ts` is the whole surface: list, upload, import links, promote,
delete, suggestions. The upload is the one call that does not go through
`request()` — it sends a `File` as the body rather than JSON, so it builds its
own fetch. Photo URLs come back as API paths and go through `apiFileUrl()`
before reaching an `<img>`, which is what keeps them working when the API is
not same-origin.

The suggestions modal searches only when its button is pressed. It costs the
server a call to a search provider, so it must never fire on page load.

## Conventions

- Prettier: single quotes, no semicolons, width 100. `npm run format`.
- Mantine components and props first; a CSS file only when a component cannot
  express it. No second styling system, no utility CSS framework.
- Polish in the interface, English in the code. Users are a Polish building
  crew; identifiers, types and comments stay in the language of the API.
- `verbatimModuleSyntax` is on: a type-only import must say `import type`.
- Comments explain why. The wording of a label is not worth a comment; the
  reason a field is dropped when empty is.

## Tests

`npm test` runs `node:test` over `src/**/*.test.ts` — pure modules only
(`listParams`, `presentation`), the same runner as the backend. There is no
vitest, no jsdom and no component test: the parts worth testing here are the
pure ones, and a rendering test suite would be a second toolchain to keep
alive. If a component ever holds logic worth testing, move the logic into a
`.ts` file next to it and test that.

## Verification

```bash
npm run typecheck
npm test
npm run lint
npm run build     # the real check that every import resolves
```

For anything that touches a screen, also run it: `npm run dev`, with the
backend up (`cd ../Backend && npm run db:up && npm run dev`). Vite proxies
`/api`, so the session cookie is first-party and CORS never enters the picture
in development.

## Things to leave alone unless asked

- The capability model and `RequireCapability`.
- `api/client.ts` being the only place that calls `fetch`.
- The URL as the source of truth for the list view.
