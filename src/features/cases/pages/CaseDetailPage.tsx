import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  List,
  Modal,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconPencil,
  IconPlus,
  IconTag,
  IconTrash,
  IconX,
  IconRefresh,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  addLabelSlot,
  deleteCase,
  fetchCase,
  removeLabelSlot,
  updateCase,
} from '../../../api/cases'
import { fetchOrganizersOfCase } from '../../../api/organizers'
import { fetchExclusivePhotos } from '../../../api/photos'
import type { CaseFields, ToolCase } from '../../../api/types'
import { COUNTS, t, tCount } from '../../../i18n'
import { AttributePanel } from '../../tools/components/AttributePanel'
import { PhotoPanel } from '../../photos/components/PhotoPanel'
import { CASE_ATTRIBUTE_API } from '../caseAttributeApi'
import { useSession } from '../../../session/SessionContext'
import { RefreshCaseModal } from '../components/RefreshCaseModal'
import { CaseForm } from '../components/CaseForm'
import { formatDateTime } from '../../tools/presentation'
import { formatNumber, innerDimensions, outerDimensions } from '../presentation'

export function CaseDetailPage() {
  const { id } = useParams()
  const caseId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useSession()

  const [editing, setEditing] = useState(false)
  const [confirmOpen, confirm] = useDisclosure(false)
  const [refreshingOpen, refreshing] = useDisclosure(false)

  const query = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => fetchCase(caseId),
    enabled: Number.isInteger(caseId),
  })

  const save = useMutation({
    mutationFn: (fields: CaseFields) => updateCase(caseId, fields),
    onSuccess: async ({ case: saved }) => {
      queryClient.setQueryData(['case', caseId], { case: saved })
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
      await queryClient.invalidateQueries({ queryKey: ['case-systems'] })
      notifications.show({ color: 'teal', message: t('Zapisano zmiany') })
      setEditing(false)
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  // What else the delete would take. Asked for only while the confirmation is
  // open: an arrangement is not obviously part of the box, so the person has
  // to be told before they agree, not after.
  const organizers = useQuery({
    queryKey: ['organizers', 'of-case', caseId],
    queryFn: () => fetchOrganizersOfCase(caseId),
    enabled: confirmOpen && Number.isInteger(caseId),
  })

  // And the other thing that goes with it. The pictures this box is the only
  // home of are deleted with it; one that a tool card shows, or that a maker
  // uses as its logo, stays. Same question the tool card asks.
  const doomedPhotos = useQuery({
    queryKey: ['case-photos-exclusive', caseId],
    queryFn: () => fetchExclusivePhotos({ id: caseId, kind: 'case' }),
    enabled: confirmOpen && Number.isInteger(caseId),
    staleTime: 0,
  })

  // Label slots go in and out one at a time, immediately, unlike the fields
  // above: a slot is a row of its own and the server has no draft to hold it.
  const [slotWidth, setSlotWidth] = useState<number | string>('')
  const [slotHeight, setSlotHeight] = useState<number | string>('')

  const addSlot = useMutation({
    mutationFn: (slot: { heightMm: number; widthMm: number }) => addLabelSlot(caseId, slot),
    onSuccess: async ({ case: saved }) => {
      queryClient.setQueryData(['case', caseId], { case: saved })
      setSlotWidth('')
      setSlotHeight('')
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const dropSlot = useMutation({
    mutationFn: (slotId: number) => removeLabelSlot(caseId, slotId),
    onSuccess: ({ case: saved }) => queryClient.setQueryData(['case', caseId], { case: saved }),
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: () => deleteCase(caseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
      await queryClient.invalidateQueries({ queryKey: ['case-systems'] })
      // The photos went with it, so the library is stale too — and so did the
      // organizers that arranged this case.
      await queryClient.invalidateQueries({ queryKey: ['photo-library'] })
      await queryClient.invalidateQueries({ queryKey: ['organizers'] })
      notifications.show({ color: 'teal', message: t('Skrzynka usunięta') })
      navigate('/cases', { replace: true })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  if (!Number.isInteger(caseId)) {
    return (
      <Alert color="red" variant="light">
        {t('Nie ma takiej skrzynki.')}
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
      <Alert color="red" variant="light" title={t('Nie udało się wczytać skrzynki')}>
        {(query.error as Error)?.message ?? t('Nieznany błąd')}
      </Alert>
    )
  }

  const item = query.data.case
  // Where this case was read from, when it was read from anywhere: the same
  // Referencja parameter a tool card carries, which is what the seeder writes.
  //
  // The note is read as well, for the cases imported before the address moved
  // out of it. Both importers write the parameter now, so this is a fallback
  // with an end date rather than a second opinion — but a case that has not
  // been read again since still has a page worth reading, and no button to do
  // it with if this is dropped.
  const reference =
    item.attributes.find((attribute) => attribute.name === 'Referencja')?.value ??
    /https?:\/\/\S+/.exec(item.notes)?.[0] ??
    ''

  return (
    <Stack gap="md" maw={720}>
      <Anchor component={Link} to="/cases" size="sm" c="dimmed">
        <Group gap={2} wrap="nowrap">
          <IconChevronLeft size={14} />
          {t('Skrzynki')}
        </Group>
      </Anchor>

      <Group justify="space-between" align="flex-start" gap="sm">
        <Stack gap={4}>
          <Title order={2}>{item.name}</Title>
          <Group gap="xs">
            <Badge variant="default">{item.manufacturer}</Badge>
            {item.system ? (
              <Badge variant="light" color="amber">
                {item.system}
              </Badge>
            ) : null}
          </Group>
        </Stack>

        {can('catalog.write') && !editing ? (
          <Group gap="xs">
            <Button
              variant="light"
              leftSection={<IconPencil size={18} />}
              onClick={() => setEditing(true)}
            >
              {t('Edytuj')}
            </Button>
            {/* Only where there is a page to read again. A case somebody
                measured with a tape has no address to offer. */}
            {reference ? (
              <Button
                variant="light"
                leftSection={<IconRefresh size={18} />}
                onClick={refreshing.open}
              >
                {t('Aktualizuj ze strony')}
              </Button>
            ) : null}
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
          <CaseForm
            initialValues={toFields(item)}
            onCancel={() => {
              save.reset()
              setEditing(false)
            }}
            onSubmit={(fields) => save.mutate(fields)}
            pending={save.isPending}
            submitLabel={t('Zapisz zmiany')}
          />
        ) : (
          <CaseDetails item={item} />
        )}
      </Paper>

      {/* Where labels go on this box. A size and nothing else — what gets
          printed on one is a different question, and not one this screen
          answers. */}
      <Paper withBorder p="lg" radius="md">
        <Stack gap="md">
          <Group gap="xs">
            <IconTag size={18} />
            <Text fw={600}>Miejsca na etykiety ({item.labelSlots.length})</Text>
          </Group>

          {item.labelSlots.length === 0 ? (
            <Text c="dimmed" size="sm">
              {t('Nie ma jeszcze żadnego miejsca.')}
            </Text>
          ) : (
            <Group gap="xs">
              {item.labelSlots.map((slot) => (
                <Badge
                  key={slot.id}
                  variant="default"
                  size="lg"
                  rightSection={
                    can('catalog.write') ? (
                      <ActionIcon
                        size="xs"
                        variant="transparent"
                        color="gray"
                        aria-label={t('Usuń miejsce {width} na {height}', {
                          height: slot.heightMm,
                          width: slot.widthMm,
                        })}
                        loading={dropSlot.isPending && dropSlot.variables === slot.id}
                        onClick={() => dropSlot.mutate(slot.id)}
                      >
                        <IconX size={12} />
                      </ActionIcon>
                    ) : null
                  }
                >
                  {slot.widthMm} × {slot.heightMm} mm
                </Badge>
              ))}
            </Group>
          )}

          {can('catalog.write') ? (
            <Group align="flex-end" gap="sm">
              <NumberInput
                label={t('Szerokość')}
                suffix=" mm"
                min={1}
                allowDecimal={false}
                value={slotWidth}
                onChange={setSlotWidth}
                w={130}
              />
              <NumberInput
                label={t('Wysokość')}
                suffix=" mm"
                min={1}
                allowDecimal={false}
                value={slotHeight}
                onChange={setSlotHeight}
                w={130}
              />
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                loading={addSlot.isPending}
                disabled={typeof slotWidth !== 'number' || typeof slotHeight !== 'number'}
                onClick={() =>
                  typeof slotWidth === 'number' &&
                  typeof slotHeight === 'number' &&
                  addSlot.mutate({ heightMm: slotHeight, widthMm: slotWidth })
                }
              >
                {t('Dodaj miejsce')}
              </Button>
            </Group>
          ) : null}
        </Stack>
      </Paper>

      {/* Outside the editing form for the same reason the photos are: one
          parameter at a time, immediately. The columns above hold what every box
          has; this holds what they do not. */}
      <Paper withBorder p="lg" radius="md">
        <AttributePanel
          api={CASE_ATTRIBUTE_API}
          attributes={item.attributes}
          canEdit={can('catalog.write')}
          emptyText={t('Nikt nie zapisał jeszcze parametrów tej skrzynki.')}
          referenceId={item.id}
        />
      </Paper>

      {/* Outside the editing form on purpose: photos are added and removed one
          at a time, immediately, while the fields are edited and then saved. */}
      <Paper withBorder p="lg" radius="md">
        <PhotoPanel
          canEdit={can('catalog.write')}
          label={item.name}
          owner={{ id: item.id, kind: 'case' }}
          // The maker and the name identify a case; there is no model number.
          // The server falls back to the same thing.
          searchQuery={searchQueryFor(item)}
        />
      </Paper>

      <RefreshCaseModal
        caseId={item.id}
        opened={refreshingOpen}
        onClose={refreshing.close}
        reference={reference}
      />

      <Modal opened={confirmOpen} onClose={confirm.close} title={t('Usunąć skrzynkę?')} centered>
        <Stack gap="md">
          <Text size="sm">
            {t('Skrzynka „{name}” zniknie z listy. Tej operacji nie da się cofnąć.', {
              name: item.name,
            })}
          </Text>

          {/* "Razem ze swoimi zdjęciami" used to be the whole of it, and it was
              not true of all of them: what goes is what nothing else holds. */}
          {doomedPhotos.data && doomedPhotos.data.photos.length > 0 ? (
            <Text size="sm">
              {t('Zniknie z nią {photos} — te, których nie pokazuje żadna inna karta.', {
                photos: tCount(COUNTS.photo, doomedPhotos.data.photos.length),
              })}
            </Text>
          ) : null}

          {organizers.data && organizers.data.total > 0 ? (
            <Alert
              color="orange"
              variant="light"
              icon={<IconAlertTriangle size={18} />}
              title={
                organizers.data.total === 1
                  ? t('Zniknie też organizer tej skrzynki')
                  : t('Zniknie też {n} organizerów tej skrzynki', {
                      n: organizers.data.total,
                    })
              }
            >
              <List size="sm" spacing={2}>
                {organizers.data.items.map((organizer) => (
                  <List.Item key={organizer.id}>
                    {organizer.number}. {organizer.name}
                    {organizer.tools.length > 0 ? (
                      <Text span size="xs" c="dimmed">
                        {' '}
                        ({tCount(COUNTS.tool, organizer.tools.length)})
                      </Text>
                    ) : null}
                  </List.Item>
                ))}
              </List>
              <Text size="sm" mt="xs">
                {t('Same narzędzia zostają w katalogu — znika tylko informacja, co w czym leżało.')}
              </Text>
            </Alert>
          ) : null}
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

function CaseDetails({ item }: { item: ToolCase }) {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Field label={t('Producent')} value={item.manufacturer} />
        <Field label="System" value={item.system} />
        <Field label={t('Wymiary zewnętrzne')} value={outerDimensions(item)} />
        <Field label={t('Wymiary wewnętrzne')} value={innerDimensions(item)} />
        <Field label={t('Przekątna')} value={formatNumber(item.diagonalMm, 'mm')} />
        <Field label={t('Pojemność')} value={formatNumber(item.capacityL, 'L')} />
        <Field label={t('Ładowność')} value={formatNumber(item.loadKg, 'kg')} />
        <Field label="EAN" value={item.ean} />
        <Field label="SKU" value={item.sku} />
      </SimpleGrid>

      {item.notes ? (
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {t('Notatki')}
          </Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {item.notes}
          </Text>
        </Stack>
      ) : null}

      <Text size="xs" c="dimmed">
        Zmieniono {formatDateTime(item.updatedAt)}
      </Text>
    </Stack>
  )
}

// An empty field is shown as a dash rather than hidden: on a detail page, "we
// do not know the capacity" is information, unlike on a card in a grid.
function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="sm">{value || '—'}</Text>
    </Stack>
  )
}

// The names usually carry the maker already ("Qbrick System PRO Toolbox 2.0"),
// and searching for "Qbrick Qbrick System PRO…" finds less than the name alone.
function searchQueryFor(item: ToolCase): string {
  const name = item.name.trim()
  const manufacturer = item.manufacturer.trim()

  if (!manufacturer) return name
  if (name.toLowerCase().includes(manufacturer.toLowerCase())) return name

  return `${manufacturer} ${name}`
}

function toFields(item: ToolCase): CaseFields {
  return {
    capacityL: item.capacityL,
    diagonalMm: item.diagonalMm,
    ean: item.ean,
    innerHeightMm: item.innerHeightMm,
    innerLengthMm: item.innerLengthMm,
    innerWidthMm: item.innerWidthMm,
    loadKg: item.loadKg,
    manufacturer: item.manufacturer,
    name: item.name,
    notes: item.notes,
    outerHeightMm: item.outerHeightMm,
    outerLengthMm: item.outerLengthMm,
    outerWidthMm: item.outerWidthMm,
    sku: item.sku,
    system: item.system,
  }
}
