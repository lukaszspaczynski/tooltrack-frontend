# ToolTrack Frontend — working notes

The web client for ToolTrack, the construction item catalog. It is read on a
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
│   └── auth.ts photos.ts settings.ts items.ts users.ts
├── i18n/                What the interface says, in Polish and English
│   ├── lang.ts              Plural rules, dates, the language itself. Pure.
│   ├── catalog.ts           The English side, keyed by the Polish phrase
│   ├── index.ts             t(), tCount(), tDate(), and the store they read
│   ├── useLanguage.ts       How React subscribes to it
│   ├── I18nProvider.tsx     Remounts the tree on a change
│   └── AccountLanguage.tsx  Adopts the language the account remembers
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
  asks `can('catalog.write')`. One capability covers the whole catalog — items,
  cases and the photos of both — because a viewer who could read an item but not
  the case it lives in would be looking at half a shelf. Comparing `user.role === 'admin'` anywhere would
  be a second answer to a question the server's route policy already answers,
  and the two would drift.
- **The UI only decides what is worth rendering.** The API refuses the same
  calls on its own, so a stale capability list can produce a worse screen, not
  a permission.
- **List state lives in the URL.** `features/items/listParams.ts` is the only
  translation between the address bar and the API query, so a filtered view can
  be sent as a link and the back button works.
- **One fetch wrapper.** `api/client.ts` sends the cookie, parses errors and
  throws `ApiError` with the status. Screens branch on the status: 401 means
  log in, 403 means ask an admin, 409 means a conflict with an existing row.
- **Server state is TanStack Query, not useState.** Cache keys: `['items',
query]`, `['item', id]`, `['item-categories']`, `['users']`, `['session']`.
  A mutation invalidates what it changed — a new item changes the list _and_
  the category list. There is no `['case', id]`: a box is a card, and two cache
  entries for one card would be two answers to "what does it say now".

## Importing from a shop

`features/items/components/ImportToolModal.tsx` is the other way a card starts:
paste the address of a product page and it arrives with its parameters and its
photographs already on it. The button sits beside **Dodaj** on the catalog
screen, because typing from the plate and reading off the page the item was
bought from are the same errand.

The dialog names the shops it can read before asking for anything —
`GET /api/items/import/sources`, through `useImportSources`, which every screen
that offers them shares. It is asked again each time one opens: the list grows
whenever the server learns a new shop, and it was once cached for an hour,
which meant a tab left open since before that went on offering the old two. So
the answer to "why was my link refused" is on the screen that refused it, and
it is today's answer. The same check runs here and on the server: here
so nobody waits for a round trip to be told, there because that is where it is
true.

It says out loud that the import takes a while. Sixteen photographs are sixteen
files fetched, converted and stored, which is around a dozen seconds — a
spinner with nothing beside it is a spinner somebody thinks has hung.

On success the screen goes straight to the new card. The point of importing is
to look at what came in and correct the one field the shop had wrong.

The library screen, `features/manuals/`, is to that panel what the photo
library is to a gallery: every document the catalog holds, with the cards that
keep each one, searchable by the item as well as by the title — a file called
"Instrukcja obsługi" is findable only by the machine it is for. It hangs under
**Narzędzia** in the menu, because a manual is something an item comes with, the
same way a maker is something it has.

Deleting there is deliberately not the bin on a card. The panel's bin means
"not on this item"; the library's means "not in the catalog", so it takes the
file off every card at once and the confirmation names them.

Adding works from either place. On the library screen it asks **which item**
first and will not send anything without one: a document with no item is one
nobody will ever look for, and the rule that clears unused files would treat it
as an orphan. The picker shows the model beside the name, because a shelf of
cards called "Sekator akumulatorowy" is told apart by that and nothing else.

`RefreshFromPageModal` is the same errand done by somebody else: the maker
corrected a spec, added a manual, renamed the model. It starts from the card's
own **`referenceUrl`** and says what it will overwrite before it does — two of
those lines are destructive, since the parameters and the documents are cleared
and written again rather than merged, a hand-typed parameter included. What it
will not touch is listed beside it: the name, the serial number, the condition
and the photographs.

## One card for everything owned

