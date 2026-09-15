// The API contract, restated in TypeScript. It is written by hand and kept in
// step with Backend/docs/api.md — there is no generated client, because the
// surface is small enough that a hand-written type is easier to read than a
// generated one, and a drift shows up as a type error the first time a screen
// touches the field.

import type { Lang } from '../i18n/lang'

export const ITEM_CONDITIONS = ['new', 'good', 'worn', 'needs_repair', 'retired'] as const

export type ItemCondition = (typeof ITEM_CONDITIONS)[number]

// The maker, as the row it is. A card used to carry the name as a string beside
// a pointer at this; one pointer and a join is what the server sends now, and
// the colour comes with it — a field the makers have had for months and no card
// ever showed.
export type ItemBrand = {
  color: string
  id: number
  name: string
}

// What sort of thing a card is about. Not a category: a category is free text
// and somebody's own word for a shelf, while this is the handful of sorts the
// catalog itself behaves differently about. Only a tool goes in an organizer.
export type ItemKind = 'appliance' | 'case' | 'tool'

export type Item = {
  // Where this item is kept, or null when nobody has said.
  addressId: null | number
  brand: null | ItemBrand
  category: string
  condition: ItemCondition
  kind: ItemKind
  createdAt: string
  createdBy: null | number
  id: number
  model: string
  name: string
  notes: string
  // Where an import read this card from, '' when nobody imported it. The
  // update dialog, the manuals panel and the photo suggestions all read it.
  referenceUrl: string
  serialNumber: string
  updatedAt: string
  updatedBy: null | number
}

// A PDF kept beside an item: the manual from the box, a parts diagram, a safety
// sheet. It belongs to the model rather than to one machine, so the same file
// can hang on several cards.
export type Manual = {
  byteSize: number
  createdAt: string
  createdBy: null | number
  id: number
  source: 'import' | 'upload' | 'url'
  sourceUrl: string
  title: string
  url: string
}

// A manual as the library shows it: with the cards that keep it, because
// "which items is this the manual for" is the question that screen answers.
export type LibraryManual = Manual & {
  // The model as well as the name: a shelf of documents called "Instrukcja
  // obsługi" on cards called "Sekator akumulatorowy" is told apart by the
  // model and by nothing else.
  items: { id: number; model: string; name: string }[]
}

export type ManualLibraryPage = {
  items: LibraryManual[]
  limit: number
  offset: number
  total: number
}

// One parameter of one item: mains voltage, speed, chuck size. The value
// carries its unit — "230 V" rather than 230 — because half of these have no
// unit anybody agrees on.
export type ItemAttribute = {
  id: number
  name: string
  value: string
}

// An item with what is only worth reading one card at a time. The list answers
// with `Item`: a grid shows a name, a maker and a condition, and every card's
// spec sheet would be paying for what nobody reads there.
export type ItemDetail = Item & {
  attributes: ItemAttribute[]
  // Where the labels go, on a case. Empty for everything else, which is what
  // one card type for the whole catalog costs and all it costs.
  labelSlots: LabelSlot[]
}

// A shop this server knows how to read. The import dialog lists these before
// asking for an address, and an address from anywhere else is refused.
export type ImportSource = {
  host: string
  label: string
  // Whether the page publishes documents at all. A shop that sells an item is
  // not obliged to host its manual, and most do not — so a screen asking for
  // one offers only the sources that have any.
  manuals: boolean
}

export type ItemImportResult = {
  imported: {
    attributes: number
    // Parameters the page listed that the card would not take. Named rather
    // than counted: the person can add the one that matters by hand.
    attributesFailed: string[]
    // The PDFs the page published, when it published any. Most shops do not.
    manuals: number
    manualsFailed: number
    photos: number
    photosFailed: number
    sourceUrl: string
  }
  // Null only if the card vanished between being written and being read
  // back, which is a server fault rather than an outcome — but the
  // contract says it can be, so this says so too.
  item: null | ItemDetail
}

export type AttributeNameCount = {
  count: number
  name: string
}

