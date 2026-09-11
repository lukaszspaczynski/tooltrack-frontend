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

`features/media/` is the library: every photo in the system, with selection and
a batch delete. Its confirmation modal is the point of the screen, not a
formality — it names the tools the selection belongs to and calls out the main
photos, because those change what the catalog grid shows.

`CutoutStudio.tsx` is the wand: method, its parameters, original and result
side by side, and a save that only happens when the person says so. The method
list is built from what the server can actually run: a method switched off in
settings is not offered, nor is a service whose key is missing, and when
nothing is available the wand is not offered at all. There is no default
method — settings decide which methods exist, the choice for one photo is made
here. Its state is derived during render from the settings query rather than
copied into state by an effect, and the modal is mounted per photo, so there is
nothing to reset.

The backend still has the old one-click cutout endpoint. `api/photos.ts` no
longer mirrors it: the preview-then-commit pair replaced it, and an unused
wrapper is one more thing to keep true.

`ExistingPhotoPicker.tsx` is the fourth way a photo reaches a tool, after
upload, URL and search: picking one that already exists. It opens on the
unassigned shelf, because that is what the shelf is for, and offers everything
else behind a toggle — the same picture on two tools is allowed and costs a row
rather than a file. The search box applies to the whole library only: an
unattached photo has no tool, brand or model to match, so searching the shelf
could only ever empty it. Selection is cleared whenever the list underneath it
changes, and the grid is paginated, because the newest two dozen photos are not
the only ones worth attaching.

The suggestions modal searches only when its button is pressed. It costs the
server a call to every enabled search provider, so it must never fire on page
load. Each engine contributes up to ten results, so the grid holds more than
ten when several are on — and each tile is tagged with the engine that found
it, because a manufacturer's product shot and a stranger's photo deserve
different trust.

## Settings

`features/settings/` is one page with two owners: everybody sees their own
engine switches, an admin additionally sees the key fields. The key inputs
start empty and stay empty — the server never sends a credential back — so the
form submits only what was typed. Sending an untouched field would wipe a
stored key.

`components/CutoutSection.tsx` is the second half, and it is deliberately the
same screen as the engines: one card per cutout method, each with a switch and
a key field. An admin decides which methods exist; the method for a given photo
is chosen in `CutoutStudio`. Non-admins see the same list read-only, because
whoever presses the wand should be able to see why a method is missing.

The `['search-engines']` query is also what decides whether the _Znajdź w
internecie_ button is enabled: `usable === 0` means no engine would answer, and
a button that only ever fails is worse than a disabled one.

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
