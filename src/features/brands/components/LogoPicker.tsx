import {
  Alert,
  Card,
  Group,
  Image,
  Loader,
  Modal,
  Pagination,
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

const PAGE_SIZE = 24

// A logo is a picture like any other: uploaded, fetched from an address, found
// by search or cut out. So this picks one from the library rather than
// offering an upload of its own — whatever is already there is fair game.
export function LogoPicker({
  onClose,
  onPick,
  opened,
  saving,
}: {
  onClose: () => void
  onPick: (photoId: number) => void
  opened: boolean
  saving: boolean
}) {
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const [page, setPage] = useState(1)

  const applySearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim() || null)
    setPage(1)
  }, 300)

  const library = useQuery({
    queryKey: ['photo-library', 'logo-picker', search, page],
    queryFn: () =>
      fetchPhotoLibrary({
        assigned: null,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search,
        source: null,
      }),
    enabled: opened,
    placeholderData: keepPreviousData,
  })

  const items = library.data?.items ?? []
  const pages = Math.max(Math.ceil((library.data?.total ?? 0) / PAGE_SIZE), 1)

  return (
    <Modal opened={opened} onClose={onClose} title="Wybierz logo" size="xl" centered>
      <Stack gap="md">
        <TextInput
          label="Szukaj"
          placeholder="Nazwa karty, do której zdjęcie należy…"
          leftSection={<IconSearch size={16} />}
          value={searchText}
          onChange={(event) => {
            setSearchText(event.currentTarget.value)
            applySearch(event.currentTarget.value)
          }}
        />

        {library.isPending ? <Loader size="sm" /> : null}

        {library.data && items.length === 0 ? (
          <Alert color="gray" variant="light">
            Nic tu nie ma. Wgraj logo na ekranie Zdjęcia, a potem wróć tutaj.
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 3, sm: 4, md: 6 }} spacing="sm">
          {items.map((photo) => (
            <Card
              key={photo.id}
              withBorder
              padding="xs"
              radius="md"
              onClick={() => !saving && onPick(photo.id)}
              style={{ cursor: saving ? 'progress' : 'pointer' }}
            >
              <Image src={apiFileUrl(photo.url)} alt="" h={64} fit="contain" />
            </Card>
          ))}
        </SimpleGrid>

        {pages > 1 ? (
          <Group justify="center">
            <Pagination total={pages} value={page} onChange={setPage} size="sm" />
          </Group>
        ) : null}

        <Text size="xs" c="dimmed">
          Jedno zdjęcie może być logo tylko jednej marki.
        </Text>
      </Stack>
    </Modal>
  )
}
