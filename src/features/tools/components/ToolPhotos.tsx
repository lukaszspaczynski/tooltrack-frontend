import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  FileButton,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPhotoPlus,
  IconSearch,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconWand,
  IconWorld,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { apiFileUrl } from '../../../api/client'
import { fetchSearchEngines, SEARCH_ENGINES_KEY } from '../../../api/settings'
import {
  deletePhoto,
  fetchPhotos,
  importPhotos,
  setPrimaryPhoto,
  uploadPhoto,
  type PhotoImportItem,
} from '../../../api/photos'
import type { Tool, ToolPhoto } from '../../../api/types'
import { CutoutStudio } from './CutoutStudio'
import { PhotoSuggestionsModal } from './PhotoSuggestionsModal'

const SOURCE_LABELS: Record<ToolPhoto['source'], string> = {
  edit: 'wycięte',
  search: 'z wyszukiwarki',
  upload: 'wgrane',
  url: 'z adresu',
}

// The gallery of a tool: every photo, with one marked as the main one — that is
// the one the catalog grid shows.
//
// Three ways in, because they are three different situations: a photo taken on
// site (upload), a link to the manufacturer's page (URL), and "find me
// something" when nobody has photographed this machine yet (search).
export function ToolPhotos({ canEdit, tool }: { canEdit: boolean; tool: Tool }) {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [suggestionsOpen, suggestions] = useDisclosure(false)

  const photos = useQuery({
    queryKey: ['tool-photos', tool.id],
    queryFn: () => fetchPhotos(tool.id),
  })

  // Whether any search engine is switched on for this account. The button is
  // dead rather than hopeful when none is: the API would answer 503, and a
  // button that only ever fails is worse than a disabled one.
  const engines = useQuery({
    queryKey: SEARCH_ENGINES_KEY,
    queryFn: fetchSearchEngines,
    enabled: canEdit,
    staleTime: 60_000,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tool-photos', tool.id] })
    // The grid shows the main photo, so it changed too.
    await queryClient.invalidateQueries({ queryKey: ['tools'] })
  }

  const upload = useMutation({
    mutationFn: (file: File) => uploadPhoto(tool.id, file),
    onSuccess: async () => {
      await refresh()
      notifications.show({ color: 'teal', message: 'Zdjęcie dodane' })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const importFromWeb = useMutation({
    mutationFn: (items: PhotoImportItem[]) => importPhotos(tool.id, items),
    onSuccess: async (result) => {
      await refresh()
      setUrl('')
      suggestions.close()
      notifications.show({
        color: result.photos.length > 0 ? 'teal' : 'orange',
        message:
          result.failed.length === 0
            ? `Zapisano ${result.photos.length}`
            : `Zapisano ${result.photos.length}, nie udało się ${result.failed.length}`,
      })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  // The cutout opens a screen of its own: method, parameters, original and
  // result side by side, and nothing written until it is accepted.
  const [cutoutPhoto, setCutoutPhoto] = useState<null | ToolPhoto>(null)

  const promote = useMutation({
    mutationFn: (photoId: number) => setPrimaryPhoto(tool.id, photoId),
    onSuccess: refresh,
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: (photoId: number) => deletePhoto(tool.id, photoId),
    onSuccess: refresh,
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const items = photos.data?.photos ?? []
  const busy = upload.isPending || importFromWeb.isPending

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={600}>Zdjęcia {items.length > 0 ? `(${items.length})` : ''}</Text>
        {canEdit ? (
          <Group gap="xs">
            <FileButton onChange={(file) => file && upload.mutate(file)} accept="image/*">
              {(props) => (
                <Button
                  {...props}
                  size="sm"
                  variant="light"
                  leftSection={<IconPhotoPlus size={16} />}
                  loading={upload.isPending}
                >
                  Wgraj
                </Button>
              )}
            </FileButton>
            <Tooltip
              label="Żadna wyszukiwarka nie jest włączona — sprawdź Ustawienia"
              disabled={(engines.data?.usable ?? 1) > 0}
            >
              <div>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconSearch size={16} />}
                  disabled={engines.data?.usable === 0}
                  onClick={suggestions.open}
                >
                  Znajdź w internecie
                </Button>
              </div>
            </Tooltip>
          </Group>
        ) : null}
      </Group>

      {canEdit ? (
        <Group align="flex-end" gap="sm">
          <TextInput
            label="Albo wklej adres zdjęcia"
            placeholder="https://…"
            value={url}
            onChange={(event) => setUrl(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && url.trim()) importFromWeb.mutate([{ url: url.trim() }])
            }}
            style={{ flexGrow: 1 }}
            leftSection={<IconWorld size={16} />}
            size="sm"
          />
          <Button
            size="sm"
            variant="default"
            disabled={!url.trim()}
            loading={importFromWeb.isPending}
            onClick={() => importFromWeb.mutate([{ url: url.trim() }])}
          >
            Pobierz
          </Button>
        </Group>
      ) : null}

      {photos.isError ? (
        <Alert color="red" variant="light">
          {(photos.error as Error).message}
        </Alert>
      ) : null}

      {items.length === 0 && !photos.isPending ? (
        <Text c="dimmed" size="sm">
          {canEdit
            ? 'Brak zdjęć. Wgraj z telefonu, wklej adres albo poszukaj w internecie.'
            : 'Brak zdjęć.'}
        </Text>
      ) : null}

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
        {items.map((photo) => (
          <Card key={photo.id} withBorder padding="xs" radius="md">
            <Stack gap={6}>
              <Image
                src={apiFileUrl(photo.url)}
                alt={tool.name}
                h={140}
                fit="contain"
                radius="sm"
              />

              <Group justify="space-between" gap={4} wrap="nowrap">
                <Badge size="xs" variant="light" color={photo.isPrimary ? 'amber' : 'gray'}>
                  {photo.isPrimary ? 'główne' : SOURCE_LABELS[photo.source]}
                </Badge>

                {canEdit ? (
                  <Group gap={2} wrap="nowrap">
                    <Tooltip
                      label={
                        photo.source === 'edit'
                          ? 'To zdjęcie już jest wycięte'
                          : 'Wytnij samo narzędzie'
                      }
                    >
                      <ActionIcon
                        variant="subtle"
                        color="grape"
                        aria-label="Wytnij samo narzędzie"
                        disabled={photo.source === 'edit'}
                        onClick={() => setCutoutPhoto(photo)}
                      >
                        <IconWand size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip
                      label={photo.isPrimary ? 'To jest zdjęcie główne' : 'Ustaw jako główne'}
                    >
                      <ActionIcon
                        variant="subtle"
                        color={photo.isPrimary ? 'amber' : 'gray'}
                        disabled={photo.isPrimary || promote.isPending}
                        aria-label="Ustaw jako główne"
                        onClick={() => promote.mutate(photo.id)}
                      >
                        {photo.isPrimary ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Usuń zdjęcie">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        loading={remove.isPending && remove.variables === photo.id}
                        aria-label="Usuń zdjęcie"
                        onClick={() => remove.mutate(photo.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ) : null}
              </Group>

              {photo.attribution ? (
                <Text size="xs" c="dimmed" lineClamp={1} title={photo.attribution}>
                  {photo.attribution}
                </Text>
              ) : null}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {cutoutPhoto ? (
        <CutoutStudio
          opened
          onClose={() => setCutoutPhoto(null)}
          onSaved={refresh}
          photo={cutoutPhoto}
          toolId={tool.id}
        />
      ) : null}

      {canEdit ? (
        <PhotoSuggestionsModal
          opened={suggestionsOpen}
          onClose={suggestions.close}
          onSave={(chosen) => importFromWeb.mutate(chosen)}
          saving={busy}
          tool={tool}
        />
      ) : null}
    </Stack>
  )
}
