import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Image,
  List,
  Loader,
  Modal,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { FileButton } from '@mantine/core'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconAlertTriangle,
  IconPhotoPlus,
  IconSearch,
  IconStarFilled,
  IconTrash,
  IconWand,
} from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import { deletePhotos, fetchPhotoLibrary, uploadLibraryPhoto } from '../../../api/photos'
import type { LibraryPhoto } from '../../../api/types'
import { useSession } from '../../../session/SessionContext'
import { CutoutStudio } from '../../tools/components/CutoutStudio'
import { formatDateTime } from '../../tools/presentation'
import {
  ASSIGNED_OPTIONS,
  LIBRARY_PAGE_SIZE,
  libraryPage,
  readLibraryParams,
  SOURCE_OPTIONS,
  withLibraryFilter,
  writeLibraryParams,
} from '../libraryParams'

const SOURCE_LABELS: Record<string, string> = {
  search: 'z wyszukiwarki',
  upload: 'wgrane',
  url: 'z adresu',
}

// Every photo in the system, across all tools. This is the screen for cleaning
// up after an import that pulled in the wrong pictures — hence the tick boxes
// and the batch delete, which the per-tool gallery deliberately does not have.
export function PhotoLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { can } = useSession()

  const query = readLibraryParams(searchParams)
  const [searchText, setSearchText] = useState(query.search ?? '')
  const [selected, setSelected] = useState<number[]>([])
  const [pending, setPending] = useState<LibraryPhoto[]>([])
  const [confirmOpen, confirm] = useDisclosure(false)

  const apply = (changes: Parameters<typeof withLibraryFilter>[1]) => {
    setSearchParams(writeLibraryParams(withLibraryFilter(query, changes)), { replace: true })
    setSelected([])
  }

  const applySearch = useDebouncedCallback((value: string) => {
    apply({ search: value.trim() || null })
  }, 300)

  const library = useQuery({
    queryKey: ['photo-library', query],
    queryFn: () => fetchPhotoLibrary(query),
    placeholderData: keepPreviousData,
  })

  // An upload here belongs to no tool. Pictures arrive before anyone decides
  // what they are, and forcing a tool at that moment is how photos end up on
  // the wrong card.
  const upload = useMutation({
    mutationFn: (file: File) => uploadLibraryPhoto(file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['photo-library'] })
      notifications.show({ color: 'teal', message: 'Zdjęcie dodane do biblioteki' })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: (ids: number[]) => deletePhotos(ids),
    onSuccess: async (result) => {
      setSelected([])
      setPending([])
      confirm.close()
      await queryClient.invalidateQueries({ queryKey: ['photo-library'] })
      // The tool cards and their galleries show these pictures too.
      await queryClient.invalidateQueries({ queryKey: ['tools'] })
      await queryClient.invalidateQueries({ queryKey: ['tool-photos'] })

      notifications.show({
        color: 'teal',
        message:
          result.deleted === result.requested
            ? `Usunięto ${result.deleted}`
            : `Usunięto ${result.deleted} z ${result.requested} — reszty już nie było`,
      })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  // The same cutout screen as on the tool's own gallery. It belongs here too:
  // this is where a whole import is reviewed, and "this one needs cutting out"
  // is decided while looking at the batch.
  const [cutoutTarget, setCutoutTarget] = useState<null | LibraryPhoto>(null)

  const items = library.data?.items ?? []
  const total = library.data?.total ?? 0
  const pages = Math.max(Math.ceil(total / LIBRARY_PAGE_SIZE), 1)
  const allOnPageSelected = items.length > 0 && items.every((item) => selected.includes(item.id))

  const askToDelete = (photos: LibraryPhoto[]) => {
    if (photos.length === 0) return
    setPending(photos)
    confirm.open()
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <Title order={2}>Zdjęcia</Title>
          <Text c="dimmed" size="sm">
            Wszystkie zdjęcia w systemie, niezależnie od narzędzia.
          </Text>
        </Stack>

        {can('tools.write') ? (
          <Group gap="sm">
            {selected.length > 0 ? (
              <Button
                color="red"
                leftSection={<IconTrash size={18} />}
                onClick={() => askToDelete(items.filter((item) => selected.includes(item.id)))}
              >
                Usuń zaznaczone ({selected.length})
              </Button>
            ) : null}
            <FileButton onChange={(file) => file && upload.mutate(file)} accept="image/*">
              {(props) => (
                <Button
                  {...props}
                  leftSection={<IconPhotoPlus size={18} />}
                  loading={upload.isPending}
                >
                  Wgraj zdjęcie
                </Button>
              )}
            </FileButton>
          </Group>
        ) : null}
      </Group>

      <Group align="flex-end" gap="sm">
        <TextInput
          label="Szukaj narzędzia"
          description="Zdjęcie nie ma własnej nazwy — szukamy po narzędziu"
          placeholder="Nazwa, marka, model…"
          leftSection={<IconSearch size={16} />}
          value={searchText}
          onChange={(event) => {
            setSearchText(event.currentTarget.value)
            applySearch(event.currentTarget.value)
          }}
          style={{ flexGrow: 1 }}
          miw={220}
        />
        <Select
          label="Źródło"
          placeholder="Dowolne"
          clearable
          data={SOURCE_OPTIONS.map((option) => ({ ...option }))}
          value={query.source}
          onChange={(value) => apply({ source: value })}
          miw={170}
        />
        <Select
          label="Przypisanie"
          placeholder="Wszystkie"
          clearable
          data={ASSIGNED_OPTIONS.map((option) => ({ ...option }))}
          value={query.assigned === null ? null : String(query.assigned)}
          onChange={(value) => apply({ assigned: value === null ? null : value === 'true' })}
          miw={200}
        />
      </Group>

      {library.isError ? (
        <Alert color="red" variant="light" title="Nie udało się wczytać zdjęć">
          {(library.error as Error).message}
        </Alert>
      ) : null}

      {library.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {library.data ? (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {total === 0 ? 'Brak zdjęć' : `${total} zdjęć`}
          </Text>
          {can('tools.write') && items.length > 0 ? (
            <Checkbox
              label="Zaznacz wszystkie na tej stronie"
              checked={allOnPageSelected}
              indeterminate={!allOnPageSelected && items.some((item) => selected.includes(item.id))}
              onChange={(event) =>
                setSelected(event.currentTarget.checked ? items.map((item) => item.id) : [])
              }
            />
          ) : null}
        </Group>
      ) : null}

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="sm">
        {items.map((photo) => (
          <PhotoTile
            key={photo.id}
            canEdit={can('tools.write')}
            checked={selected.includes(photo.id)}
            onCutout={() => setCutoutTarget(photo)}
            onDelete={() => askToDelete([photo])}
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

      {pages > 1 ? (
        <Group justify="center" mt="sm">
          <Pagination
            total={pages}
            value={libraryPage(query)}
            onChange={(page) => {
              setSearchParams(
                writeLibraryParams({ ...query, offset: (page - 1) * LIBRARY_PAGE_SIZE }),
              )
              setSelected([])
              window.scrollTo({ top: 0 })
            }}
          />
        </Group>
      ) : null}

      {cutoutTarget && cutoutTarget.toolId !== null ? (
        <CutoutStudio
          opened
          onClose={() => setCutoutTarget(null)}
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: ['photo-library'] })
            await queryClient.invalidateQueries({ queryKey: ['tool-photos'] })
          }}
          photo={cutoutTarget}
          toolId={cutoutTarget.toolId}
        />
      ) : null}

      <DeleteConfirmation
        onCancel={() => {
          setPending([])
          confirm.close()
        }}
        onConfirm={() => remove.mutate(pending.map((photo) => photo.id))}
        opened={confirmOpen}
        pending={pending}
        working={remove.isPending}
      />
    </Stack>
  )
}

function PhotoTile({
  canEdit,
  checked,
  onCutout,
  onDelete,
  onToggle,
  photo,
}: {
  canEdit: boolean
  checked: boolean
  onCutout: () => void
  onDelete: () => void
  onToggle: () => void
  photo: LibraryPhoto
}) {
  return (
    <Card
      withBorder
      padding="xs"
      radius="md"
      style={{ borderColor: checked ? 'var(--mantine-color-amber-6)' : undefined }}
    >
      <Stack gap={6}>
        <div style={{ position: 'relative' }}>
          <Image src={apiFileUrl(photo.url)} alt={photo.toolName} h={110} fit="contain" />
          {canEdit ? (
            <Checkbox
              checked={checked}
              onChange={onToggle}
              aria-label={`Zaznacz zdjęcie ${photo.id}`}
              style={{ left: 4, position: 'absolute', top: 4 }}
            />
          ) : null}
          {photo.isPrimary ? (
            <Tooltip label="Zdjęcie główne narzędzia">
              <IconStarFilled
                size={16}
                style={{
                  color: 'var(--mantine-color-amber-6)',
                  position: 'absolute',
                  right: 6,
                  top: 6,
                }}
              />
            </Tooltip>
          ) : null}
        </div>

        {photo.toolId === null ? (
          <Text size="xs" fw={600} c="dimmed" lineClamp={1}>
            bez narzędzia
          </Text>
        ) : (
          <Text
            component={Link}
            to={`/tools/${photo.toolId}`}
            size="xs"
            fw={600}
            lineClamp={1}
            title={photo.toolName}
          >
            {photo.toolName}
          </Text>
        )}

        <Group justify="space-between" gap={4} wrap="nowrap">
          <Badge size="xs" variant="default">
            {SOURCE_LABELS[photo.source] ?? photo.source}
          </Badge>
          {canEdit ? (
            <Group gap={2} wrap="nowrap">
              <Tooltip
                label={
                  photo.source === 'edit' ? 'To zdjęcie już jest wycięte' : 'Wytnij samo narzędzie'
                }
              >
                <ActionIcon
                  variant="subtle"
                  color="grape"
                  aria-label="Wytnij samo narzędzie"
                  disabled={photo.source === 'edit'}
                  onClick={onCutout}
                >
                  <IconWand size={15} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Usuń zdjęcie">
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label="Usuń zdjęcie"
                  onClick={onDelete}
                >
                  <IconTrash size={15} />
                </ActionIcon>
              </Tooltip>
            </Group>
          ) : null}
        </Group>

        <Text size="xs" c="dimmed">
          {formatDateTime(photo.createdAt)}
        </Text>
      </Stack>
    </Card>
  )
}

// The alert the deletion has to pass through. Every photo here belongs to a
// tool, so the modal always names them — and calls out the ones that are a
// tool's main photo, because removing those changes what the catalog grid
// shows, which is the surprise worth warning about.
function DeleteConfirmation({
  onCancel,
  onConfirm,
  opened,
  pending,
  working,
}: {
  onCancel: () => void
  onConfirm: () => void
  opened: boolean
  pending: LibraryPhoto[]
  working: boolean
}) {
  const attached = pending.filter((photo) => photo.toolId !== null)
  const tools = [...new Map(attached.map((photo) => [photo.toolId, photo.toolName])).entries()]
  const loose = pending.length - attached.length
  const primaries = pending.filter((photo) => photo.isPrimary)

  return (
    <Modal opened={opened} onClose={onCancel} title="Usunąć zdjęcia?" centered>
      <Stack gap="md">
        <Text size="sm">
          {pending.length === 1
            ? 'To zdjęcie zostanie trwale usunięte z dysku.'
            : `Zaznaczono ${pending.length} zdjęć. Zostaną trwale usunięte z dysku.`}
        </Text>

        {tools.length === 0 ? (
          <Text c="dimmed" size="sm">
            {loose === 1
              ? 'To zdjęcie nie jest przypisane do żadnego narzędzia.'
              : 'Żadne z tych zdjęć nie jest przypisane do narzędzia.'}
          </Text>
        ) : (
          <Alert
            color={primaries.length > 0 ? 'orange' : 'gray'}
            variant="light"
            icon={<IconAlertTriangle size={18} />}
            title={
              tools.length === 1
                ? 'Zdjęcie jest przypisane do narzędzia'
                : `Zdjęcia są przypisane do ${tools.length} narzędzi`
            }
          >
            <List size="sm" spacing={2}>
              {tools.map(([id, name]) => (
                <List.Item key={id}>{name}</List.Item>
              ))}
            </List>

            {primaries.length > 0 ? (
              <Text size="sm" mt="xs">
                {primaries.length === 1
                  ? 'Jedno z nich to zdjęcie główne — kartę zacznie ilustrować inne zdjęcie, a jeśli innych nie ma, karta zostanie bez zdjęcia.'
                  : `${primaries.length} z nich to zdjęcia główne — te karty zaczną pokazywać inne zdjęcia, a te bez zapasu zostaną bez zdjęcia.`}
              </Text>
            ) : null}

            {loose > 0 ? (
              <Text size="sm" mt="xs">
                Do tego {loose === 1 ? 'jedno zdjęcie' : `${loose} zdjęć`} bez przypisania.
              </Text>
            ) : null}
          </Alert>
        )}

        <Text size="xs" c="dimmed">
          Same narzędzia zostają w katalogu — usuwasz wyłącznie zdjęcia.
        </Text>

        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Anuluj
          </Button>
          <Button color="red" loading={working} onClick={onConfirm}>
            Usuń {pending.length > 1 ? `(${pending.length})` : ''}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