// Where an item lies, as the catalog grid receives it: the organizer's number
// and the case it is in, with that case's main photo. Null for an item nobody
// has put anywhere.
export type OrganizerPlacement = {
  caseId: number
  caseName: string
  casePhotoUrl: null | string
  number: number
  organizerId: number
}

// The main photo of an item, as the catalog grid receives it: a URL and
// nothing else, because a card needs a thumbnail and not a photo record.
export type ItemSummary = Item & {
  // The spec sheet, when the list was asked for it with `attributes: true`.
  // Absent by default: a grid shows a name, a maker and a condition. The boxes
  // screen asks, because what somebody scanning a shelf of boxes is choosing
  // between is the measurements and what goes in.
  attributes?: ItemAttribute[]
  organizer: null | OrganizerPlacement
  primaryPhotoUrl: null | string
}

export type PhotoSource = 'edit' | 'search' | 'upload' | 'url'

// Which card a photograph hangs on. It carried a kind as well as an id while a
// case was a table of its own and the photo routes came in two sets — one card
// now, one set of routes, and what is left is the id.
export type PhotoOwner = {
  id: number
}

// One picture, once. Which cards show it is a separate question — see
// CardPhoto and LibraryPhoto below — because the same photograph can
// illustrate several cards: an item and the case it lives in, for one.
export type Photo = {
  attribution: string
  byteSize: number
  contentType: string
  createdAt: string
  createdBy: null | number
  // Set when this photo is a cutout: the id of the picture it was made from.
  derivedFrom: null | number
  height: null | number
  id: number
  source: PhotoSource
  sourceUrl: string
  url: string
  width: null | number
}

// A picture as one card shows it. Being the main photo belongs to the pairing,
// not to the picture: the same photograph can head one card and sit fourth on
// another.
export type CardPhoto = Photo & {
  isPrimary: boolean
}

// A card showing a picture, as the library names it.
export type PhotoOwnerRef = {
  id: number
  // Whether this picture heads that card. A property of the pairing, so the
  // same photograph can be the main one here and the fourth one there.
  isPrimary: boolean
  // What sort of card it is. It used to say which table the row came from and
  // says what the card is now, which is what the library shows beside a name.
  kind: ItemKind
  name: string
}

// A picture as the library screen sees it: the record plus every card showing
// it, because a picture has no name of its own and "what is this a picture of"
// is the question being asked there. One picture appears once, however many
// cards use it.
export type LibraryPhoto = Photo & {
  // The brand this picture is the logo of, if any. Not an owner — a logo is
  // not "on a card" and does not make the picture count as assigned — but it
  // is what a delete would quietly take away.
  logoForBrand: null | { id: number; name: string }
  // Empty while nobody has placed it.
  owners: PhotoOwnerRef[]
}

export type PhotoLibraryPage = {
  items: LibraryPhoto[]
  limit: number
  offset: number
  total: number
}

// What the on-demand web search offers. Nothing is stored yet — these are
// links until someone ticks them and the server fetches the bytes.
export type PhotoSuggestion = {
  attribution: string
  height: null | number
  // `page` as well as the engines: the pictures a product page publishes come
  // back in the same shape, and the card imported from it is the one source
  // that cannot return somebody else's machine.
  provider: SuggestionProvider
  sourceUrl: string
  thumbnailUrl: string
  title: string
  url: string
  width: null | number
}

export type SearchProvider = 'brave' | 'google' | 'mistama' | 'openverse'

// Where a suggestion came from: an engine, or the product page this card was
// imported from — which is not an engine and has no settings of its own.
export type SuggestionProvider = 'page' | SearchProvider

export type PhotoSearchResult = {
  // Which engines were asked, and which of them failed. Several can be on at
  // once, so a result set is not all-or-nothing.
  failed: { message: string; provider: SuggestionProvider }[]
  providers: SuggestionProvider[]
  query: string
  suggestions: PhotoSuggestion[]
}

