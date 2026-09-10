import { Center, Loader } from '@mantine/core'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'

import { fetchSession, logout } from '../api/auth'
import { SESSION_QUERY_KEY, SessionContext, type SessionState } from './SessionContext'

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSession,
    // A 401 is an answer, not a failure worth retrying, and fetchSession
    // already turns it into null.
    retry: false,
    // Re-asked when the tab is focused: a session revoked from the admin
    // screen, or expired overnight, should show up as a login prompt rather
    // than as the next click failing.
    refetchOnWindowFocus: true,
  })

  const value = useMemo<SessionState>(() => {
    const session = query.data ?? null
    const capabilities = session?.capabilities ?? []

    return {
      capabilities,
      can: (capability) => capabilities.includes(capability),
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      },
      session,
      signOut: async () => {
        await logout()
        // Everything cached was fetched as the account that just left.
        queryClient.clear()
        await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
      },
    }
  }, [query.data, queryClient])

  // The whole app waits for the first answer. Rendering the login screen for
  // the split second before /auth/me replies would flash it at everyone who is
  // already signed in.
  if (query.isPending) {
    return (
      <Center h="100dvh">
        <Loader color="amber" />
      </Center>
    )
  }

  return <SessionContext value={value}>{children}</SessionContext>
}