`features/items/` was `features/tools/`. The catalog began as a tool shed and
is not only one: a drill and a washing machine want the same card, so they are
one screen and `kind` says which sort each row is — `tool`, `appliance` and
`case`. The boxes folded in: `catalog.tool_case` and `/api/cases/*` are both
gone.

The filter for it lives in the URL like every other one, so "show me the
appliances" is a link somebody can send. It is deliberately **not** the
category: a category is your own word for a shelf and there are dozens of them,
this is the two the catalog itself behaves differently about. Only a tool goes
in an organizer, and the server refuses the rest with `ITEM_IS_NOT_A_TOOL`.

The **maker is an object** now — `{ id, name, color }`, or null. It used to be
a string on the card beside a pointer at a row, and a form typed the string.
Now the form picks an id, because a typo in free text would otherwise become a
maker, and the colour arrives with the name: a field the makers have had for
months that no card ever showed. It is drawn as a dot beside the name rather
than as coloured text, because the colour identifies and half a palette is
unreadable as type.

## Item parameters

`components/AttributePanel.tsx` is what a particular machine is: mains voltage,
speed, chuck, weight — a name and a value per row, `n` rows per card. It sits
outside the editing form for the same reason `PhotoPanel` does: a parameter is
added, corrected and removed one at a time and immediately, while the fields of
the card are edited and then saved together.

Every call answers with the whole item, so the panel replaces `['item', id]`
rather than merging a row into what it holds — there is no local list to drift
from the server's. The name input is an `Autocomplete` over
`GET /api/items/attributes`, the names other cards already use, because a
catalog with four spellings of "napięcie sieciowe" cannot be read across.

The value is typed with its unit. "230 V", not 230 with a unit picker: half
these parameters have no unit anybody agrees on — "SDS-plus", "3 tryby" — and
the plate on the machine already says it the right way.

The catalog grid does not show parameters, and `GET /api/items` does not send
them. A card in a grid says a name, a maker and a condition; the spec sheet is
what somebody reads one item at a time.

The address the card was imported from is **not** one of these. It was a
parameter called `Referencja` and it is a field on the card now: every imported
card has exactly one and no card has two, which is the shape of a field — and
on the sheet it sorted among the voltages, where an edit to a row could rename
the thing three screens read by name. It is typed in the card's own form, which
is what lets a card written by hand have the update button too.

## Cases

There is no boxes screen. A case is a card, so it is read on the catalog screen
like every other one — `features/cases/` is gone, and with it a list, a card, a
form, two modals and a set of URL parameters that were all a second version of
what `features/items/` already had. The **Rodzaj** filter is how somebody sees
the boxes and only the boxes, and it is a link like every other filter.

What is genuinely only a box's lives on the item screens, behind
`item.kind === 'case'`:

- `components/LabelSlotPanel.tsx`, drawn on the detail page for a case and not
  for anything else. The sizes go in and out one at a time, immediately, and
  the server refuses a drill one with `ITEM_IS_NOT_A_CASE`.
- two composed lines in the card's own fields — `caseSpec.ts` reads
  "450 × 322 × 126 mm" out of three parameters, which is the one thing the
  parameter panel cannot do for itself. A box shows those where a machine shows
  its serial number and category.
- the delete confirmation names the **arrangements** that would cascade away
  with the box, which a person cannot weigh without the list.
- the suggestions search for the **name** rather than brand-and-model: a box's
  name usually carries its maker already, and its model is the range it stacks
  with.

`ItemForm` offers `case` as a third kind. It has to: editing a box through a
form that only knew about tools and appliances would have turned it into a tool
on save.

## Photos

`features/photos/` holds the photo components, and they are not under `items/`
because the media library uses them too. Every one of them takes a
`PhotoOwner` — `{ id }`, and it carried a `kind` as well while a case was a
table of its own and the routes came in two sets. `api/photos.ts` turns it into
`/api/items/7/…` and is the only place that builds one. `PhotoPanel` is the
gallery, and it is the same component on both detail pages; `kind` is passed to
it separately, for the one line of wording that needs it.

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
and which are items, and calls out the main photos, because those change what
the grids show.

`CutoutStudio.tsx` is the wand — **wycinanie tła** on screen, because that is
what it does and what every service that does it calls it. It used to say
"wytnij samo narzędzie", which named the half the method does not look at: what
remove.bg and the local script both recognise is the background. The wording
also stopped being true twice over — a card is not always a tool, so the label
had to branch on the kind to say "samą skrzynkę", and that branch is gone with
it.

