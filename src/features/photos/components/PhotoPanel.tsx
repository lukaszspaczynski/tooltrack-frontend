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
  IconLibraryPhoto,
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
  attachPhotos,
  deletePhoto,
  fetchPhotos,
  importPhotos,
  setPrimaryPhoto,
  uploadPhoto,
  type PhotoImportItem,
} from '../../../api/photos'
import type { Photo, PhotoOwner } from '../../../api/types'
import { t } from '../../../i18n'
import { CutoutStudio } from './CutoutStudio'
import { ExistingPhotoPicker } from './ExistingPhotoPicker'
import { PhotoSuggestionsModal } from './PhotoSuggestionsModal'

const SOURCE_LABELS: Record<Photo['source'], string> = {
  edit: 'wycięte',
  search: 'z wyszukiwarki',
  upload: 'wgrane',
  url: 'z adresu',
}

// The gallery of a card — a tool or a case: every photo, with one marked as
// the main one, which is what the grid shows.
//
// Four ways in, because they are four different situations: a photo taken on
// site (upload), a link to the manufacturer's page (URL), "find me something"
// when nobody has photographed this one yet (search), and a picture that is
// already in the library (pick).
//
// It takes an owner rather than a tool because a case carries photos on
// exactly the same terms; the server serves both from one set of routes.
export function PhotoPanel({
  canEdit,
  label,
  owner,
  searchQuery,
}: {
  canEdit: boolean
  // What to put in the alt text: the name of the card these belong to.
  label: string
  owner: PhotoOwner
  // What the suggestions modal should search for before anyone types.
  searchQuery: string
}) {
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [suggestionsOpen, suggestions] = useDisclosure(false)
  const [pickerOpen, picker] = useDisclosure(false)

  const photos = useQuery({
    queryKey: ['card-photos', owner.kind, owner.id],
    queryFn: () => fetchPhotos(owner),
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
    await queryClient.invalidateQueries({ queryKey: ['card-photos', owner.kind, owner.id] })
    // The grid shows the main photo, so it changed too.
    await queryClient.invalidateQueries({ queryKey: ['tools'] })
  }

  const upload = useMutation({
    mutationFn: (file: File) => uploadPhoto(owner, file),
    onSuccess: async () => {
      await refresh()
      notifications.show({ color: 'teal', message: t('Zdjęcie dodane') })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const importFromWeb = useMutation({
    mutationFn: (items: PhotoImportItem[]) => importPhotos(owner, items),
    onSuccess: async (result) => {
      await refresh()
      setUrl('')
      suggestions.close()
      notifications.show({
        color: result.photos.length > 0 ? 'teal' : 'orange',
        message:
          result.failed.length === 0
            ? t('Zapisano {n}', { n: result.photos.length })
            : t('Zapisano {n}, nie udało się {failed}', {
                failed: result.failed.length,
                n: result.photos.length,
              }),
      })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  // The cutout opens a screen of its own: method, parameters, original and
  // result side by side, and nothing written until it is accepted.
  const [cutoutPhoto, setCutoutPhoto] = useState<null | Photo>(null)

  // Photos that already exist: the unassigned shelf in the library, or a
  // picture another tool is using.
  const attach = useMutation({
    mutationFn: (photoIds: number[]) => attachPhotos(owner, photoIds),
    onSuccess: async (result) => {
      await refresh()
      // The library changed too: an unattached photo just left the shelf.
      await queryClient.invalidateQueries({ queryKey: ['photo-library'] })
      picker.close()
      // Always teal: attaching nothing is a 409 from the API, so it arrives at
      // onError below rather than here.
      notifications.show({
        color: 'teal',
        message:
          result.failed.length === 0
            ? t('Przypisano {n}', { n: result.photos.length })
            : t('Przypisano {n}, pominięto {skipped}', {
                n: result.photos.length,
                skipped: result.failed.length,
              }),
      })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const promote = useMutation({
    mutationFn: (photoId: number) => setPrimaryPhoto(owner, photoId),
    onSuccess: refresh,
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: (photoId: number) => deletePhoto(owner, photoId),
    onSuccess: refresh,
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const items = photos.data?.photos ?? []
  const busy = upload.isPending || importFromWeb.isPending

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text fw={600}>
          {t('Zdjęcia')} {items.length > 0 ? `(${items.length})` : ''}
        </Text>
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
                  {t('Wgraj')}
                </Button>
              )}
            </FileButton>
            <Button
              size="sm"
              variant="light"
              leftSection={<IconLibraryPhoto size={16} />}
              onClick={picker.open}
            >
              {t('Wybierz istniejące')}
            </Button>
            <Tooltip
              label={t('Żadna wyszukiwarka nie jest włączona — sprawdź Ustawienia')}
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
                  {t('Znajdź w internecie')}
                </Button>
              </div>
            </Tooltip>
          </Group>
        ) : null}
      </Group>

      {canEdit ? (
        <Group align="flex-end" gap="sm">
          <TextInput
            label={t('Albo wklej adres zdjęcia')}
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
            {t('Pobierz')}
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
            ? t('Brak zdjęć. Wgraj z telefonu, wklej adres albo poszukaj w internecie.')
            : t('Brak zdjęć.')}
        </Text>
      ) : null}

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
        {items.map((photo) => (
          <Card key={photo.id} withBorder padding="xs" radius="md">
            <Stack gap={6}>
              <Image src={apiFileUrl(photo.url)} alt={label} h={140} fit="contain" radius="sm" />

              <Group justify="space-between" gap={4} wrap="nowrap">
                <Badge size="xs" variant="light" color={photo.isPrimary ? 'amber' : 'gray'}>
                  {photo.isPrimary ? t('główne') : t(SOURCE_LABELS[photo.source])}
                </Badge>

                {canEdit ? (
                  <Group gap={2} wrap="nowrap">
                    <Tooltip
                      label={
                        photo.source === 'edit'
                          ? t('To zdjęcie już jest wycięte')
                          : `Wytnij ${owner.kind === 'case' ? t('samą skrzynkę') : t('samo narzędzie')}`
                      }
                    >
                      <ActionIcon
                        variant="subtle"
                        color="grape"
                        aria-label={t('Wytnij sam przedmiot')}
                        disabled={photo.source === 'edit'}
                        onClick={() => setCutoutPhoto(photo)}
                      >
                        <IconWand size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip
                      label={photo.isPrimary ? t('To jest zdjęcie główne') : t('Ustaw jako główne')}
                    >
                      <ActionIcon
                        variant="subtle"
                        color={photo.isPrimary ? 'amber' : 'gray'}
                        disabled={photo.isPrimary || promote.isPending}
                        aria-label={t('Ustaw jako główne')}
                        onClick={() => promote.mutate(photo.id)}
                      >
                        {photo.isPrimary ? <IconStarFilled size={16} /> : <IconStar size={16} />}
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t('Usuń zdjęcie')}>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        loading={remove.isPending && remove.variables === photo.id}
                        aria-label={t('Usuń zdjęcie')}
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
          owner={owner}
        />
      ) : null}

      {/* Mounted per opening, like the cutout screen: a picker that keeps its
          selection between visits offers to attach photos nobody can see. */}
      {canEdit && pickerOpen ? (
        <ExistingPhotoPicker
          opened
          onClose={picker.close}
          onPick={(photoIds) => attach.mutate(photoIds)}
          saving={attach.isPending}
          owner={owner}
        />
      ) : null}

      {canEdit ? (
        <PhotoSuggestionsModal
          opened={suggestionsOpen}
          onClose={suggestions.close}
          onSave={(chosen) => importFromWeb.mutate(chosen)}
          saving={busy}
          owner={owner}
          defaultQuery={searchQuery}
        />
      ) : null}
    </Stack>
  )
}
