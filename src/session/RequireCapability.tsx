import { Alert, Button, Stack, Text } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import type { Capability } from '../api/types'
import { useSession } from './SessionContext'

// The client-side half of the server's route policy. It decides what is worth
// rendering, never what is allowed: the API refuses the same calls on its own,
// so a stale capability list here can only produce a worse screen, not a
// permission.
export function RequireCapability({
  capability,
  children,
}: {
  capability: Capability
  children: ReactNode
}) {
  const { can, session } = useSession()
  const location = useLocation()

  // Not signed in and not signed out either — the two need different answers.
  // Sending someone to the login screen with where they were going means the
  // link they followed still works after they log in.
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />

  if (!can(capability)) {
    return (
      <Alert color="gray" icon={<IconLock size={20} />} title="Brak uprawnień" variant="light">
        <Stack align="flex-start" gap="sm">
          <Text size="sm">
            Twoja rola to {session.effectiveRole === 'viewer' ? 'Podgląd' : session.effectiveRole}.
            Poproś administratora o wyższe uprawnienia, jeśli potrzebujesz tej sekcji.
          </Text>
          <Button component={Link} to="/" variant="light">
            Wróć do katalogu
          </Button>
        </Stack>
      </Alert>
    )
  }

  return children
}
