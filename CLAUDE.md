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
│   └── auth.ts cases.ts photos.ts settings.ts tools.ts users.ts
├── i18n/                What the interface says, in Polish and English
│   ├── lang.ts              Plural rules, dates, the language itself. Pure.
│   ├── catalog.ts           The English side, keyed by the Polish phrase
│   ├── index.ts             t(), tCount(), tDate() — plain functions
│   └── I18nProvider.tsx     Holds the choice; LanguageMenu.tsx switches it
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
  `capabilities: ['catalog.read', ...]`, and every guard, menu item and button
  asks `can('catalog.write')`. One capability covers the whole catalog — tools,
  cases and the photos of both — because a viewer who could read a tool but not
  the case it lives in would be looking at half a shelf. Comparing `user.role === 'admin'` anywhere would
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
  the category list. Photo keys carry the owner's kind as well as its id
  (`['card-photos', 'case', 4]`): tool 4 and case 4 are different cards that
  happen to share a number.

## Cases

`features/cases/` is the second half of the catalog: the boxes the tools live
in. Same shapes as `features/tools/` — URL-driven list, card grid, detail page
with an inline form — because it is read in the same place under the same
conditions.

What differs is the fields. Name and maker are required, everything else comes
off a spec sheet, and a measurement nobody has taken stays `null`. The form
sends `null` rather than omitting an emptied input, because that is what clears
a number the API already has. Millimetres are whole numbers and the input says
so; litres and kilograms accept a Polish comma, since that is what the spec
sheets these get copied from are written with.

## Photos

`features/photos/` holds the photo components, and they are not under `tools/`
because a case carries pictures on exactly the same terms. Every one of them
takes a `PhotoOwner` — `{ kind: 'tool' | 'case', id }` — which `api/photos.ts`
turns into `/api/tools/7/…` or `/api/cases/7/…`. `PhotoPanel` is the gallery,
and it is the same component on both detail pages.

A `Photo` is a picture and has no owner; a `CardPhoto` is a picture as one card
shows it and adds `isPrimary`. The same photograph can head one card and sit
fourth on another, so a component that renders a star needs the second type.
In the library a picture carries `owners` — every card showing it — and appears
once however many that is.

`api/photos.ts` is the whole surface: list, upload, import links, promote,
delete, suggestions. The upload is the one call that does not go through
`request()` — it sends a `File` as the body rather than JSON, so it builds its
own fetch. Photo URLs come back as API paths and go through `apiFileUrl()`
before reaching an `<img>`, which is what keeps them working when the API is
not same-origin.

`features/media/` is the library: every photo in the system, with selection and
a batch delete. Its confirmation modal is the point of the screen, not a
formality — it names the cards the selection belongs to, says which are cases
and which are tools, and calls out the main photos, because those change what
the grids show.

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

## Organizer

`features/organizers/` answers "what is in box 4". The same division as tools
and cases — a list of cards, a detail page behind each, and a wizard for making
one — plus the label screen described below.

The card is a link and nothing else. Everything that changes an arrangement —
the fields, adding a tool, taking one out, deleting it — lives on the detail
page, so a gloved thumb scrolling the list cannot press any of it. Its picture
area is four tiles across, wrapping downwards: the case first, outlined, then
every tool. Not a scrolling strip, because a card that hides half its contents
sideways hides them for good.

`CasePicker` and `ToolPicker` are shared by the wizard and the detail page, so
the two cannot drift apart about what a case or a tool looks like. The tool
picker lists only `inOrganizer=false` — a tool lies in exactly one place, and
the server refuses a second with a 409 rather than moving it, so offering one
that is taken would be offering to fail.

On the detail page the fields are a form with Save, while tools go in and out
immediately — a link is its own fact and the server has no draft to hold it in.
The number may be left empty when creating, and then the server takes the next
free one.

A case's delete confirmation asks `organizers?caseId=…` while it is open and
names what would go with the box. An arrangement is not obviously part of a
case, so it has to be said before the person agrees.

`LabelsPage` is the fourth screen and the submenu under **Organizer**: every
label anybody has generated, whichever arrangement made it. It is to the label
panel on the detail page what the photo library is to a card's gallery — the
panel answers "what has this arrangement produced", this one answers "what have
we printed" — and like the library it has tick boxes, a select-all and a batch
action, because the reason to open it is that a box changed and half a shelf of
stickers is stale. The action is a redraw rather than a delete: a label is never
edited, it is drawn again from the options it was kept with, so the only thing
that changes is the file behind the tile.

`labelDefaults.ts` is what a label says when nobody has said otherwise: both
contents lines left empty so the server works them out, the models as the
caption where any tool has one, as many pictures as the shape holds, and the
logos on a number label. The wizard starts from it and the **Uzupełnij
brakujące** button sends it unchanged.

