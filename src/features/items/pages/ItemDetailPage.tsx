import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Group,
  List,
  Loader,
  Modal,
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
  IconCopy,
  IconPencil,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError, hasCode } from '../../../api/client'
import { deleteItem, duplicateItem, fetchItem, updateItem } from '../../../api/items'
import type { Item, ItemDetail, ItemFields } from '../../../api/types'
import { AddressField } from '../../addresses/components/AddressField'
import { ReferenceField } from '../../../components/ReferenceField'
import { COUNTS, t, tCount } from '../../../i18n'
import { fetchExclusivePhotos } from '../../../api/photos'
import { fetchOrganizersOfCase } from '../../../api/organizers'
import { useSession } from '../../../session/SessionContext'
import { AttributePanel } from '../components/AttributePanel'
import { ITEM_ATTRIBUTE_API } from '../itemAttributeApi'
import { RefreshFromPageModal } from '../components/RefreshFromPageModal'
import { LabelSlotPanel } from '../components/LabelSlotPanel'
import { ManualPanel } from '../components/ManualPanel'
import { ItemForm } from '../components/ItemForm'
import { PhotoPanel } from '../../photos/components/PhotoPanel'
import { innerDimensions, outerDimensions } from '../caseSpec'
import { CONDITION_COLORS, CONDITION_LABELS, formatDateTime } from '../presentation'

