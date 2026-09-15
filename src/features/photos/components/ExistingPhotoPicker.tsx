import {
  Alert,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Image,
  Loader,
  Modal,
  Pagination,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { apiFileUrl } from '../../../api/client'
import { fetchPhotoLibrary } from '../../../api/photos'
import type { LibraryPhoto, PhotoOwner } from '../../../api/types'
import { t } from '../../../i18n'

const PAGE_SIZE = 24

// Picking a picture that is already in the system.
//
// It opens on the unassigned ones, because that is what the shelf is for: a
// photo uploaded before anyone decided what it was. "Wszystkie" is there for
// the other case — the same picture illustrating an item and the case it lives
// in, which is allowed and costs a row rather than a second file.
export function ExistingPhotoPicker({
  onClose,
  onPick,
  opened,
  owner,
  saving,
}: {
  onClose: () => void
  onPick: (photoIds: number[]) => void
  opened: boolean
  owner: PhotoOwner
  saving: boolean
}) {
  const [assigned, setAssigned] = useState<'all' | 'unassigned'>('unassigned')
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [page, setPage] = useState(1)

  const applySearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim() || null)
    setPage(1)
    // The selection was made in a different set of results. Carrying it
    // invisibly into a save is how somebody attaches a photo they never saw.
    setSelected([])
  }, 300)

  // The search matches the item a photo belongs to, so it means nothing on the
  // unassigned shelf — and sending it there would return an empty screen with
  // a disabled input and no way to clear it.
  const effectiveSearch = assigned === 'all' ? search : null

  const library = useQuery({
    queryKey: ['photo-library', { assigned, limit: PAGE_SIZE, page, search: effectiveSearch }],
    queryFn: () =>
      fetchPhotoLibrary({
        assigned: assigned === 'unassigned' ? false : null,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search: effectiveSearch,
        source: null,
      }),
    enabled: opened,
    placeholderData: keepPreviousData,
  })

  // A picture already on this card cannot be added again, so it is not
  // offered. Item 4 and case 4 are different cards, hence both halves of the
  // check — and a picture on three other cards is still offered, because that
  // is now allowed.
  const items = (library.data?.items ?? []).filter(
    (photo) => !photo.owners.some((entry) => entry.kind === owner.kind && entry.id === owner.id),
  )
  const pages = Math.max(Math.ceil((library.data?.total ?? 0) / PAGE_SIZE), 1)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('Wybierz istniejące zdjęcie')}
      size="xl"
      centered
    >
      <Stack gap="md">
        <Group align="flex-end" gap="sm">
          <SegmentedControl
            value={assigned}
            onChange={(value) => {
              setAssigned(value as 'all' | 'unassigned')
              setSelected([])
              setPage(1)
            }}
            data={[
              { label: 'Nieprzypisane', value: 'unassigned' },
              { label: 'Wszystkie', value: 'all' },
            ]}
            size="sm"
          />
          <TextInput
            label={t('Szukaj narzędzia')}
            placeholder={t('Nazwa, marka, model…')}
            leftSection={<IconSearch size={16} />}
            value={searchText}
            onChange={(event) => {
              setSearchText(event.currentTarget.value)
              applySearch(event.currentTarget.value)
            }}
            disabled={assigned === 'unassigned'}
            description={
              assigned === 'unassigned'
                ? t('Nieprzypisane zdjęcia nie należą do narzędzia, więc nie ma czego szukać')
                : undefined
            }
            style={{ flexGrow: 1 }}
            size="sm"
          />
        </Group>

        {library.isError ? (
          <Alert color="red" variant="light">
            {(library.error as Error).message}
          </Alert>
        ) : null}

        {library.isPending ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : null}

        {library.data && items.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="md">
            {assigned === 'unassigned'
              ? t(
                  'Nie ma nieprzypisanych zdjęć. Wgraj je na ekranie Zdjęcia albo przełącz na „Wszystkie”.',
                )
              : t('Brak zdjęć do wyboru.')}
          </Text>
        ) : null}

        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {items.map((photo) => (
            <PickerTile
              key={photo.id}
              checked={selected.includes(photo.id)}
              onToggle={() =>
                setSelected((current) =>
                  current.includes(photo.id)
                    ? current.filter((id) => id !== photo.id)
                    : [...current, photo.id],
                )
              }
              photo={photo}
            />
          ))}
        </SimpleGrid>

        {/* Without this, only the newest two dozen photos could ever be
            assigned — and on the unassigned shelf, where the search does not
            apply, nothing else could be reached at all. */}
        {pages > 1 ? (
          <Group justify="center">
            <Pagination total={pages} value={page} onChange={setPage} size="sm" />
          </Group>
        ) : null}

        <Group justify="space-between">
          <Text c="dimmed" size="xs">
            {t(
              'Nieprzypisane zdjęcie przenosi się na kartę. Zdjęcie innego narzędzia zostaje tam, gdzie jest — tutaj pojawia się jego kopia.',
            )}
          </Text>
          <Group gap="sm">
            <Button variant="default" onClick={onClose}>
              {t('Anuluj')}
            </Button>
            <Button
              disabled={selected.length === 0}
              loading={saving}
              onClick={() => onPick(selected)}
            >
              Przypisz {selected.length > 0 ? `(${selected.length})` : ''}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}

function PickerTile({
  checked,
  onToggle,
  photo,
}: {
  checked: boolean
  onToggle: () => void
  photo: LibraryPhoto
}) {
  return (
    <Card
      withBorder
      padding="xs"
      radius="md"
      onClick={onToggle}
      style={{
        borderColor: checked ? 'var(--mantine-color-amber-6)' : undefined,
        cursor: 'pointer',
      }}
    >
      <Stack gap={6}>
        <div style={{ position: 'relative' }}>
          <Image src={apiFileUrl(photo.url)} alt={cardNames(photo)} h={110} fit="contain" />
          <Checkbox
            checked={checked}
            onChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            aria-label={t('Zaznacz zdjęcie {id}', { id: String(photo.id) })}
            style={{ left: 4, position: 'absolute', top: 4 }}
          />
        </div>
        <Text size="xs" c={photo.owners.length > 0 ? undefined : 'dimmed'} lineClamp={1}>
          {cardNames(photo) || 'bez przypisania'}
        </Text>
      </Stack>
    </Card>
  )
}

// Which cards already show this picture. Several is normal now, so they are
// listed rather than reduced to one name.
function cardNames(photo: LibraryPhoto): string {
  return photo.owners.map((owner) => owner.name).join(', ')
}
