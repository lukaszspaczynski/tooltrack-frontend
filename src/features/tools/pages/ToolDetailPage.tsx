import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Group,
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
import { IconChevronLeft, IconCopy, IconPencil, IconRefresh, IconTrash } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError, hasCode } from '../../../api/client'
import { deleteTool, duplicateTool, fetchTool, updateTool } from '../../../api/tools'
import type { Tool, ToolFields } from '../../../api/types'
import { COUNTS, t, tCount } from '../../../i18n'
import { fetchExclusivePhotos } from '../../../api/photos'
import { useSession } from '../../../session/SessionContext'
import { AttributePanel } from '../components/AttributePanel'
import { TOOL_ATTRIBUTE_API } from '../toolAttributeApi'
import { RefreshFromPageModal } from '../components/RefreshFromPageModal'
import { ManualPanel } from '../components/ManualPanel'
import { ToolForm } from '../components/ToolForm'
import { PhotoPanel } from '../../photos/components/PhotoPanel'
import { CONDITION_COLORS, CONDITION_LABELS, formatDateTime } from '../presentation'

export function ToolDetailPage() {
  const { id } = useParams()
  const toolId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { can } = useSession()

  const [editing, setEditing] = useState(false)
  const [confirmOpen, confirm] = useDisclosure(false)
  const [refreshingOpen, refreshing] = useDisclosure(false)

  const query = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => fetchTool(toolId),
    enabled: Number.isInteger(toolId),
  })

  // Only while the confirmation is open: it is a question about a delete
  // nobody has agreed to yet.
  const doomedPhotos = useQuery({
    queryKey: ['tool-photos-exclusive', toolId],
    queryFn: () => fetchExclusivePhotos({ id: toolId, kind: 'tool' }),
    enabled: confirmOpen,
    staleTime: 0,
  })

  const save = useMutation({
    mutationFn: (fields: ToolFields) => updateTool(toolId, fields),
    onSuccess: async ({ tool }) => {
      queryClient.setQueryData(['tool', toolId], { tool })
      await queryClient.invalidateQueries({ queryKey: ['tools'] })
      await queryClient.invalidateQueries({ queryKey: ['tool-categories'] })
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
    mutationFn: () => duplicateTool(toolId),
    onSuccess: async ({ tool: copy }) => {
      await queryClient.invalidateQueries({ queryKey: ['tools'] })
      notifications.show({
        color: 'teal',
        message: t('Utworzono kopię „{name}”', { name: copy.name }),
      })
      navigate(`/tools/${copy.id}`)
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: () => deleteTool(toolId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tools'] })
      await queryClient.invalidateQueries({ queryKey: ['tool-categories'] })
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

  const tool = query.data.tool
  // Where this card was read from, when it was read from anywhere: what the
  // update starts with, and what tells the manuals panel whether the maker
  // publishes documents.
  const reference =
    tool.attributes.find((attribute) => attribute.name === 'Referencja')?.value ?? ''
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
          <Title order={2}>{tool.name}</Title>
          <Group gap="xs">
            <Badge color={CONDITION_COLORS[tool.condition]} variant="light">
              {t(CONDITION_LABELS[tool.condition])}
            </Badge>
            {tool.category ? <Badge variant="default">{tool.category}</Badge> : null}
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
          <ToolForm
            initialValues={toFields(tool)}
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
          <ToolDetails tool={tool} />
        )}
      </Paper>

      {/* What this particular machine is. Outside the editing form for the same
          reason the photos are: one parameter at a time, immediately. */}
      <Paper withBorder p="lg" radius="md">
        <AttributePanel
          api={TOOL_ATTRIBUTE_API}
          attributes={tool.attributes}
          canEdit={can('catalog.write')}
          emptyText={t('Nikt nie zapisał jeszcze parametrów tego narzędzia.')}
          referenceId={tool.id}
        />
      </Paper>

      {/* The documents that belong beside the tool. The address the card was
          imported from is one of its parameters, so fetching the maker's PDFs
          is one press rather than a hunt. */}
      <Paper withBorder p="lg" radius="md">
        <ManualPanel canEdit={can('catalog.write')} reference={reference} toolId={tool.id} />
      </Paper>

      {/* Outside the editing form on purpose: photos are added and removed one
          at a time, immediately, while the fields are edited and then saved. */}
      <Paper withBorder p="lg" radius="md">
        <PhotoPanel
          canEdit={can('catalog.write')}
          label={tool.name}
          owner={{ id: tool.id, kind: 'tool' }}
          reference={reference}
          // Brand and model identify a machine; the name alone would find a
          // category. The server falls back to the same thing.
          searchQuery={[tool.brand, tool.model].filter(Boolean).join(' ') || tool.name}
        />
      </Paper>

      <RefreshFromPageModal
        opened={refreshingOpen}
        onClose={refreshing.close}
        reference={reference}
        toolId={tool.id}
      />

      <Modal opened={confirmOpen} onClose={confirm.close} title={t('Usunąć kartę?')} centered>
        <Stack gap="md">
          <Text size="sm">
            {t('Karta „{name}” zniknie z katalogu. Tej operacji nie da się cofnąć.', {
              name: tool.name,
            })}
          </Text>
          {/* Asked while the modal is open, the way the case screen asks what
              would go with a box: the pictures this card is the only home of
              are deleted with it, and a person cannot weigh that without the
              number. One that another card shows, or that is a maker's logo,
              stays — which is why this is not simply the size of the gallery. */}
          {doomedPhotos.data && doomedPhotos.data.photos.length > 0 ? (
            <Text size="sm">
              {t('Zniknie z nią {photos} — te, których nie pokazuje żadna inna karta.', {
                photos: tCount(COUNTS.photo, doomedPhotos.data.photos.length),
              })}
            </Text>
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

function ToolDetails({ tool }: { tool: Tool }) {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Field label={t('Marka')} value={tool.brand} />
        <Field label={t('Model')} value={tool.model} />
        <Field label={t('Numer seryjny')} value={tool.serialNumber} />
        <Field label={t('Kategoria')} value={tool.category} />
      </SimpleGrid>

      <Field label={t('Notatki')} value={tool.notes} multiline />

      <Text size="xs" c="dimmed">
        Dodano {formatDateTime(tool.createdAt)} · ostatnia zmiana {formatDateTime(tool.updatedAt)}
      </Text>
    </Stack>
  )
}

function Field({ label, multiline, value }: { label: string; multiline?: boolean; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      {/* An empty field says so, rather than leaving a gap that reads as a
          rendering bug. */}
      <Text
        style={multiline ? { whiteSpace: 'pre-wrap' } : undefined}
        c={value ? undefined : 'dimmed'}
      >
        {value || '—'}
      </Text>
    </Stack>
  )
}

function toFields(tool: Tool): ToolFields {
  return {
    brand: tool.brand,
    category: tool.category,
    condition: tool.condition,
    model: tool.model,
    name: tool.name,
    notes: tool.notes,
    serialNumber: tool.serialNumber,
  }
}