export function ItemDetailPage() {
  const { id } = useParams()
  const itemId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useSession()

  const [editing, setEditing] = useState(false)
  const [confirmOpen, confirm] = useDisclosure(false)
  const [refreshingOpen, refreshing] = useDisclosure(false)

  const query = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => fetchItem(itemId),
    enabled: Number.isInteger(itemId),
  })

  // What else the delete would take, when the card is a box: the arrangements
  // standing in it cascade away with it. Asked only while the confirmation is
  // open, and only for a case — nothing else has any.
  const organizers = useQuery({
    queryKey: ['organizers', 'of-case', itemId],
    queryFn: () => fetchOrganizersOfCase(itemId),
    enabled: confirmOpen && query.data?.item.kind === 'case',
  })

  // Only while the confirmation is open: it is a question about a delete
  // nobody has agreed to yet.
  const doomedPhotos = useQuery({
    queryKey: ['item-photos-exclusive', itemId],
    queryFn: () => fetchExclusivePhotos({ id: itemId }),
    enabled: confirmOpen,
    staleTime: 0,
  })

  const save = useMutation({
    mutationFn: (fields: ItemFields) => updateItem(itemId, fields),
    onSuccess: async ({ item }) => {
      queryClient.setQueryData(['item', itemId], { item })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['item-categories'] })
      notifications.show({ color: 'teal', message: t('Zapisano zmiany') })
      setEditing(false)
    },
    onError: (error) => {
      // Shown on the serial number field instead. Narrowed by code rather than
      // by status because this page has a second kind of 409 in it: a parameter
      // whose name is already on the card, which belongs nowhere near this
      // field.
      if (hasCode(error, 'SERIAL_NUMBER_TAKEN')) return
      notifications.show({ color: 'red', message: (error as Error).message })
    },
  })

  // Another one of these. The copy opens straight away, because the reason to
  // duplicate is to change something — usually the serial number, which the
  // server deliberately leaves blank.
  const duplicate = useMutation({
    mutationFn: () => duplicateItem(itemId),
    onSuccess: async ({ item: copy }) => {
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      notifications.show({
        color: 'teal',
        message: t('Utworzono kopię „{name}”', { name: copy.name }),
      })
      navigate(`/items/${copy.id}`)
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: () => deleteItem(itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['item-categories'] })
      notifications.show({ color: 'teal', message: t('Karta usunięta') })
      navigate('/', { replace: true })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  if (query.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404

    return (
      <Stack align="flex-start">
        <Alert
          color={notFound ? 'gray' : 'red'}
          variant="light"
          title={notFound ? t('Nie ma takiej karty') : t('Błąd')}
        >
          {(query.error as Error).message}
        </Alert>
        <Button component={Link} to="/" variant="light">
          {t('Wróć do katalogu')}
        </Button>
      </Stack>
    )
  }

  const item = query.data.item
  // Where this card was read from, when it was read from anywhere: what the
  // update starts with, and what tells the manuals panel whether the maker
  // publishes documents. A field on the card since it stopped being a
  // parameter called Referencja, which three screens looked for by name and
  // any edit to the spec sheet could rename out from under them.
  const reference = item.referenceUrl
  const serialConflict = hasCode(save.error, 'SERIAL_NUMBER_TAKEN') ? save.error.message : null

  return (
    <Stack gap="md" maw={720}>
      <Anchor component={Link} to="/" size="sm" c="dimmed">
        <Group gap={2} wrap="nowrap">
          <IconChevronLeft size={14} />
          {t('Katalog')}
        </Group>
      </Anchor>

      <Group justify="space-between" align="flex-start" gap="sm">
        <Stack gap={4}>
          <Title order={2}>{item.name}</Title>
          <Group gap="xs">
            <Badge color={CONDITION_COLORS[item.condition]} variant="light">
              {t(CONDITION_LABELS[item.condition])}
            </Badge>
            {item.category ? <Badge variant="default">{item.category}</Badge> : null}
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
            {/* Reading the page this card came from again. Beside Edit,
                because it is the same errand done by somebody else: the maker
                corrected a spec, added a manual, renamed the model. */}
            <Button
              variant="light"
              color="gray"
              leftSection={<IconRefresh size={18} />}
              onClick={refreshing.open}
            >
              {t('Aktualizuj')}
            </Button>
            <Button
              variant="light"
              color="gray"
              leftSection={<IconCopy size={18} />}
              loading={duplicate.isPending}
              onClick={() => duplicate.mutate()}
            >
              {t('Duplikuj')}
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
          <ItemForm
            initialValues={toFields(item)}
            onCancel={() => {
              save.reset()
              setEditing(false)
            }}
            onSubmit={(fields) => save.mutate(fields)}
            pending={save.isPending}
            serialNumberError={serialConflict}
            submitLabel={t('Zapisz zmiany')}
          />
        ) : (
          <CardDetails item={item} />
        )}
      </Paper>

      {/* Where the labels go, on a box. Only a case has any — the server
          refuses a drill one with ITEM_IS_NOT_A_CASE — so the panel is not
          drawn where it would only ever be empty. */}
      {item.kind === 'case' ? (
        <Paper withBorder p="lg" radius="md">
          <LabelSlotPanel canEdit={can('catalog.write')} itemId={item.id} slots={item.labelSlots} />
        </Paper>
      ) : null}

      {/* What this particular machine is. Outside the editing form for the same
          reason the photos are: one parameter at a time, immediately. */}
      <Paper withBorder p="lg" radius="md">
        <AttributePanel
          api={ITEM_ATTRIBUTE_API}
          attributes={item.attributes}
          canEdit={can('catalog.write')}
          emptyText={t('Nikt nie zapisał jeszcze parametrów tej pozycji.')}
          referenceId={item.id}
        />
      </Paper>

      {/* The documents that belong beside the item. The address the card was
          imported from is one of its parameters, so fetching the maker's PDFs
          is one press rather than a hunt. */}
      <Paper withBorder p="lg" radius="md">
        <ManualPanel canEdit={can('catalog.write')} reference={reference} itemId={item.id} />
      </Paper>

      {/* Outside the editing form on purpose: photos are added and removed one
          at a time, immediately, while the fields are edited and then saved. */}
      <Paper withBorder p="lg" radius="md">
        <PhotoPanel
          canEdit={can('catalog.write')}
          label={item.name}
          kind={item.kind}
          owner={{ id: item.id }}
          reference={reference}
          // Brand and model identify a machine; the name alone would find a
          // category. A box is the other way round — its name usually carries
          // the maker already ("Qbrick System PRO Toolbox 2.0") and its model
          // is the range rather than the box — so it searches for the name.
          // The server falls back to the same two rules.
          searchQuery={searchQueryFor(item)}
        />
      </Paper>

      <RefreshFromPageModal
        opened={refreshingOpen}
        onClose={refreshing.close}
        reference={reference}
        itemId={item.id}
      />

      <Modal opened={confirmOpen} onClose={confirm.close} title={t('Usunąć kartę?')} centered>
        <Stack gap="md">
          <Text size="sm">
            {t('Karta „{name}” zniknie z katalogu. Tej operacji nie da się cofnąć.', {
              name: item.name,
            })}
          </Text>
          {/* Asked while the modal is open: the pictures this card is the only
              home of are deleted with it, and a person cannot weigh that
              without the number. One that another card shows, or that is a
              maker's logo, stays — which is why this is not simply the size of
              the gallery. */}
          {doomedPhotos.data && doomedPhotos.data.photos.length > 0 ? (
            <Text size="sm">
              {t('Zniknie z nią {photos} — te, których nie pokazuje żadna inna karta.', {
                photos: tCount(COUNTS.photo, doomedPhotos.data.photos.length),
              })}
            </Text>
          ) : null}
          {/* And what else goes, when the card is a box. An arrangement is not
              obviously part of the case it stands in, so it has to be said
              before the person agrees rather than noticed afterwards. */}
          {organizers.data && organizers.data.total > 0 ? (
            <Alert
              color="orange"
              variant="light"
              icon={<IconAlertTriangle size={18} />}
              title={
                organizers.data.total === 1
                  ? t('Zniknie też organizer tej skrzynki')
                  : t('Zniknie też {n} organizerów tej skrzynki', { n: organizers.data.total })
              }
            >
              <List size="sm" spacing={2}>
                {organizers.data.items.map((organizer) => (
                  <List.Item key={organizer.id}>
                    {organizer.number}. {organizer.name}
                    {organizer.items.length > 0 ? (
                      <Text span size="xs" c="dimmed">
                        {' '}
                        ({tCount(COUNTS.item, organizer.items.length)})
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

function CardDetails({ item }: { item: ItemDetail }) {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {/* The maker's own colour beside its name, which the catalog has had
            for months and never shown. */}
        <Field label={t('Marka')} value={item.brand?.name ?? ''} swatch={item.brand?.color} />
        <Field label={t('Model')} value={item.model} />
        {/* The one thing a box's spec sheet cannot show for itself: three
            parameters read as one measurement. */}
        {item.kind === 'case' ? (
          <>
            <Field label={t('Wymiary zewnętrzne')} value={outerDimensions(item)} />
            <Field label={t('Wymiary wewnętrzne')} value={innerDimensions(item)} />
          </>
        ) : null}
        {/* A box normally has neither, and two dashes are noise — but a box
            somebody did write one on is a box that has to show it, or the
            field is edited into a card that never displays it. */}
        {item.kind !== 'case' || item.serialNumber ? (
          <Field label={t('Numer seryjny')} value={item.serialNumber} />
        ) : null}
        {item.kind !== 'case' || item.category ? (
          <Field label={t('Kategoria')} value={item.category} />
        ) : null}
      </SimpleGrid>

      <Field label={t('Notatki')} value={item.notes} multiline />

      <AddressField addressId={item.addressId} />

      <ReferenceField url={item.referenceUrl} />

      <Text size="xs" c="dimmed">
        Dodano {formatDateTime(item.createdAt)} · ostatnia zmiana {formatDateTime(item.updatedAt)}
      </Text>
    </Stack>
  )
}

function Field({
  label,
  multiline,
  swatch,
  value,
}: {
  label: string
  multiline?: boolean
  // The maker's colour, when this field is a maker. A dot rather than a
  // coloured name: the colour identifies, it does not decorate, and coloured
  // text on a card is unreadable in half the palette.
  swatch?: string
  value: string
}) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      {/* An empty field says so, rather than leaving a gap that reads as a
          rendering bug. */}
      <Group gap={6} wrap="nowrap" align="center">
        {swatch ? (
          <span
            aria-hidden
            style={{
              backgroundColor: swatch,
              borderRadius: '50%',
              flexShrink: 0,
              height: 12,
              outline: '1px solid rgba(0, 0, 0, 0.18)',
              outlineOffset: -1,
              width: 12,
            }}
          />
        ) : null}
        <Text
          style={multiline ? { whiteSpace: 'pre-wrap' } : undefined}
          c={value ? undefined : 'dimmed'}
        >
          {value || '—'}
        </Text>
      </Group>
    </Stack>
  )
}

function toFields(item: Item): ItemFields {
  return {
    brandId: item.brand?.id ?? null,
    kind: item.kind,
    category: item.category,
    condition: item.condition,
    model: item.model,
    addressId: item.addressId,
    name: item.name,
    notes: item.notes,
    referenceUrl: item.referenceUrl,
    serialNumber: item.serialNumber,
  }
}

// What the suggestions modal searches for before anybody types.
//
// Brand and model identify a machine. A box is the other way round: the names
// usually carry the maker already ("Qbrick System PRO Toolbox 2.0"), and
// searching for "Qbrick PRO" finds a range rather than a box.
function searchQueryFor(item: ItemDetail): string {
  if (item.kind !== 'case') {
    return [item.brand?.name, item.model].filter(Boolean).join(' ') || item.name
  }

  const maker = (item.brand?.name ?? '').trim()
  const name = item.name.trim()
  if (!maker || name.toLowerCase().includes(maker.toLowerCase())) return name

  return `${maker} ${name}`.trim()
}