// One image search engine as the settings screen sees it. Never a credential:
// only whether one is set, where it came from, and its last four characters.
export type SearchEngineSettings = {
  configured: boolean
  globallyEnabled: boolean
  keyHint: string
  keyLabel: string
  keySource: 'database' | 'environment' | 'none'
  label: string
  // The highest limit this engine may be given: its provider's ceiling where
  // there is one, otherwise the server's.
  maxResults: number
  note: string
  provider: SearchProvider
  requiresKey: boolean
  requiresSecret: boolean
  // How many pictures this engine contributes to one search.
  resultLimit: number
  secretHint: string
  secretLabel: string
  usedByMe: boolean
}

export const CUTOUT_METHODS = ['local', 'removebg', 'gemini'] as const

export type CutoutMethod = (typeof CUTOUT_METHODS)[number]

// One cutout method as the settings screen sees it — the same shape as a
// search engine, and for the same reason: the question is which methods may be
// used here, not which one runs.
export type CutoutMethodSettings = {
  configured: boolean
  enabled: boolean
  keyHint: string
  keyLabel: string
  keySource: 'database' | 'environment' | 'none'
  label: string
  method: CutoutMethod
  note: string
  requiresKey: boolean
}

export type CutoutSettings = {
  methods: CutoutMethodSettings[]
  threshold: number
  // How many methods the cutout screen can offer. Zero means the wand has
  // nothing to run.
  usable: number
}

// A cutout that has been produced but not kept. The bytes are on the server,
// addressed by checksum; saving is a second call naming that checksum, so
// nothing has to be produced twice — and a preview nobody accepts costs one
// file and no row.
export type CutoutPreview = {
  byteSize: number
  checksum: string
  contentType: string
  // Null when the bytes carried no dimensions this server could read. The
  // server has always said so; this said otherwise until the contract check
  // was written.
  height: null | number
  url: string
  width: null | number
}

export type CutoutPreviewResponse = {
  preview: CutoutPreview
  provider: CutoutMethod
}

export type CutoutParams = {
  method?: CutoutMethod
  padding?: number
  removeBgType?: 'auto' | 'product'
  threshold?: number
}

export type SearchEnginesResponse = {
  engines: SearchEngineSettings[]
  // How many engines this account's search would actually run against. Zero
  // means the search button has nothing to call.
  usable: number
}

export type ItemPage = {
  items: ItemSummary[]
  limit: number
  offset: number
  total: number
}

export type CategoryCount = {
  category: string
  count: number
}

// What POST /api/items accepts. A PATCH sends any subset of it.
export type ItemFields = {
  addressId: null | number
  // The maker as an id. It was free text, matched back to a row on the way in;
  // a form picks from the list now, because a typo there would otherwise become
  // a maker.
  brandId: null | number
  category: string
  condition: ItemCondition
  kind: ItemKind
  model: string
  name: string
  notes: string
  referenceUrl: string
  serialNumber: string
}

// Where a label goes on a case: a size in millimetres and nothing else. What
// gets printed on it is a different question.
//
// A case is not a type here any more. `catalog.tool_case` and `/api/cases/*`
// are both gone: a box is an item with `kind: "case"`, so the boxes screen
// reads `ItemDetail` like every other screen and this is the one shape that
// was only ever a box's.
export type LabelSlot = {
  heightMm: number
  id: number
  widthMm: number
}

export type ModelCount = {
  count: number
  model: string
}

// An organizer: which items live in which case. The number is the one painted
// on the box and said out loud — deliberately not the id.
export type OrganizerItem = {
  brand: string
  id: number
  model: string
  name: string
  primaryPhotoUrl: null | string
}

// A generated label: the PDF and the options it was drawn from.
export type OrganizerLabel = {
  byteSize: number
  createdAt: string
  createdBy: null | number
  heightMm: number
  id: number
  options: Record<string, unknown>
  // A picture of the label for the tile, or null: a label made before previews
  // existed, or one the rasteriser could not read, still has to appear.
  previewUrl: null | string
  template: string
  url: string
  widthMm: number
}

// A label as the cross-organizer list shows it: the same PDF, plus the
// arrangement and the box it was made for. A label has no name of its own, so
// without those two a tile is a picture nobody can place.
export type LabelListItem = OrganizerLabel & {
  case: { id: number; manufacturer: string; name: string }
  organizer: { id: number; name: string; number: number }
}

