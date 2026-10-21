import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Image,
  Loader,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconFileTypePdf, IconPrinter, IconRefresh, IconSearch } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import { fetchLabels, labelSheetUrl, refreshAllLabels } from '../../../api/labels'
import type { LabelListItem } from '../../../api/types'
import { COUNTS, t, tCount } from '../../../i18n'
import { useSession } from '../../../session/SessionContext'
import { formatDateTime } from '../../items/presentation'
import {
  allShownCount,
  keepVisibleSelection,
  LABEL_PAGE_SIZE,
  labelListPage,
  labelsBeyondAll,
  readLabelListParams,
  refreshBatches,
  showingAll,
  TEMPLATE_OPTIONS,
  withAllShown,
  withLabelFilter,
  writeLabelListParams,
} from '../labelListParams'

const TEMPLATE_LABELS: Record<string, string> = {
  contents: 'Zawartość',
  number: 'Numer porządkowy',
}

// Every label the organizers have produced, in one place. The per-organizer
// panel answers "what has this arrangement produced"; this screen answers "what
// have we printed", which is the question after a box changed and half a shelf
// of stickers went stale — hence the tick boxes and the batch redraw, which is
// the whole reason it exists.
//
// A label is never edited. It is drawn again from the options it was kept with,
// so the only thing this screen changes is the file underneath a tile.
export function LabelsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { can } = useSession()
  const canEdit = can('catalog.write')

  const query = readLabelListParams(searchParams)
  const [searchText, setSearchText] = useState(query.search ?? '')
  // Ids rather than the labels themselves, so a list that changed underneath
  // cannot leave stale copies in state. What is ticked and what counts as
  // selected are not the same thing — see `selected` below.
  const [ticked, setTicked] = useState<number[]>([])

  const apply = (changes: Parameters<typeof withLabelFilter>[1]) => {
    setSearchParams(writeLabelListParams(withLabelFilter(query, changes)), { replace: true })
  }

  const applySearch = useDebouncedCallback((value: string) => {
    apply({ search: value.trim() || null })
  }, 300)

  const labels = useQuery({
    queryKey: ['labels', query],
    queryFn: () => fetchLabels(query),
    placeholderData: keepPreviousData,
  })

  const redraw = useMutation({
    // The server takes fifty ids at a time, and a page of ticks can be more
    // than that, so the batches go one after another rather than at once: each
    // one draws PDFs, and firing them together would be a queue on the server
    // disguised as parallelism.
    mutationFn: async (labelIds: number[]) => {
      const failed: { error: string; id: number }[] = []
      let refreshed = 0

      for (const batch of refreshBatches(labelIds)) {
        try {
          const result = await refreshAllLabels(batch)
          failed.push(...result.failed)
          refreshed += result.refreshed
        } catch (error) {
          // A batch that never answered must not throw away the ones before
          // it: those labels were drawn again on the server, and a mutation
          // that rejects here would leave their tiles showing the old picture
          // and say nothing about which half succeeded.
          failed.push(...batch.map((id) => ({ error: (error as Error).message, id })))
        }
      }

      return { failed, refreshed }
    },
    onSuccess: async ({ failed, refreshed }) => {
      setTicked([])
      await queryClient.invalidateQueries({ queryKey: ['labels'] })
      // The organizer screens show the same rows, and a redrawn label is a new
      // file behind the same id.
      await queryClient.invalidateQueries({ queryKey: ['organizer'] })
      await queryClient.invalidateQueries({ queryKey: ['organizers'] })

      // A label whose photos have been deleted since cannot be drawn again, and
      // the rest were. Saying which is the difference between a screen somebody
      // trusts and one they check by hand.
      notifications.show(
        failed.length === 0
          ? { color: 'teal', message: t('Narysowano od nowa: {done}', { done: refreshed }) }
          : {
              color: 'orange',
              // One line per reason rather than per label: a batch that timed
              // out fails fifty at once, and fifty copies of one sentence is
              // not a message anybody reads.
              message: t('Narysowano od nowa: {done}. Nie udało się ({count}): {reasons}', {
                count: failed.length,
                done: refreshed,
                reasons: [...new Set(failed.map((entry) => entry.error))].join('; '),
              }),
            },
      )
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const items = labels.data?.items ?? []
  const total = labels.data?.total ?? 0
  const all = showingAll(query)
  const pages = Math.max(Math.ceil(total / LABEL_PAGE_SIZE), 1)
  // Everything past the server's ceiling: shown nowhere on this view, so the
  // screen says so rather than counting to three hundred and drawing two.
  const beyond = all ? labelsBeyondAll(total) : 0
  // The rows on the screen belong to the query that answered, not the one in
  // the address bar: `keepPreviousData` leaves the previous page up while the
  // next is fetched, and a checkbox promising two hundred while twenty-four are
  // displayed would tick twenty-four.
  const settled = !labels.isPending && !labels.isPlaceholderData
  const visibleIds = items.map((item) => item.id)
  // Narrowed to the rows on the screen while rendering rather than cleared by
  // whoever changed the address bar: a tick on a label nobody can see would
  // print on a sheet the screen never showed, and history's back button writes
  // the URL without asking this page first. Widening the view is the case it
  // gets right for free — those rows are still there, so they stay ticked.
  const selected = keepVisibleSelection(ticked, visibleIds)

  const show = (everything: boolean) => {
    setSearchParams(writeLabelListParams(withAllShown(query, everything)))
    window.scrollTo({ top: 0 })
  }
  // Asked of the labels rather than by counting: the selection can still hold
  // the id of one deleted in another tab, and two lists of the same length
  // would then look like the same list.
  const allOnPageSelected = items.length > 0 && items.every((item) => selected.includes(item.id))
  const someOnPageSelected = items.some((item) => selected.includes(item.id))

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={0}>
          <Title order={2}>{t('Etykiety')}</Title>
          <Text c="dimmed" size="sm">
            {t('Wszystkie wygenerowane etykiety, niezależnie od organizera.')}
          </Text>
        </Stack>

        <Group gap="sm">
          {/* Many labels on one sheet, for the afternoon a batch is printed.
              The per-label PDF is right for printing one and wrong for thirty:
              thirty margins is most of a sheet of paper. Readable with the
              catalog, like the labels themselves — printing changes nothing. */}
          <Button
            component="a"
            variant="light"
            href={selected.length > 0 ? labelSheetUrl(selected) : undefined}
            target="_blank"
            rel="noopener"
            leftSection={<IconPrinter size={18} />}
            disabled={selected.length === 0}
          >
            {t('Arkusz do druku')}
            {selected.length > 0 ? ` (${selected.length})` : ''}
          </Button>

          {canEdit ? (
            <Button
              leftSection={<IconRefresh size={18} />}
              disabled={selected.length === 0}
              loading={redraw.isPending}
              onClick={() => redraw.mutate(selected)}
            >
              {t('Generuj ponownie')}
              {selected.length > 0 ? ` (${selected.length})` : ''}
            </Button>
          ) : null}
        </Group>
      </Group>

      <Group align="flex-end" gap="sm">
        <TextInput
          label={t('Szukaj organizera')}
          description={t('Etykieta nie ma własnej nazwy — szukamy po organizerze i skrzynce')}
          placeholder={t('Nazwa organizera, opis, skrzynka…')}
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
          label={t('Wzór')}
          placeholder={t('Dowolny')}
          clearable
          data={TEMPLATE_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
          value={query.template}
          onChange={(value) => apply({ template: value })}
          miw={190}
        />
      </Group>

      {labels.isError ? (
        <Alert color="red" variant="light" title={t('Nie udało się wczytać etykiet')}>
          {(labels.error as Error).message}
        </Alert>
      ) : null}

      {labels.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {labels.data ? (
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              {total === 0
                ? t('Brak etykiet')
                : beyond > 0
                  ? t('{shown} z {total} etykiet — resztę widać po stronach', {
                      shown: allShownCount(total),
                      total,
                    })
                  : tCount(COUNTS.label, total)}
            </Text>
            {/* Two hundred tiles and their previews take seconds to arrive, and
                a screen that looks unchanged is one somebody clicks again. */}
            {labels.isFetching ? <Loader size="xs" /> : null}
          </Group>
          {items.length > 0 ? (
            <Checkbox
              label={
                all && beyond === 0 ? t('Zaznacz wszystkie') : t('Zaznacz wszystkie na tej stronie')
              }
              checked={allOnPageSelected}
              indeterminate={!allOnPageSelected && someOnPageSelected}
              // While the next page is on its way the rows below are the
              // previous one's, and ticking them is not what the box says.
              disabled={!settled}
              onChange={(event) => setTicked(event.currentTarget.checked ? visibleIds : [])}
            />
          ) : null}
        </Group>
      ) : null}

      {labels.data && items.length === 0 ? (
        <Text c="dimmed" size="sm">
          {query.search || query.template
            ? t('Nic nie pasuje do tych filtrów.')
            : t('Nie wygenerowano jeszcze żadnej etykiety. Robi się je na stronie organizera.')}
        </Text>
      ) : null}

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
        {items.map((label) => (
          <LabelTile
            key={label.id}
            canEdit={canEdit}
            checked={selected.includes(label.id)}
            label={label}
            onRedraw={() => redraw.mutate([label.id])}
            onToggle={() =>
              setTicked((current) =>
                current.includes(label.id)
                  ? current.filter((id) => id !== label.id)
                  : [...current, label.id],
              )
            }
            working={redraw.isPending}
          />
        ))}
      </SimpleGrid>

      {/* The pager, and beside it the way out of it. A selection is about what
          is on the screen — it is cleared on every turn of the page — so
          gathering thirty labels for one print sheet means seeing thirty at
          once. */}
      {all || total > LABEL_PAGE_SIZE ? (
        <Group justify="center" mt="sm" gap="sm">
          {all ? null : (
            <Pagination
              total={pages}
              value={labelListPage(query)}
              onChange={(page) => {
                setSearchParams(
                  writeLabelListParams({ ...query, offset: (page - 1) * LABEL_PAGE_SIZE }),
                )
                window.scrollTo({ top: 0 })
              }}
            />
          )}
          {/* The way back is drawn whenever the list is showing everything,
              not only when the count says it is worth paging: a filter that
              narrows to ten rows, or a request that failed and left none,
              would otherwise strand the screen in a view it cannot leave. */}
          <Button variant="subtle" size="sm" onClick={() => show(!all)}>
            {all ? t('Po stronach') : t('Wszystkie ({n})', { n: allShownCount(total) })}
          </Button>
        </Group>
      ) : null}
    </Stack>
  )
}

function LabelTile({
  canEdit,
  checked,
  label,
  onRedraw,
  onToggle,
  working,
}: {
  canEdit: boolean
  checked: boolean
  label: LabelListItem
  onRedraw: () => void
  onToggle: () => void
  working: boolean
}) {
  return (
    <Card
      withBorder
      padding="xs"
      radius="md"
      style={{ borderColor: checked ? 'var(--mantine-color-amber-6)' : undefined }}
    >
      <Stack gap={6}>
        {/* The label is a picture, so the tile shows it. A row made before
            previews existed, or one the rasteriser could not read, keeps the
            icon — both still have to appear. */}
        <div style={{ position: 'relative' }}>
          <Anchor href={apiFileUrl(label.url)} target="_blank" style={{ lineHeight: 0 }}>
            {label.previewUrl ? (
              <Image
                src={apiFileUrl(label.previewUrl)}
                alt={t('Etykieta {width} × {height} mm', {
                  height: label.heightMm,
                  width: label.widthMm,
                })}
                h={110}
                fit="contain"
                // Two hundred tiles on one screen is two hundred preview files:
                // asked for eagerly, that is the whole shelf downloaded to show
                // the first row of it.
                loading="lazy"
              />
            ) : (
              <Group h={110} justify="center">
                <IconFileTypePdf size={24} color="var(--mantine-color-dimmed)" />
              </Group>
            )}
          </Anchor>
          {/* Ticking is not editing: the sheet a selection prints is readable
              with the catalog, so everybody who may look may gather labels. */}
          <Checkbox
            checked={checked}
            onChange={onToggle}
            aria-label={t('Zaznacz etykietę organizera {number}', {
              number: label.organizer.number,
            })}
            style={{ left: 4, position: 'absolute', top: 4 }}
          />
        </div>

        {/* Which arrangement and which box: a label has no name of its own, and
            the box is what somebody holds while looking for its sticker. */}
        <Group gap={4} wrap="nowrap" align="center">
          <Badge variant="filled" color="amber" size="sm">
            {label.organizer.number}
          </Badge>
          <Anchor
            component={Link}
            to={`/organizers/${label.organizer.id}`}
            size="xs"
            fw={600}
            lineClamp={1}
            title={label.organizer.name}
          >
            {label.organizer.name}
          </Anchor>
        </Group>

        <Anchor
          component={Link}
          to={`/items/${label.case.id}`}
          size="xs"
          c="dimmed"
          lineClamp={1}
          title={`${label.case.name} (${label.case.manufacturer})`}
        >
          {label.case.name}
        </Anchor>

        <Group justify="space-between" gap={4} wrap="nowrap" align="flex-start">
          <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
            <Anchor href={apiFileUrl(label.url)} target="_blank" size="xs" fw={600}>
              {t(TEMPLATE_LABELS[label.template] ?? label.template)}
            </Anchor>
            <Text size="xs" c="dimmed">
              {label.widthMm} × {label.heightMm} mm ·{' '}
              {label.options.printReady === false ? t('sama grafika') : t('do druku')}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDateTime(label.createdAt)} · {Math.round(label.byteSize / 1024)} kB
            </Text>
          </Stack>
          {canEdit ? (
            <Tooltip label={t('Generuj tę etykietę ponownie')}>
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                aria-label={t('Generuj ponownie')}
                disabled={working}
                onClick={onRedraw}
              >
                <IconRefresh size={15} />
              </ActionIcon>
            </Tooltip>
          ) : null}
        </Group>
      </Stack>
    </Card>
  )
}
