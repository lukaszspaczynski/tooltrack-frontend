import { createContext, use } from 'react'

import type { Capability, Session } from '../api/types'

export type SessionState = {
  capabilities: Capability[]
  // The only sanctioned way to ask "may this account do X". Reading
  // `session.user.role` in a screen would be a second answer to a question the
  // server already answers, and the two would drift.
  can: (capability: Capability) => boolean
  refresh: () => Promise<void>
  session: null | Session
  signOut: () => Promise<void>
}

export const SessionContext = createContext<null | SessionState>(null)

// Lives here, not in SessionProvider.tsx: a file that exports both a component
// and a constant breaks Fast Refresh, and this key is read by anything that
// needs to invalidate the session.
export const SESSION_QUERY_KEY = ['session'] as const

export function useSession(): SessionState {
  const state = use(SessionContext)
  if (!state) throw new Error('useSession must be used inside <SessionProvider>')
  return state
}
