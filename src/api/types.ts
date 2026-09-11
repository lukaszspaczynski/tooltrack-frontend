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

// The main photo of a tool, as the catalog grid receives it: a URL and
// nothing else, because a card needs a thumbnail and not a photo record.
export type ToolListItem = Tool & {
  primaryPhotoUrl: null | string
}

export type PhotoSource = 'edit' | 'search' | 'upload' | 'url'

export type ToolPhoto = {
  attribution: string
  byteSize: number
  contentType: string
  createdAt: string
  createdBy: null | number
  // Set when this photo is an AI cutout: the id of the photo it was made from.
  derivedFrom: null | number
  height: null | number
  id: number
  isPrimary: boolean
  source: PhotoSource
  sourceUrl: string
  // Null while the photo belongs to no tool.
  toolId: null | number
  url: string
  width: null | number
}

// A photo as the library screen sees it: the same record plus the name of the
// tool it belongs to, because a photo has no name of its own and "which tool
// was this" is the question being asked there.
export type LibraryPhoto = ToolPhoto & {
  // Empty for a photo that has no tool yet.
  toolName: string
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

export const ROLES = ['viewer', 'editor', 'admin'] as const

export type Role = (typeof ROLES)[number]

export type AccountStatus = 'active' | 'disabled'

export type Capability = 'tools.read' | 'tools.write' | 'users.manage'

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
