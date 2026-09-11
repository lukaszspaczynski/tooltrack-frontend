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
import type { LibraryPhoto } from '../../../api/types'

const PAGE_SIZE = 24

// Picking a picture that is already in the system.
//
// It opens on the unassigned ones, because that is what the shelf is for: a
// photo uploaded before anyone decided what it was. "Wszystkie" is there for
// the other case — the same picture illustrating two tools, which is allowed
// and costs a row rather than a second file.
export function ExistingPhotoPicker({
  onClose,
  onPick,
  opened,
  saving,
  toolId,
}: {
  onClose: () => void
  onPick: (photoIds: number[]) => void
  opened: boolean
  saving: boolean
  toolId: number
}) {
  const [assigned, setAssigned] = useState<'all' | 'unassigned'>('unassigned')
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const [selected, setSelected] = useState<number[]>([])

  const applySearch = useDebouncedCallback((value: string) => setSearch(value.trim() || null), 300)

  const library = useQuery({
    queryKey: ['photo-library', { assigned, limit: PAGE_SIZE, search }],
    queryFn: () =>
      fetchPhotoLibrary({
        assigned: assigned === 'unassigned' ? false : null,
        limit: PAGE_SIZE,
        offset: 0,
        search,
        source: null,
      }),
    enabled: opened,
    placeholderData: keepPreviousData,
  })

  // A photo already on this tool cannot be added again, so it is not offered.
  const items = (library.data?.items ?? []).filter((photo) => photo.toolId !== toolId)

  return (
    <Modal opened={opened} onClose={onClose} title="Wybierz istniejące zdjęcie" size="xl" centered>
      <Stack gap="md">
        <Group align="flex-end" gap="sm">
          <SegmentedControl
            value={assigned}
            onChange={(value) => {
              setAssigned(value as 'all' | 'unassigned')
              setSelected([])
            }}
            data={[
              { label: 'Nieprzypisane', value: 'unassigned' },
              { label: 'Wszystkie', value: 'all' },
            ]}
            size="sm"
          />
          <TextInput
            label="Szukaj narzędzia"
            placeholder="Nazwa, marka, model…"
            leftSection={<IconSearch size={16} />}
            value={searchText}
            onChange={(event) => {
              setSearchText(event.currentTarget.value)
              applySearch(event.currentTarget.value)
            }}
            disabled={assigned === 'unassigned'}
            description={
              assigned === 'unassigned' ? 'Nieprzypisane zdjęcia nie mają czego szukać' : undefined
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
              ? 'Nie ma nieprzypisanych zdjęć. Wgraj je na ekranie Zdjęcia albo przełącz na „Wszystkie”.'
              : 'Brak zdjęć do wyboru.'}
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

        <Group justify="space-between">
          <Text c="dimmed" size="xs">
            Nieprzypisane zdjęcie przenosi się na kartę. Zdjęcie innego narzędzia zostaje tam, gdzie
            jest — tutaj pojawia się jego kopia.
          </Text>
          <Group gap="sm">
            <Button variant="default" onClick={onClose}>
              Anuluj
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
          <Image src={apiFileUrl(photo.url)} alt={photo.toolName} h={110} fit="contain" />
          <Checkbox
            checked={checked}
            onChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Zaznacz zdjęcie ${photo.id}`}
            style={{ left: 4, position: 'absolute', top: 4 }}
          />
        </div>
        <Text size="xs" c={photo.toolName ? undefined : 'dimmed'} lineClamp={1}>
          {photo.toolName || 'bez narzędzia'}
        </Text>
      </Stack>
    </Card>
  )
}
