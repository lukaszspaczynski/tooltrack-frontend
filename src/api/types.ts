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

export type PhotoSource = 'search' | 'upload' | 'url'

export type ToolPhoto = {
  attribution: string
  byteSize: number
  contentType: string
  createdAt: string
  createdBy: null | number
  height: null | number
  id: number
  isPrimary: boolean
  source: PhotoSource
  sourceUrl: string
  toolId: number
  url: string
  width: null | number
}

// What the on-demand web search offers. Nothing is stored yet — these are
// links until someone ticks them and the server fetches the bytes.
export type PhotoSuggestion = {
  attribution: string
  height: null | number
  sourceUrl: string
  thumbnailUrl: string
  title: string
  url: string
  width: null | number
}

export type PhotoSearchResult = {
  provider: 'google' | 'none' | 'openverse'
  query: string
  suggestions: PhotoSuggestion[]
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
