// The API contract, restated in TypeScript. It is written by hand and kept in
// step with Backend/docs/api.md — there is no generated client, because the
// surface is small enough that a hand-written type is easier to read than a
// generated one, and a drift shows up as a type error the first time a screen
// touches the field.

export const TOOL_CONDITIONS = ['new', 'good', 'worn', 'needs_repair', 'retired'] as const

export type ToolCondition = (typeof TOOL_CONDITIONS)[number]

export type Tool = {
  brand: string
  category: string
  condition: ToolCondition
  createdAt: string
  createdBy: null | number
  id: number
  model: string
  name: string
  notes: string
  serialNumber: string
  updatedAt: string
  updatedBy: null | number
}

// Where a tool lies, as the catalog grid receives it: the organizer's number
// and the case it is in, with that case's main photo. Null for a tool nobody
// has put anywhere.
export type ToolPlacement = {
  caseId: number
  caseName: string
  casePhotoUrl: null | string
  number: number
  organizerId: number
}

// The main photo of a tool, as the catalog grid receives it: a URL and
// nothing else, because a card needs a thumbnail and not a photo record.
export type ToolListItem = Tool & {
  organizer: null | ToolPlacement
  primaryPhotoUrl: null | string
}

export type PhotoSource = 'edit' | 'search' | 'upload' | 'url'

// Tools and cases carry photos on identical terms, so every photo call names
// which kind of card it is talking about rather than having two of everything.
export const PHOTO_OWNER_KINDS = ['case', 'tool'] as const

export type PhotoOwnerKind = (typeof PHOTO_OWNER_KINDS)[number]

export type PhotoOwner = {
  id: number
  kind: PhotoOwnerKind
}

// One picture, once. Which cards show it is a separate question — see
// CardPhoto and LibraryPhoto below — because the same photograph can
// illustrate several tools, several cases, and a tool together with the case
// it lives in.
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
  kind: PhotoOwnerKind
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
  provider: 'brave' | 'google' | 'openverse'
  sourceUrl: string
  thumbnailUrl: string
  title: string
  url: string
  width: null | number
}

export type SearchProvider = 'brave' | 'google' | 'openverse'

export type PhotoSearchResult = {
  // Which engines were asked, and which of them failed. Several can be on at
  // once, so a result set is not all-or-nothing.
  failed: { message: string; provider: SearchProvider }[]
  providers: SearchProvider[]
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
  note: string
  provider: SearchProvider
  requiresKey: boolean
  requiresSecret: boolean
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
  height: number
  url: string
  width: number
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

export type ToolPage = {
  items: ToolListItem[]
  limit: number
  offset: number
  total: number
}

export type CategoryCount = {
  category: string
  count: number
}

// What POST /api/tools accepts. A PATCH sends any subset of it.
export type ToolFields = {
  brand: string
  category: string
  condition: ToolCondition
  model: string
  name: string
  notes: string
  serialNumber: string
}

// A case: the box the tools live in. Name and maker are required; everything
// else comes off a spec sheet and is null when nobody has filled it in. Zero
// is never "unknown" — a box with no height does not exist.
// Where a label goes on a case: a size in millimetres and nothing else. What
// gets printed on it is a different question.
export type LabelSlot = {
  heightMm: number
  id: number
  widthMm: number
}

export type ToolCase = {
  capacityL: null | number
  createdAt: string
  createdBy: null | number
  diagonalMm: null | number
  ean: string
  id: number
  innerHeightMm: null | number
  innerLengthMm: null | number
  innerWidthMm: null | number
  // Only the detail carries these: a grid of cases has no use for them.
  labelSlots: LabelSlot[]
  loadKg: null | number
  manufacturer: string
  name: string
  notes: string
  outerHeightMm: null | number
  outerLengthMm: null | number
  outerWidthMm: null | number
  sku: string
  system: string
  updatedAt: string
  updatedBy: null | number
}

export type CaseListItem = ToolCase & {
  primaryPhotoUrl: null | string
}

export type CasePage = {
  items: CaseListItem[]
  limit: number
  offset: number
  total: number
}

// What POST /api/cases accepts. A PATCH sends any subset of it, and an
// explicit null clears a measurement.
export type CaseFields = {
  capacityL: null | number
  diagonalMm: null | number
  ean: string
  innerHeightMm: null | number
  innerLengthMm: null | number
  innerWidthMm: null | number
  loadKg: null | number
  manufacturer: string
  name: string
  notes: string
  outerHeightMm: null | number
  outerLengthMm: null | number
  outerWidthMm: null | number
  sku: string
  system: string
}

export type SystemCount = {
  count: number
  system: string
}

// An organizer: which tools live in which case. The number is the one painted
// on the box and said out loud — deliberately not the id.
export type OrganizerTool = {
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
  template: string
  url: string
  widthMm: number
}

// A size this organizer's case has a place for. The wizard's first step, and
// the only sizes a label may be drawn at.
export type OrganizerLabelSlot = {
  heightMm: number
  id: number
  widthMm: number
}

export type Organizer = {
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
  tools: OrganizerTool[]
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
  caseId: number
  description: string
  name: string
  number?: number
  toolIds?: number[]
}

// A maker. One row, many tools; the logo is a picture from the library, linked
// one to one in its own table rather than held as a column.
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
  // How many tools name this maker. Read-only, and the reason the list is
  // worth looking at.
  toolCount: number
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

// One capability for the catalog — tools, the cases they live in, and the
// photos of both. The server says the same thing in src/access/roles.ts.
export type Capability = 'catalog.read' | 'catalog.write' | 'users.manage'

export type User = {
  createdAt: string
  displayName: string
  email: string
  id: number
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
  effectiveRole: Role
  user: User
}
