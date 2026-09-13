import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Checkbox,
  Group,
  Loader,
  Modal,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconCheck,
  IconFileTypePdf,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import { deleteManuals, fetchManualLibrary, retitleManual } from '../../../api/manuals'
import type { LibraryManual } from '../../../api/types'
import { COUNTS, t, tCount, tDate } from '../../../i18n'
import { useSession } from '../../../session/SessionContext'
import { AddManualModal } from '../components/AddManualModal'
import {
  MANUAL_PAGE_SIZE,
  manualListPage,
  readManualListParams,
  withManualFilter,
  writeManualListParams,
} from '../manualListParams'

// Every document the catalog holds, whichever tool keeps it.
//
// The same relation to a card's panel as the photo library has to a gallery:
// the panel answers "what does this tool come with", this answers "what
// documents do we have" — which is the question somebody asks when a manual is
// missing from a card that ought to have it, or when the same PDF has been
// uploaded three times under three names.
//
// A manual is never edited here beyond its title: the file is the artefact.
export function ManualLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { can } = useSession()
  const canEdit = can('catalog.write')

  const query = readManualListParams(searchParams)
  const [searchText, setSearchText] = useState(query.search ?? '')
  const [editing, setEditing] = useState<null | number>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [confirmOpen, confirm] = useDisclosure(false)
  const [addingOpen, adding] = useDisclosure(false)

  const apply = (changes: Parameters<typeof withManualFilter>[1]) => {
    setSearchParams(writeManualListParams(withManualFilter(query, changes)), { replace: true })
  }

  const applySearch = useDebouncedCallback((value: string) => {
    apply({ search: value.trim() || null })
  }, 300)

  const manuals = useQuery({
    queryKey: ['manual-library', query],
    queryFn: () => fetchManualLibrary(query),
    placeholderData: keepPreviousData,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['manual-library'] })
    // The cards showing these documents hold their own copy of the list.
    await queryClient.invalidateQueries({ queryKey: ['tool-manuals'] })
  }

  const failed = (error: unknown) =>
    notifications.show({ color: 'red', message: (error as Error).message })

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => retitleManual(id, title),
    onSuccess: async () => {
      setEditing(null)
      await refresh()
    },
    onError: failed,
  })

  const remove = useMutation({
    mutationFn: (ids: number[]) => deleteManuals(ids),
    onSuccess: async ({ deleted, tools }) => {
      confirm.close()
      setSelected([])
      await refresh()
      notifications.show({
        color: 'teal',
        message: tools.length
          ? t('Usunięto {manuals} z {n} kart', {
              manuals: tCount(COUNTS.manual, deleted),
              n: tools.length,
            })
          : t('Usunięto {manuals}', { manuals: tCount(COUNTS.manual, deleted) }),
      })
    },
    onError: failed,
  })

  const items = manuals.data?.items ?? []
  const total = manuals.data?.total ?? 0
  const pages = Math.max(Math.ceil(total / MANUAL_PAGE_SIZE), 1)
  // A selection is about what is on the screen: a tick on a row nobody can see
  // would delete a file the person never looked at.
  const visible = items.map((manual) => manual.id)
  const ticked = selected.filter((id) => visible.includes(id))
  const pending = items.filter((manual) => ticked.includes(manual.id))

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <Title order={2}>{t('Instrukcje')}</Title>
          <Text c="dimmed" size="sm">
            {t('Wszystkie pliki w systemie, niezależnie od narzędzia.')}
          </Text>
        </Stack>

        {canEdit ? (
          <Group gap="xs" wrap="nowrap">
            {ticked.length > 0 ? (
              <Button
                color="red"
                variant="light"
                leftSection={<IconTrash size={18} />}
                onClick={confirm.open}
              >
                {t('Usuń zaznaczone')} ({ticked.length})
              </Button>
            ) : null}
            {/* Adding from here as well as from a card: somebody who has just
                been handed a folder of PDFs is on this screen, not on twelve
                cards in turn. Which tool it belongs to is asked for, because a
                document with no tool is one nobody will look for. */}
            <Button leftSection={<IconPlus size={18} />} onClick={adding.open}>
              {t('Dodaj')}
            </Button>
          </Group>
        ) : null}
      </Group>

      <TextInput
        label={t('Szukaj')}
        description={t('Po nazwie pliku albo po narzędziu, do którego należy')}
        placeholder={t('Nazwa instrukcji, narzędzie, model…')}
        leftSection={<IconSearch size={16} />}
        value={searchText}
        onChange={(event) => {
          setSearchText(event.currentTarget.value)
          applySearch(event.currentTarget.value)
        }}
      />

      {manuals.isError ? (
        <Alert color="red" variant="light" title={t('Nie udało się wczytać instrukcji')}>
          {(manuals.error as Error).message}
        </Alert>
      ) : null}

      {manuals.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {manuals.data ? (
        <Text size="sm" c="dimmed">
          {total === 0 ? t('Brak instrukcji') : tCount(COUNTS.manual, total)}
        </Text>
      ) : null}

      {manuals.data && items.length === 0 ? (
        <Text c="dimmed" size="sm">
          {query.search
            ? t('Nic nie pasuje do tego wyszukiwania.')
            : t('Nie dodano jeszcze żadnej instrukcji. Robi się to na karcie narzędzia.')}
        </Text>
      ) : null}

      {items.length > 0 ? (
        <Paper withBorder radius="md" p="sm">
          <Table verticalSpacing="xs" horizontalSpacing="sm">
            <Table.Tbody>
              {items.map((manual) => (
                <Table.Tr key={manual.id}>
                  {canEdit ? (
                    <Table.Td w={36}>
                      <Checkbox
                        checked={ticked.includes(manual.id)}
                        aria-label={t('Zaznacz instrukcję {title}', { title: manual.title })}
                        // Toggled from what is held rather than from the
                        // event: React clears `currentTarget` once the handler
                        // returns, and a state updater runs after that — which
                        // is why reading it there ticked nothing at all.
                        onChange={() =>
                          setSelected((current) =>
                            current.includes(manual.id)
                              ? current.filter((id) => id !== manual.id)
                              : [...current, manual.id],
                          )
                        }
                      />
                    </Table.Td>
                  ) : null}

                  <Table.Td>
                    {editing === manual.id ? (
                      <TitleEdit
                        manual={manual}
                        onCancel={() => setEditing(null)}
                        onSave={(title) => rename.mutate({ id: manual.id, title })}
                        pending={rename.isPending}
                      />
                    ) : (
                      <Group gap="xs" wrap="nowrap">
                        <IconFileTypePdf size={18} color="var(--mantine-color-red-7)" />
                        <Anchor
                          href={apiFileUrl(manual.url)}
                          target="_blank"
                          rel="noopener"
                          size="sm"
                          lineClamp={1}
                          title={manual.title}
                        >
                          {manual.title}
                        </Anchor>
                      </Group>
                    )}
                  </Table.Td>

                  {/* Which cards keep it. A document belongs to a model rather
                      than to a machine, so this is often more than one. */}
                  <Table.Td>
                    <Group gap={4} wrap="wrap">
                      {manual.tools.map((tool) => (
                        <Anchor key={tool.id} component={Link} to={`/tools/${tool.id}`} size="xs">
                          {/* The model beside the name: three cards called
                              "Sekator akumulatorowy" are told apart by it. */}
                          <Badge variant="light" color="gray" size="sm">
                            {tool.model ? `${tool.name} · ${tool.model}` : tool.name}
                          </Badge>
                        </Anchor>
                      ))}
                      {manual.tools.length === 0 ? (
                        <Badge variant="light" color="orange" size="sm">
                          {t('Bez narzędzia')}
                        </Badge>
                      ) : null}
                    </Group>
                  </Table.Td>

                  <Table.Td w={150}>
                    <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                      {megabytes(manual.byteSize)} · {tDate(manual.createdAt)}
                    </Text>
                  </Table.Td>

                  {canEdit ? (
                    <Table.Td w={44}>
                      <Tooltip label={t('Zmień nazwę')}>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label={t('Zmień nazwę instrukcji {title}', { title: manual.title })}
                          onClick={() => setEditing(manual.id)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  ) : null}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : null}

      {total > MANUAL_PAGE_SIZE ? (
        <Group justify="center" mt="sm">
          <Pagination
            total={pages}
            value={manualListPage(query)}
            onChange={(page) => {
              setSearchParams(
                writeManualListParams({ ...query, offset: (page - 1) * MANUAL_PAGE_SIZE }),
              )
              window.scrollTo({ top: 0 })
            }}
          />
        </Group>
      ) : null}

      <AddManualModal opened={addingOpen} onClose={adding.close} />

      {/* Deleting here is not the bin on a card: the file leaves the catalog,
          and every card that kept it loses it. The cards are named, because
          that is the part somebody has to agree to. */}
      <Modal opened={confirmOpen} onClose={confirm.close} title={t('Usunąć instrukcje?')} centered>
        <Stack gap="md">
          <Text size="sm">
            {t('{manuals} zniknie z katalogu i z dysku. Tej operacji nie da się cofnąć.', {
              manuals: tCount(COUNTS.manual, pending.length),
            })}
          </Text>
          {pending.some((manual) => manual.tools.length > 0) ? (
            <Alert color="orange" variant="light" title={t('Zniknie też z kart narzędzi')}>
              <Text size="sm">
                {[
                  ...new Set(pending.flatMap((manual) => manual.tools.map((tool) => tool.name))),
                ].join(', ')}
              </Text>
            </Alert>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={confirm.close}>
              {t('Anuluj')}
            </Button>
            <Button color="red" loading={remove.isPending} onClick={() => remove.mutate(ticked)}>
              {t('Usuń')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

function TitleEdit({
  manual,
  onCancel,
  onSave,
  pending,
}: {
  manual: LibraryManual
  onCancel: () => void
  onSave: (title: string) => void
  pending: boolean
}) {
  const [title, setTitle] = useState(manual.title)
  const ready = title.trim().length > 0

  return (
    <Group gap="xs" wrap="nowrap">
      <TextInput
        size="xs"
        value={title}
        aria-label={t('Nazwa instrukcji')}
        onChange={(event) => setTitle(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && ready) onSave(title.trim())
          if (event.key === 'Escape') onCancel()
        }}
        style={{ flexGrow: 1 }}
      />
      <ActionIcon
        variant="subtle"
        color="teal"
        aria-label={t('Zapisz')}
        disabled={!ready}
        loading={pending}
        onClick={() => onSave(title.trim())}
      >
        <IconCheck size={16} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="gray" aria-label={t('Anuluj')} onClick={onCancel}>
        <IconX size={16} />
      </ActionIcon>
    </Group>
  )
}

function megabytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(Math.round(bytes / 1024), 1)} kB`
}
