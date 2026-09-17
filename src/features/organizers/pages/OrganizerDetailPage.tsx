import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Center,
  Checkbox,
  Collapse,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconChevronLeft,
  IconFileTypePdf,
  IconPencil,
  IconPhotoOff,
  IconPlus,
  IconRefresh,
  IconSparkles,
  IconTag,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import {
  addToolsToOrganizer,
  createLabel,
  deleteLabel,
  deleteOrganizer,
  fetchLabelSlots,
  fetchOrganizer,
  refreshLabels,
  removeToolFromOrganizer,
  updateOrganizer,
  type LabelRequest,
} from '../../../api/organizers'
import type { Organizer } from '../../../api/types'
import { AddressField } from '../../addresses/components/AddressField'
import { t } from '../../../i18n'
import { formatDateTime } from '../../items/presentation'
import { useSession } from '../../../session/SessionContext'
import { defaultLabelRequest, missingLabels } from '../labelDefaults'
import { LabelWizard } from '../components/LabelWizard'
import { OrganizerForm, type OrganizerFormValues } from '../components/OrganizerForm'
import { ItemPicker } from '../components/ItemPicker'

export function OrganizerDetailPage() {
  const { id } = useParams()
  const organizerId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useSession()
  const canEdit = can('catalog.write')

  const [editing, setEditing] = useState(false)
  const [confirmOpen, confirm] = useDisclosure(false)
  const [toolsOpen, toolPicker] = useDisclosure(false)
  const [picked, setPicked] = useState<number[]>([])

  const query = useQuery({
    queryKey: ['organizer', organizerId],
    queryFn: () => fetchOrganizer(organizerId),
    enabled: Number.isInteger(organizerId),
  })

  // Where labels go on this organizer's case. The same key and the same call
  // the wizard makes, so opening it afterwards costs nothing.
  const slots = useQuery({
    queryKey: ['organizer-label-slots', organizerId],
    queryFn: () => fetchLabelSlots(organizerId),
    enabled: Number.isInteger(organizerId),
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['organizer', organizerId] })
    await queryClient.invalidateQueries({ queryKey: ['organizers'] })
    // The pickers offer items that are in no organizer, so their list changed.
    await queryClient.invalidateQueries({ queryKey: ['organizer-item-picker'] })
  }

  const save = useMutation({
    mutationFn: (values: OrganizerFormValues) => updateOrganizer(organizerId, values),
    onSuccess: async () => {
      await refresh()
      notifications.show({ color: 'teal', message: t('Zapisano zmiany') })
      setEditing(false)
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const addTools = useMutation({
    mutationFn: (itemIds: number[]) => addToolsToOrganizer(organizerId, itemIds),
    onSuccess: async () => {
      await refresh()
      setPicked([])
      toolPicker.close()
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const takeOut = useMutation({
    mutationFn: (itemId: number) => removeToolFromOrganizer(organizerId, itemId),
    onSuccess: refresh,
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const [wizardOpen, wizard] = useDisclosure(false)
  // Which labels the refresh button would redraw. Ids rather than the labels
  // themselves, so a list that changed underneath cannot leave stale copies in
  // state.
  const [selectedLabels, setSelectedLabels] = useState<number[]>([])

  const makeLabel = useMutation({
    mutationFn: (request: LabelRequest) => createLabel(organizerId, request),
    onSuccess: async ({ organizer: saved }) => {
      queryClient.setQueryData(['organizer', organizerId], { organizer: saved })
      wizard.close()
      notifications.show({ color: 'teal', message: t('Etykieta wygenerowana') })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const dropLabel = useMutation({
    mutationFn: (labelId: number) => deleteLabel(organizerId, labelId),
    onSuccess: ({ organizer: saved }, labelId) => {
      queryClient.setQueryData(['organizer', organizerId], { organizer: saved })
      setSelectedLabels((ids) => ids.filter((id) => id !== labelId))
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const redrawLabels = useMutation({
    mutationFn: (labelIds: number[]) => refreshLabels(organizerId, labelIds),
    onSuccess: ({ failed, organizer: saved, refreshed }) => {
      queryClient.setQueryData(['organizer', organizerId], { organizer: saved })
      setSelectedLabels([])

      // A label whose photos have been deleted since cannot be drawn again, and
      // the rest were. Saying which is the difference between a screen somebody
      // trusts and one they check by hand.
      notifications.show(
        failed.length === 0
          ? { color: 'teal', message: `Narysowano od nowa: ${refreshed}` }
          : {
              color: 'orange',
              message: t('Narysowano od nowa: {done}. Nie udało się: {reasons}', {
                done: refreshed,
                reasons: failed.map((entry) => entry.error).join('; '),
              }),
            },
      )
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  // One label per empty place, one request each: the server draws a PDF per
  // call, and a place whose picture has gone missing must not cost the others
  // their labels — so a failure is named and the rest are still made.
  const fillGaps = useMutation({
    mutationFn: async (jobs: { request: LabelRequest; size: string }[]) => {
      const failed: string[] = []
      let made = 0

      for (const job of jobs) {
        try {
          await createLabel(organizerId, job.request)
          made += 1
        } catch (error) {
          failed.push(`${job.size}: ${(error as Error).message}`)
        }
      }

      return { failed, made }
    },
    onSuccess: async ({ failed, made }) => {
      await queryClient.invalidateQueries({ queryKey: ['organizer', organizerId] })
      await queryClient.invalidateQueries({ queryKey: ['labels'] })

      notifications.show(
        failed.length === 0
          ? { color: 'teal', message: `Wygenerowano etykiety: ${made}` }
          : {
              color: 'orange',
              message: t('Wygenerowano: {done}. Nie udało się: {reasons}', {
                done: made,
                reasons: failed.join('; '),
              }),
            },
      )
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: () => deleteOrganizer(organizerId),
    onSuccess: async () => {
      await refresh()
      notifications.show({ color: 'teal', message: t('Organizer usunięty') })
      navigate('/organizers', { replace: true })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  if (!Number.isInteger(organizerId)) {
    return (
      <Alert color="red" variant="light">
        {t('Nie ma takiego organizera.')}
      </Alert>
    )
  }

  if (query.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  if (query.isError || !query.data) {
    return (
      <Alert color="red" variant="light" title={t('Nie udało się wczytać organizera')}>
        {(query.error as Error)?.message ?? t('Nieznany błąd')}
      </Alert>
    )
  }

  const organizer = query.data.organizer

  // Asked of the labels rather than by counting: the selection can still hold
  // the id of one deleted in another tab, and two lists of the same length
  // would then look like the same list.
  const allLabelsSelected =
    organizer.labels.length > 0 &&
    organizer.labels.every((label) => selectedLabels.includes(label.id))

  // Every place on the box crossed with every template, minus what has already
  // been drawn.
  const gaps = missingLabels(slots.data?.slots ?? [], organizer.labels)

  return (
    <Stack gap="md" maw={860}>
      <Anchor component={Link} to="/organizers" size="sm" c="dimmed">
        <Group gap={2} wrap="nowrap">
          <IconChevronLeft size={14} />
          {t('Organizer')}
        </Group>
      </Anchor>

      <Group justify="space-between" align="flex-start" gap="sm">
        <Group gap="sm" align="center">
          <Badge variant="filled" color="amber" size="lg">
            {organizer.number}
          </Badge>
          <Title order={2}>{organizer.name}</Title>
        </Group>

        {canEdit && !editing ? (
          <Group gap="xs">
            <Button
              variant="light"
              leftSection={<IconPencil size={18} />}
              onClick={() => setEditing(true)}
            >
              {t('Edytuj')}
            </Button>
            <Button
              color="red"
              variant="subtle"
              leftSection={<IconTrash size={18} />}
              onClick={confirm.open}
            >
              {t('Usuń')}
            </Button>
          </Group>
        ) : null}
      </Group>

      <Paper withBorder p="lg" radius="md">
        {editing ? (
          <OrganizerForm
            caseName={organizer.case.name}
            initialValues={{
              addressId: organizer.addressId,
              caseId: organizer.case.id,
              description: organizer.description,
              name: organizer.name,
              number: organizer.number,
            }}
            onCancel={() => {
              save.reset()
              setEditing(false)
            }}
            onSubmit={(values) => save.mutate(values)}
            pending={save.isPending}
          />
        ) : (
          <OrganizerDetails organizer={organizer} />
        )}
      </Paper>

      {/* Outside the editing form on purpose: items go in and out one at a
          time, immediately, while the fields are edited and then saved. */}
      <Paper withBorder p="lg" radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={600}>
              {t('Narzędzia')} ({organizer.items.length})
            </Text>
            {canEdit ? (
              <Button
                size="sm"
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={toolPicker.toggle}
              >
                {toolsOpen ? t('Zwiń') : t('Dodaj narzędzia')}
              </Button>
            ) : null}
          </Group>

          {organizer.items.length === 0 ? (
            <Text c="dimmed" size="sm">
              {t('Nic tu jeszcze nie leży.')}
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {organizer.items.map((item) => (
                <Card key={item.id} withBorder padding="xs" radius="md">
                  <Stack gap={6}>
                    <Link to={`/items/${item.id}`} style={{ lineHeight: 0 }}>
                      {item.primaryPhotoUrl ? (
                        <Image
                          src={apiFileUrl(item.primaryPhotoUrl)}
                          alt={item.name}
                          h={84}
                          fit="contain"
                        />
                      ) : (
                        <Group h={84} justify="center">
                          <IconPhotoOff size={20} color="var(--mantine-color-dimmed)" />
                        </Group>
                      )}
                    </Link>

                    <Group justify="space-between" gap={4} wrap="nowrap" align="flex-start">
                      <Text size="xs" fw={500} lineClamp={2} title={item.name}>
                        {item.name}
                      </Text>
                      {canEdit ? (
                        <Tooltip label={t('Wyjmij z organizera')}>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            aria-label={`Wyjmij ${item.name}`}
                            loading={takeOut.isPending && takeOut.variables === item.id}
                            onClick={() => takeOut.mutate(item.id)}
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}

          {canEdit ? (
            <Collapse expanded={toolsOpen}>
              <Stack gap="sm">
                {/* Only the id matters here: this page adds items to an
                    arrangement that already has a name. */}
                <ItemPicker
                  selected={picked}
                  onToggle={(item) =>
                    setPicked((current) =>
                      current.includes(item.id)
                        ? current.filter((entry) => entry !== item.id)
                        : [...current, item.id],
                    )
                  }
                />
                <Group justify="flex-end">
                  <Button
                    disabled={picked.length === 0}
                    loading={addTools.isPending}
                    onClick={() => addTools.mutate(picked)}
                  >
                    Dodaj {picked.length > 0 ? `(${picked.length})` : ''}
                  </Button>
                </Group>
              </Stack>
            </Collapse>
          ) : null}
        </Stack>
      </Paper>

      {/* The labels this arrangement has produced. A label is a file rather
          than a document: it is looked at, printed and thrown away. It is
          never edited — but it can be drawn again, from the options it was
          kept with, when the box it describes has changed. */}
      <Paper withBorder p="lg" radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconTag size={18} />
              <Text fw={600}>Etykiety ({organizer.labels.length})</Text>
              {/* The same rows on the screen that holds every organizer's,
                  already filtered to this one — that is where a shelf is
                  drawn again, and this panel is where somebody is standing
                  when they decide to. */}
              <Anchor
                component={Link}
                to={`/organizers/labels?organizerId=${organizer.id}`}
                size="xs"
                c="dimmed"
              >
                {t('Wszystkie etykiety')}
              </Anchor>
            </Group>
            {canEdit ? (
              <Group gap="xs">
                {organizer.labels.length > 0 ? (
                  <Checkbox
                    size="xs"
                    label={t('Zaznacz wszystkie')}
                    checked={allLabelsSelected}
                    indeterminate={selectedLabels.length > 0 && !allLabelsSelected}
                    onChange={() =>
                      setSelectedLabels(
                        allLabelsSelected ? [] : organizer.labels.map((label) => label.id),
                      )
                    }
                  />
                ) : null}
                <Button
                  size="sm"
                  variant="subtle"
                  leftSection={<IconRefresh size={16} />}
                  disabled={selectedLabels.length === 0}
                  loading={redrawLabels.isPending}
                  onClick={() => redrawLabels.mutate(selectedLabels)}
                >
                  {t('Odśwież zaznaczone')}
                  {selectedLabels.length > 0 ? ` (${selectedLabels.length})` : ''}
                </Button>
                {/* Every label this box could carry and does not — each place
                    crossed with each template — drawn from the defaults in one
                    press. A box is labelled once, when it is filled, and
                    walking the wizard four times to say nothing unusual is
                    four times nothing. */}
                <Button
                  size="sm"
                  variant="subtle"
                  leftSection={<IconSparkles size={16} />}
                  disabled={gaps.length === 0}
                  loading={fillGaps.isPending}
                  onClick={() =>
                    fillGaps.mutate(
                      gaps.map(({ slot, template }) => ({
                        request: defaultLabelRequest(organizer.items, slot, template),
                        size: `${slot.widthMm} × ${slot.heightMm} mm (${
                          template === 'number' ? 'numer' : t('zawartość')
                        })`,
                      })),
                    )
                  }
                >
                  {t('Uzupełnij brakujące')}
                  {gaps.length > 0 ? ` (${gaps.length})` : ''}
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                  onClick={wizard.open}
                >
                  {t('Nowa etykieta')}
                </Button>
              </Group>
            ) : null}
          </Group>

          {organizer.labels.length === 0 ? (
            <Text c="dimmed" size="sm">
              {t('Nie ma jeszcze żadnej etykiety.')}
            </Text>
          ) : (
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {organizer.labels.map((label) => (
                <Card key={label.id} withBorder padding="xs" radius="md">
                  <Stack gap={6}>
                    {/* The label is a picture, so the tile shows it. A row
                        that made before previews existed, or one the
                        rasteriser could not read, keeps the icon. */}
                    <Anchor href={apiFileUrl(label.url)} target="_blank" style={{ lineHeight: 0 }}>
                      {label.previewUrl ? (
                        <Image
                          src={apiFileUrl(label.previewUrl)}
                          alt={`Etykieta ${label.widthMm} × ${label.heightMm} mm`}
                          h={110}
                          fit="contain"
                        />
                      ) : (
                        <Group h={110} justify="center">
                          <IconFileTypePdf size={24} color="var(--mantine-color-dimmed)" />
                        </Group>
                      )}
                    </Anchor>

                    <Group justify="space-between" gap={4} wrap="nowrap" align="flex-start">
                      {canEdit ? (
                        <Checkbox
                          size="xs"
                          mt={2}
                          aria-label={t('Zaznacz etykietę {width} × {height} mm', {
                            height: label.heightMm,
                            width: label.widthMm,
                          })}
                          checked={selectedLabels.includes(label.id)}
                          onChange={(event) => {
                            // Read now, not inside the updater: React clears
                            // currentTarget once the handler returns, and the
                            // updater runs after that.
                            const { checked } = event.currentTarget
                            setSelectedLabels((ids) => {
                              const rest = ids.filter((id) => id !== label.id)
                              return checked ? [...rest, label.id] : rest
                            })
                          }}
                        />
                      ) : null}
                      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Anchor href={apiFileUrl(label.url)} target="_blank" size="xs" fw={600}>
                          {label.template === 'number' ? t('Numer porządkowy') : t('Zawartość')}
                        </Anchor>
                        <Text size="xs" c="dimmed">
                          {label.widthMm} × {label.heightMm} mm ·{' '}
                          {label.options.printReady === false ? 'sama grafika' : 'do druku'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDateTime(label.createdAt)} · {Math.round(label.byteSize / 1024)} kB
                        </Text>
                      </Stack>
                      {canEdit ? (
                        <Tooltip label={t('Usuń etykietę')}>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            aria-label={t('Usuń etykietę')}
                            loading={dropLabel.isPending && dropLabel.variables === label.id}
                            onClick={() => dropLabel.mutate(label.id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      ) : null}
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Paper>

      {canEdit && wizardOpen ? (
        <LabelWizard
          opened
          organizer={organizer}
          onClose={wizard.close}
          onCreate={(request) => makeLabel.mutate(request)}
          saving={makeLabel.isPending}
        />
      ) : null}

      <Modal opened={confirmOpen} onClose={confirm.close} title={t('Usunąć organizer?')} centered>
        <Stack gap="md">
          <Text size="sm">
            {t(
              'Układ „{name}” zniknie. Narzędzia i skrzynka zostają — przestaną tylko być ze sobą powiązane.',
              {
                name: organizer.name,
              },
            )}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={confirm.close}>
              {t('Anuluj')}
            </Button>
            <Button color="red" loading={remove.isPending} onClick={() => remove.mutate()}>
              {t('Usuń')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

function OrganizerDetails({ organizer }: { organizer: Organizer }) {
  return (
    <Stack gap="lg">
      <Group gap="lg" align="flex-start" wrap="nowrap">
        <Link to={`/items/${organizer.case.id}`} style={{ lineHeight: 0 }}>
          {organizer.case.primaryPhotoUrl ? (
            <Image
              src={apiFileUrl(organizer.case.primaryPhotoUrl)}
              alt={organizer.case.name}
              h={96}
              w={96}
              fit="contain"
              radius="sm"
            />
          ) : (
            <Group h={96} w={96} justify="center" bg="var(--mantine-color-default)">
              <IconPhotoOff size={20} color="var(--mantine-color-dimmed)" />
            </Group>
          )}
        </Link>

        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {t('Skrzynka')}
          </Text>
          <Anchor component={Link} to={`/items/${organizer.case.id}`} size="sm">
            {organizer.case.name}
          </Anchor>
          <Text size="sm" c="dimmed">
            {organizer.case.manufacturer}
          </Text>
        </Stack>
      </Group>

      <AddressField addressId={organizer.addressId} />

      {organizer.description ? (
        <Stack gap={2}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {t('Opis')}
          </Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {organizer.description}
          </Text>
        </Stack>
      ) : null}

      <Text size="xs" c="dimmed">
        Zmieniono {formatDateTime(organizer.updatedAt)}
      </Text>
    </Stack>
  )
}