export type LabelPage = {
  items: LabelListItem[]
  limit: number
  offset: number
  total: number
}

// A size this organizer's case has a place for. The wizard's first step, and
// the only sizes a label may be drawn at.
export type OrganizerLabelSlot = {
  heightMm: number
  id: number
  widthMm: number
}

export type Organizer = {
  // Where this arrangement is kept, or null when nobody has said. The items in
  // it carry one of their own and the two may disagree: a drill taken to a site
  // while its box stays in the workshop is genuinely two places.
  addressId: null | number
  case: {
    id: number
    manufacturer: string
    name: string
    primaryPhotoUrl: null | string
  }
  createdAt: string
  createdBy: null | number
  description: string
  id: number
  labels: OrganizerLabel[]
  name: string
  number: number
  items: OrganizerItem[]
  updatedAt: string
  updatedBy: null | number
}

export type OrganizerPage = {
  items: Organizer[]
  limit: number
  offset: number
  total: number
}

// What POST /api/organizers accepts. `number` absent means "the next free
// one", which only the server can work out.
export type OrganizerFields = {
  addressId: null | number
  caseId: number
  description: string
  name: string
  number?: number
  itemIds?: number[]
}

// A maker. One row, many items; the logo is a picture from the library, linked
// one to one in its own table rather than held as a column.
// Where the kit is: a workshop, a yard, a site, a van. Only `name` is required
// and it is the part a picker shows — a crew says "magazyn", not a postcode.
export type Address = {
  building: string
  city: string
  // '#rrggbb', or '' when nobody has picked one. Not black — a place without a
  // colour has to look different from one somebody made black on purpose.
  color: string
  createdAt: string
  createdBy: null | number
  id: number
  name: string
  notes: string
  // How many things say they are here. Read-only, and what makes the list
  // worth looking at: "where is the kit", and "which of these is empty".
  organizerCount: number
  postalCode: string
  street: string
  itemCount: number
  unit: string
  updatedAt: string
  updatedBy: null | number
}

export type AddressPage = {
  items: Address[]
  limit: number
  offset: number
  total: number
}

// What POST /api/addresses accepts. A PATCH sends any subset of it.
export type AddressFields = {
  building: string
  city: string
  color: string
  name: string
  notes: string
  postalCode: string
  street: string
  unit: string
}

export type Brand = {
  // '#rrggbb', or '' when nobody has said. Not black — a maker without a
  // colour has to look different from one whose colour is black.
  color: string
  createdAt: string
  createdBy: null | number
  id: number
  logoPhotoId: null | number
  logoUrl: null | string
  name: string
  notes: string
  // How many items name this maker. Read-only, and the reason the list is
  // worth looking at.
  itemCount: number
  updatedAt: string
  updatedBy: null | number
}

export type BrandPage = {
  items: Brand[]
  limit: number
  offset: number
  total: number
}

export type BrandFields = {
  // Sent as '#rrggbb' or as 'r g b'; the server normalises and stores one form.
  color: string
  name: string
  notes: string
}

export const ROLES = ['viewer', 'editor', 'admin'] as const

export type Role = (typeof ROLES)[number]

export type AccountStatus = 'active' | 'disabled'

// One capability for the catalog — items, the cases they live in, and the
// photos of both. The server says the same thing in src/access/roles.ts.
export type Capability = 'catalog.read' | 'catalog.write' | 'users.manage'

export type User = {
  createdAt: string
  displayName: string
  email: string
  id: number
  // Which language this account reads the interface in. It belongs to the
  // account rather than to the browser, so a phone and a laptop agree.
  language: Lang
  role: Role
  status: AccountStatus
}

export type ManagedUser = User & {
  capabilities: Capability[]
}

// The answer to GET /api/auth/me. `capabilities` is what the UI renders from —
// never a comparison against `role`, so that the screen and the server's route
// policy cannot disagree about what this account may do.
export type Session = {
  capabilities: Capability[]
  // Null for an account that is switched off: it has a role in the row and no
  // capabilities in practice, and the menu is drawn from the capabilities.
  effectiveRole: null | Role
  user: User
}