What that button fills is the whole matrix: every place on the case crossed
with every template, minus what has been drawn. A place is not done once it has
a sticker — the number is read across a workshop and the contents with the box
in your hands, and a box wants both. The match is on the size and the template
rather than on the slot id, because a label carries its own size and a case
cannot have two places of the same size. Without the shared module "the
defaults" would be two sets of rules that agree until one of them is edited.

Next to the pager sits **Wszystkie (n)**, which drops the paging and puts the
whole result on one page. It is there because a selection is about what is on
the screen — a tick on a row nobody can see would print on the sheet — so
gathering thirty labels for one print sheet means seeing thirty at once. The
state is `all=1` in the URL like every other list setting, and the API's own
ceiling of 200 is what "all" asks for, which is also the most labels one sheet
will draw. `n` is therefore what the screen can show and not what exists: past
the ceiling the count line says so and the way back to the pages stays put,
since that is where the rest is read.

That rule is kept by narrowing rather than clearing: `keepVisibleSelection`
runs while rendering and drops whatever is not on the screen, so turning the
page, filtering, and the back button all behave without anybody remembering to
call a reset — and widening the view, the one case where the ticked rows are
still there, keeps them.

The selection is also what **Arkusz do druku** prints: one A4 with all of them
ganged onto it, which is what a batch is printed from — the per-label PDF has a
margin and crop marks, and thirty margins is most of a sheet of paper. That
button is a link rather than a call, because the answer is a file to look at,
and it is offered to everyone: the sheet writes nothing, so ticking labels is
not editing them. Only the redraw asks for `catalog.write`.

`labelListParams.ts` puts its filters in the URL like every other list, and it
also holds `refreshBatches`: the API redraws fifty at a time, a page of ticks
can be more, and somebody who ticked everything asked for everything. The
batches go one after another — each one draws PDFs, so firing them together
would be a queue on the server disguised as parallelism.

## Duplicating

The **Duplikuj** button on a tool card calls one endpoint and navigates to the
copy, because the reason to duplicate is to change something — usually the
serial number, which the server leaves blank on purpose. The copy shows the
same photos, which costs no upload.

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

## Two languages

The interface speaks Polish and English, chosen from the menu in the header —
next to the theme, and outside the session, because the login screen is the
first thing somebody who does not read Polish sees. The choice is kept in
`localStorage` and guessed from the browser the first time; the server knows
nothing about it, so it does not follow an account onto another device yet.

**The Polish phrase is the key.** `t('Zapisz zmiany')`, not `t('form.save')`.
There is no key namespace to invent or keep in step, the code reads the way the
screen reads, and a phrase nobody has translated yet shows in Polish — right for
the crew, honest for everybody else — where a raw key would be neither. The
English side is `i18n/catalog.ts` and nothing else.

**`t` is a function, not a hook.** Every screen says something, so a hook would
be a line of ceremony in forty files, and phrases are needed where hooks cannot
go: lookup tables, helpers, event handlers. What makes that safe is that
`I18nProvider` remounts the tree when the language changes. Which leads to the
one rule worth remembering:

> **Never call `t()` at module scope.** A phrase read while the module is
> evaluated is frozen at import: the tree remounts, the module does not run
> twice, and that screen keeps the old language. A lookup table holds the
> Polish phrase and the screen translates it by key —
> `t(CONDITION_LABELS[tool.condition])`.

**Numbers, names and counts.** A phrase carrying a value takes it as a
placeholder: `t('Usunięto {n} z {asked}', { n, asked })`. Word order is not the
same in both languages, and a sentence glued together from fragments can only
be right in one of them. A counted noun goes through `tCount(COUNTS.tool, n)`:
Polish picks one of three forms by the last two digits, English one of two.
Dates are `tDate()`, which formats in the current locale.

`i18n/catalog.test.ts` is what keeps this honest. It reads every `t('…')` in
the source, and every value of every `*_LABELS`/`*_OPTIONS` table, and fails
when one has no English translation — or when the catalog still holds a phrase
no screen says any more. Reword a phrase and the test names what to do.

The API answers in the same language: `api/client.ts` sends the chosen one as
`Accept-Language` on every call, so an error shown as it comes is in the
language of the screen it lands on. What stays Polish is the text the server
draws onto the label PDFs — stickers cut out and stuck on boxes in one
workshop — and the refusals a client acts on rather than displays
(`Unauthorized`, `Not found`), which were always English.

## Conventions

- Prettier: single quotes, no semicolons, width 100. `npm run format`.
- Mantine components and props first; a CSS file only when a component cannot
  express it. No second styling system, no utility CSS framework.
- Polish in the interface, English in the code. Users are a Polish building
  crew; identifiers, types and comments stay in the language of the API. Every
  phrase a person reads goes through `t()` — see **Two languages** below.
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
