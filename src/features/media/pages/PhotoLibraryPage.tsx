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
  IconWorld,
  IconStarFilled,
  IconTrash,
  IconWand,
} from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import {
  deletePhotos,
  fetchPhotoLibrary,
  importLibraryPhoto,
  uploadLibraryPhoto,
} from '../../../api/photos'
import type { LibraryPhoto, PhotoOwner } from '../../../api/types'
import { COUNTS, t, tCount } from '../../../i18n'
import { useSession } from '../../../session/SessionContext'
import { CutoutStudio } from '../../photos/components/CutoutStudio'
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
      notifications.show({ color: 'teal', message: t('Zdjęcie dodane do biblioteki') })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  // The same picture from an address instead of a file. Bytes already on the
  // server answer with the picture that is there, so pasting a link twice is
  // not an error.
  const [url, setUrl] = useState('')
  const importFromUrl = useMutation({
    mutationFn: (value: string) => importLibraryPhoto(value),
    onSuccess: async ({ created }) => {
      await queryClient.invalidateQueries({ queryKey: ['photo-library'] })
      setUrl('')
      notifications.show({
        color: created ? 'teal' : 'blue',
        message: created ? t('Zdjęcie dodane do biblioteki') : t('To zdjęcie już tu było'),
      })
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
            ? t('Usunięto {n}', { n: result.deleted })
            : t('Usunięto {n} z {asked} — reszty już nie było', {
                asked: result.requested,
                n: result.deleted,
              }),
      })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  // The same cutout screen as on the tool's own gallery. It belongs here too:
  // this is where a whole import is reviewed, and "this one needs cutting out"
  // is decided while looking at the batch.
  const [cutoutTarget, setCutoutTarget] = useState<null | LibraryPhoto>(null)

  // The wand works through a card, because that is the only route the cutout
  // has. A picture on several cards is cut out through the first of them — the
  // result is a new picture either way — and one nobody has placed cannot be
  // cut out from here at all.
  const cutoutOwner: null | PhotoOwner = cutoutTarget?.owners[0]
    ? { id: cutoutTarget.owners[0].id, kind: cutoutTarget.owners[0].kind }
    : null

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
          <Title order={2}>{t('Zdjęcia')}</Title>
          <Text c="dimmed" size="sm">
            {t('Wszystkie zdjęcia w systemie, niezależnie od narzędzia.')}
          </Text>
        </Stack>

        {can('catalog.write') ? (
          <Group gap="sm">
            {selected.length > 0 ? (
              <Button
                color="red"
                leftSection={<IconTrash size={18} />}
                onClick={() => askToDelete(items.filter((item) => selected.includes(item.id)))}
              >
                {t('Usuń zaznaczone')} ({selected.length})
              </Button>
            ) : null}
            <FileButton onChange={(file) => file && upload.mutate(file)} accept="image/*">
              {(props) => (
                <Button
                  {...props}
                  leftSection={<IconPhotoPlus size={18} />}
                  loading={upload.isPending}
                >
                  {t('Wgraj zdjęcie')}
                </Button>
              )}
            </FileButton>

            {/* The other way in, next to the file: an address the server
                fetches. The same guards apply — the URL is checked before
                anything is opened, and the bytes decide what the file is. */}
            <TextInput
              placeholder="albo wklej adres https://…"
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && url.trim()) importFromUrl.mutate(url.trim())
              }}
              leftSection={<IconWorld size={16} />}
              w={260}
            />
            <Button
              variant="default"
              disabled={!url.trim()}
              loading={importFromUrl.isPending}
              onClick={() => importFromUrl.mutate(url.trim())}
            >
              {t('Pobierz')}
            </Button>
          </Group>
        ) : null}
      </Group>

      <Group align="flex-end" gap="sm">
        <TextInput
          label={t('Szukaj narzędzia')}
          description={t('Zdjęcie nie ma własnej nazwy — szukamy po narzędziu')}
          placeholder={t('Nazwa, marka, model…')}
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
          label={t('Źródło')}
          placeholder={t('Dowolne')}
          clearable
          data={SOURCE_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
          value={query.source}
          onChange={(value) => apply({ source: value })}
          miw={170}
        />
        <Select
          label={t('Przypisanie')}
          placeholder={t('Wszystkie')}
          clearable
          data={ASSIGNED_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
          value={query.assigned === null ? null : String(query.assigned)}
          onChange={(value) => apply({ assigned: value === null ? null : value === 'true' })}
          miw={200}
        />
      </Group>

      {library.isError ? (
        <Alert color="red" variant="light" title={t('Nie udało się wczytać zdjęć')}>
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
            {total === 0 ? t('Brak zdjęć') : tCount(COUNTS.photo, total)}
          </Text>
          {can('catalog.write') && items.length > 0 ? (
            <Checkbox
              label={t('Zaznacz wszystkie na tej stronie')}
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
            canEdit={can('catalog.write')}
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

      {cutoutOwner ? (
        <CutoutStudio
          opened
          onClose={() => setCutoutTarget(null)}
          onSaved={async () => {
            await queryClient.invalidateQueries({ queryKey: ['photo-library'] })
            await queryClient.invalidateQueries({ queryKey: ['card-photos'] })
          }}
          photo={cutoutTarget!}
          owner={cutoutOwner}
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
          <Image src={apiFileUrl(photo.url)} alt={ownerLabel(photo)} h={110} fit="contain" />
          {canEdit ? (
            <Checkbox
              checked={checked}
              onChange={onToggle}
              aria-label={t('Zaznacz zdjęcie {id}', { id: String(photo.id) })}
              style={{ left: 4, position: 'absolute', top: 4 }}
            />
          ) : null}
          {isPrimarySomewhere(photo) ? (
            <Tooltip label={primaryLabel(photo)}>
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

        {photo.owners.length === 0 && photo.logoForBrand === null ? (
          <Text size="xs" fw={600} c="dimmed" lineClamp={1}>
            bez przypisania
          </Text>
        ) : (
          // Everything this picture is used for: every card showing it, and
          // the maker it is the logo of. A logo is not a card, but saying
          // "bez przypisania" about one is how a picture gets deleted by
          // somebody who thought nothing used it.
          <Group gap={4} wrap="nowrap" style={{ overflow: 'hidden' }}>
            {photo.owners.map((owner, index) => (
              <Text
                key={`${owner.kind}-${owner.id}`}
                component={Link}
                to={owner.kind === 'case' ? `/cases/${owner.id}` : `/tools/${owner.id}`}
                size="xs"
                fw={600}
                lineClamp={1}
                title={`${owner.name} (${owner.kind === 'case' ? t('skrzynka') : t('narzędzie')})`}
              >
                {owner.name}
                {index < photo.owners.length - 1 || photo.logoForBrand !== null ? ',' : ''}
              </Text>
            ))}

            {photo.logoForBrand ? (
              <Text
                component={Link}
                to="/brands"
                size="xs"
                fw={600}
                lineClamp={1}
                title={`Logo producenta ${photo.logoForBrand.name}`}
              >
                {photo.logoForBrand.name}
                <Text span size="xs" c="dimmed" fw={400}>
                  {' '}
                  (logo)
                </Text>
              </Text>
            ) : null}
          </Group>
        )}

        <Group justify="space-between" gap={4} wrap="nowrap">
          <Badge size="xs" variant="default">
            {t(SOURCE_LABELS[photo.source] ?? photo.source)}
          </Badge>
          {canEdit ? (
            <Group gap={2} wrap="nowrap">
              <Tooltip
                label={
                  photo.source === 'edit'
                    ? t('To zdjęcie już jest wycięte')
                    : t('Wytnij samo narzędzie')
                }
              >
                <ActionIcon
                  variant="subtle"
                  color="grape"
                  aria-label={t('Wytnij samo narzędzie')}
                  disabled={photo.source === 'edit'}
                  onClick={onCutout}
                >
                  <IconWand size={15} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('Usuń zdjęcie')}>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={t('Usuń zdjęcie')}
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
  const attached = pending.filter((photo) => photo.owners.length > 0)
  // Keyed by kind and id: tool 4 and case 4 are different cards that happen to
  // share a number, and listing them as one would hide a deletion. A picture on
  // several cards contributes each of them, because deleting it takes it off
  // all of them at once.
  const cards = [
    ...new Map(
      attached.flatMap((photo) =>
        photo.owners.map((owner) => [`${owner.kind}-${owner.id}`, owner] as const),
      ),
    ).values(),
  ]
  const loose = pending.length - attached.length
  // Logos are not cards, so they are not in `cards` — and deleting one leaves
  // a maker without its logo, which nothing else on this screen would say.
  const logos = pending.filter((photo) => photo.logoForBrand !== null)
  // Cards that will lose their main photo. A picture heading two cards costs
  // both of them, which is exactly what the warning is for.
  const primaries = pending.flatMap((photo) => photo.owners.filter((owner) => owner.isPrimary))

  return (
    <Modal opened={opened} onClose={onCancel} title={t('Usunąć zdjęcia?')} centered>
      <Stack gap="md">
        <Text size="sm">
          {pending.length === 1
            ? t('To zdjęcie zostanie trwale usunięte z dysku.')
            : t('Zaznaczono {n}. Zostaną trwale usunięte z dysku.', {
                n: tCount(COUNTS.photo, pending.length),
              })}
        </Text>

        {cards.length === 0 && logos.length === 0 ? (
          <Text c="dimmed" size="sm">
            {loose === 1
              ? t('To zdjęcie nie jest przypisane do niczego.')
              : t('Żadne z tych zdjęć nie jest do niczego przypisane.')}
          </Text>
        ) : (
          <Alert
            color={primaries.length > 0 ? 'orange' : 'gray'}
            variant="light"
            icon={<IconAlertTriangle size={18} />}
            title={
              cards.length === 1
                ? t('Zdjęcie jest przypisane do karty')
                : t('Zdjęcia są przypisane do {n} kart', { n: cards.length })
            }
          >
            <List size="sm" spacing={2}>
              {cards.map((owner) => (
                <List.Item key={`${owner.kind}-${owner.id}`}>
                  {owner.name}{' '}
                  <Text span size="xs" c="dimmed">
                    ({owner.kind === 'case' ? t('skrzynka') : t('narzędzie')})
                  </Text>
                </List.Item>
              ))}
            </List>

            {primaries.length > 0 ? (
              <Text size="sm" mt="xs">
                {primaries.length === 1
                  ? t(
                      'Jedno z nich to zdjęcie główne — kartę zacznie ilustrować inne zdjęcie, a jeśli innych nie ma, karta zostanie bez zdjęcia.',
                    )
                  : t(
                      '{n} z nich to zdjęcia główne — te karty zaczną pokazywać inne zdjęcia, a te bez zapasu zostaną bez zdjęcia.',
                      {
                        n: primaries.length,
                      },
                    )}
              </Text>
            ) : null}

            {loose > 0 ? (
              <Text size="sm" mt="xs">
                {t('Do tego {n} bez przypisania.', {
                  n: loose === 1 ? t('jedno zdjęcie') : tCount(COUNTS.photo, loose),
                })}
              </Text>
            ) : null}
          </Alert>
        )}

        <Text size="xs" c="dimmed">
          {t('Same narzędzia zostają w katalogu — usuwasz wyłącznie zdjęcia.')}
        </Text>

        {logos.length > 0 ? (
          <Alert
            color="orange"
            variant="light"
            icon={<IconAlertTriangle size={18} />}
            title={
              logos.length === 1
                ? t('Zdjęcie jest logo producenta')
                : t('Zdjęcia są logo {n} producentów', { n: logos.length })
            }
          >
            <List size="sm" spacing={2}>
              {logos.map((photo) => (
                <List.Item key={photo.id}>{photo.logoForBrand!.name}</List.Item>
              ))}
            </List>
            <Text size="sm" mt="xs">
              {logos.length === 1
                ? t('Ten producent zostanie bez logo. Sama pozycja i jej narzędzia zostają.')
                : t('Ci producenci zostaną bez logo. Same pozycje i ich narzędzia zostają.')}
            </Text>
          </Alert>
        ) : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            {t('Anuluj')}
          </Button>
          <Button color="red" loading={working} onClick={onConfirm}>
            {t('Usuń')} {pending.length > 1 ? `(${pending.length})` : ''}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// What to put in the alt text: everything this picture is used for, or nothing
// worth saying.
function ownerLabel(photo: LibraryPhoto): string {
  const names = photo.owners.map((owner) => owner.name)
  if (photo.logoForBrand) names.push(`${photo.logoForBrand.name} (logo)`)

  return names.join(', ')
}

// The star marks a picture that heads at least one card, and the tooltip says
// which — being the main photo is a fact about the pairing now, and a picture
// can head one card while sitting fourth on another.
function isPrimarySomewhere(photo: LibraryPhoto): boolean {
  return photo.owners.some((owner) => owner.isPrimary)
}

function primaryLabel(photo: LibraryPhoto): string {
  const cards = photo.owners.filter((owner) => owner.isPrimary).map((owner) => owner.name)

  return t('Zdjęcie główne: {cards}', { cards: cards.join(', ') })
}