It shows the method, its parameters, the original and the result side by side,
and a save that only happens when the person says so. The method
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

`ExistingPhotoPicker.tsx` is the fourth way a photo reaches an item, after
upload, URL and search: picking one that already exists. It opens on the
unassigned shelf, because that is what the shelf is for, and offers everything
else behind a toggle — the same picture on two items is allowed and costs a row
rather than a file. The search box applies to the whole library only: an
unattached photo has no item, brand or model to match, so searching the shelf
could only ever empty it. Selection is cleared whenever the list underneath it
changes, and the grid is paginated, because the newest two dozen photos are not
the only ones worth attaching.

When a card knows where it came from — the **`referenceUrl`** an import leaves
in, and a form can be typed into — the suggestions modal offers that page beside
the engines. It is usually the
better answer: the maker's own photographs of this exact machine rather than
ten plausible pictures of something like it, and the one source that cannot
come back with the wrong item. A button rather than a second search box,
because there is nothing to type.

The suggestions modal searches only when its button is pressed. It costs the
server a call to every enabled search provider, so it must never fire on page
load. Each engine contributes up to ten results, so the grid holds more than
ten when several are on — and each tile is tagged with the engine that found
it, because a manufacturer's product shot and a stranger's photo deserve
different trust.

## Organizer

`features/organizers/` answers "what is in box 4". The same division as items
and cases — a list of cards, a detail page behind each, and a wizard for making
one — plus the label screen described below.

The card is a link and nothing else. Everything that changes an arrangement —
the fields, adding an item, taking one out, deleting it — lives on the detail
page, so a gloved thumb scrolling the list cannot press any of it. Its picture
area is four tiles across, wrapping downwards: the case first, outlined, then
every item. Not a scrolling strip, because a card that hides half its contents
sideways hides them for good.

`CasePicker` and `ItemPicker` are shared by the wizard and the detail page, so
the two cannot drift apart about what a case or an item looks like. The item
picker lists only `inOrganizer=false` — an item lies in exactly one place, and
the server refuses a second with a 409 rather than moving it, so offering one
that is taken would be offering to fail.

On the detail page the fields are a form with Save, while items go in and out
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
caption where any item has one, as many pictures as the shape holds, and the
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

The **Duplikuj** button on an item card calls one endpoint and navigates to the
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
first thing somebody who does not read Polish sees.

**The choice belongs to the account.** Signed in, the menu also sends it to
`PATCH /api/auth/language`, and `/auth/me` brings it back on the next device;
`AccountLanguage` adopts what the account says as soon as the session resolves,
overriding the browser — signing in on somebody else's phone should not mean
reading in their language. Signed out there is no account to ask, so
`localStorage` holds the last choice and the browser's own languages are the
first guess.

Adoption happens once per value rather than on every render, which is what
keeps it from fighting a choice still in flight: the session says Polish until
the PATCH lands, and the value has already been adopted, so the new choice
stands.

The language itself lives in a module and React subscribes to it with
`useSyncExternalStore`. It has to be readable where a hook cannot go, and it
changes from two directions — a click and a query — so a store is what it
actually is.

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
> `t(CONDITION_LABELS[item.condition])`.

**Numbers, names and counts.** A phrase carrying a value takes it as a
placeholder: `t('Usunięto {n} z {asked}', { n, asked })`. Word order is not the
same in both languages, and a sentence glued together from fragments can only
be right in one of them. A counted noun goes through `tCount(COUNTS.item, n)`:
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

When the API changes, `npm run api:types` rewrites `src/api/schema.d.ts` from
`../Backend/docs/openapi.json` — the file `api/contract.ts` checks our own
types against, so a field that moved shows up as a typecheck failure naming it.
Nothing runs it for you and nothing can: its input is in the other repo and is
itself written by hand there, by `npm run openapi:build`. Both are VS Code
tasks in their own window, along with `api: types check`, which asks whether
the committed file still matches instead of quietly making it match.

## Things to leave alone unless asked

- The capability model and `RequireCapability`.
- `api/client.ts` being the only place that calls `fetch`.
- The URL as the source of truth for the list view.
