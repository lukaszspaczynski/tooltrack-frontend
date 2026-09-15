import { Button, Stack, Text, Title } from '@mantine/core'
import { Link, Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout'
import { AccountLanguage } from './i18n/AccountLanguage'
import { LoginPage } from './features/auth/pages/LoginPage'
import { CaseCreatePage } from './features/cases/pages/CaseCreatePage'
import { CaseDetailPage } from './features/cases/pages/CaseDetailPage'
import { AddressesPage } from './features/addresses/pages/AddressesPage'
import { BrandsPage } from './features/brands/pages/BrandsPage'
import { CasesListPage } from './features/cases/pages/CasesListPage'
import { LabelsPage } from './features/organizers/pages/LabelsPage'
import { ManualLibraryPage } from './features/manuals/pages/ManualLibraryPage'
import { OrganizerDetailPage } from './features/organizers/pages/OrganizerDetailPage'
import { OrganizersPage } from './features/organizers/pages/OrganizersPage'
import { PhotoLibraryPage } from './features/media/pages/PhotoLibraryPage'
import { SettingsPage } from './features/settings/pages/SettingsPage'
import { ItemCreatePage } from './features/items/pages/ItemCreatePage'
import { ItemDetailPage } from './features/items/pages/ItemDetailPage'
import { ItemsListPage } from './features/items/pages/ItemsListPage'
import { UsersPage } from './features/users/pages/UsersPage'
import { t } from './i18n'
import { RequireCapability } from './session/RequireCapability'
import { useSession } from './session/SessionContext'

// The whole routing surface, in one place. Each screen names the capability it
// needs; RequireCapability turns that into either the screen, a redirect to the
// login page, or an explanation.
export function App() {
  const { session } = useSession()

  return (
    <>
      <AccountLanguage />
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />

        <Route element={<AppLayout />}>
          <Route
            index
            element={
              <RequireCapability capability="catalog.read">
                <ItemsListPage />
              </RequireCapability>
            }
          />
          <Route
            path="items/new"
            element={
              <RequireCapability capability="catalog.write">
                <ItemCreatePage />
              </RequireCapability>
            }
          />
          {/* Before the :id route, as on the server and as the labels screen
            sits under the organizers: "manuals" must not be read as the id of
            an item. */}
          <Route
            path="items/manuals"
            element={
              <RequireCapability capability="catalog.read">
                <ManualLibraryPage />
              </RequireCapability>
            }
          />
          <Route
            path="items/:id"
            element={
              <RequireCapability capability="catalog.read">
                <ItemDetailPage />
              </RequireCapability>
            }
          />
          {/* Cases before the :id route, as on the server: "new" must not be
            read as the id of a case. */}
          <Route
            path="addresses"
            element={
              <RequireCapability capability="catalog.read">
                <AddressesPage />
              </RequireCapability>
            }
          />
          <Route
            path="brands"
            element={
              <RequireCapability capability="catalog.read">
                <BrandsPage />
              </RequireCapability>
            }
          />
          <Route
            path="cases"
            element={
              <RequireCapability capability="catalog.read">
                <CasesListPage />
              </RequireCapability>
            }
          />
          <Route
            path="cases/new"
            element={
              <RequireCapability capability="catalog.write">
                <CaseCreatePage />
              </RequireCapability>
            }
          />
          <Route
            path="cases/:id"
            element={
              <RequireCapability capability="catalog.read">
                <CaseDetailPage />
              </RequireCapability>
            }
          />
          <Route
            path="organizers"
            element={
              <RequireCapability capability="catalog.read">
                <OrganizersPage />
              </RequireCapability>
            }
          />
          {/* Before the :id route, as on the server: "labels" must not be read
            as the id of an organizer. */}
          <Route
            path="organizers/labels"
            element={
              <RequireCapability capability="catalog.read">
                <LabelsPage />
              </RequireCapability>
            }
          />
          <Route
            path="organizers/:id"
            element={
              <RequireCapability capability="catalog.read">
                <OrganizerDetailPage />
              </RequireCapability>
            }
          />
          <Route
            path="photos"
            element={
              <RequireCapability capability="catalog.read">
                <PhotoLibraryPage />
              </RequireCapability>
            }
          />
          <Route
            path="settings"
            element={
              <RequireCapability capability="catalog.read">
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
    </>
  )
}

function NotFound() {
  return (
    <Stack align="flex-start">
      <Title order={2}>{t('Nie ma tu nic')}</Title>
      <Text c="dimmed">{t('Ten adres nie prowadzi do żadnego ekranu.')}</Text>
      <Button component={Link} to="/" variant="light">
        {t('Wróć do katalogu')}
      </Button>
    </Stack>
  )
}
