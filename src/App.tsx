import { Button, Stack, Text, Title } from '@mantine/core'
import { Link, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './features/auth/pages/LoginPage'
import { PhotoLibraryPage } from './features/media/pages/PhotoLibraryPage'
import { SettingsPage } from './features/settings/pages/SettingsPage'
import { ToolCreatePage } from './features/tools/pages/ToolCreatePage'
import { ToolDetailPage } from './features/tools/pages/ToolDetailPage'
import { ToolsListPage } from './features/tools/pages/ToolsListPage'
import { UsersPage } from './features/users/pages/UsersPage'
import { RequireCapability } from './session/RequireCapability'
import { useSession } from './session/SessionContext'

// The whole routing surface, in one place. Each screen names the capability it
// needs; RequireCapability turns that into either the screen, a redirect to the
// login page, or an explanation.
export function App() {
  const { session } = useSession()

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />

      <Route element={<AppLayout />}>
        <Route
          index
          element={
            <RequireCapability capability="tools.read">
              <ToolsListPage />
            </RequireCapability>
          }
        />
        <Route
          path="tools/new"
          element={
            <RequireCapability capability="tools.write">
              <ToolCreatePage />
            </RequireCapability>
          }
        />
        <Route
          path="tools/:id"
          element={
            <RequireCapability capability="tools.read">
              <ToolDetailPage />
            </RequireCapability>
          }
        />
        <Route
          path="photos"
          element={
            <RequireCapability capability="tools.read">
              <PhotoLibraryPage />
            </RequireCapability>
          }
        />
        <Route
          path="settings"
          element={
            <RequireCapability capability="tools.read">
              <SettingsPage />
            </RequireCapability>
          }
        />
        <Route
          path="users"
          element={
            <RequireCapability capability="users.manage">
              <UsersPage />
            </RequireCapability>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

function NotFound() {
  return (
    <Stack align="flex-start">
      <Title order={2}>Nie ma tu nic</Title>
      <Text c="dimmed">Ten adres nie prowadzi do żadnego ekranu.</Text>
      <Button component={Link} to="/" variant="light">
        Wróć do katalogu
      </Button>
    </Stack>
  )
}
