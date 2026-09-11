import {
  Alert,
  Anchor,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  List,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconChevronLeft, IconPencil, IconTrash } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deleteCase, fetchCase, updateCase } from '../../../api/cases'
import { fetchOrganizersOfCase } from '../../../api/organizers'
import type { CaseFields, ToolCase } from '../../../api/types'
import { PhotoPanel } from '../../photos/components/PhotoPanel'
import { useSession } from '../../../session/SessionContext'
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
      notifications.show({ color: 'teal', message: 'Zapisano zmiany' })
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

  const remove = useMutation({
    mutationFn: () => deleteCase(caseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
      await queryClient.invalidateQueries({ queryKey: ['case-systems'] })
      // The photos went with it, so the library is stale too — and so did the
      // organizers that arranged this case.
      await queryClient.invalidateQueries({ queryKey: ['photo-library'] })
      await queryClient.invalidateQueries({ queryKey: ['organizers'] })
      notifications.show({ color: 'teal', message: 'Skrzynka usunięta' })
      navigate('/cases', { replace: true })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  if (!Number.isInteger(caseId)) {
    return (
      <Alert color="red" variant="light">
        Nie ma takiej skrzynki.
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
      <Alert color="red" variant="light" title="Nie udało się wczytać skrzynki">
        {(query.error as Error)?.message ?? 'Nieznany błąd'}
      </Alert>
    )
  }

  const item = query.data.case

  return (
    <Stack gap="md" maw={720}>
      <Anchor component={Link} to="/cases" size="sm" c="dimmed">
        <Group gap={2} wrap="nowrap">
          <IconChevronLeft size={14} />
          Skrzynki
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
              Edytuj
            </Button>
            <Button
              color="red"
              variant="subtle"
              leftSection={<IconTrash size={18} />}
              onClick={confirm.open}
            >
              Usuń
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
            submitLabel="Zapisz zmiany"
          />
        ) : (
          <CaseDetails item={item} />
        )}
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

      <Modal opened={confirmOpen} onClose={confirm.close} title="Usunąć skrzynkę?" centered>
        <Stack gap="md">
          <Text size="sm">
            Skrzynka „{item.name}" zniknie z listy razem ze swoimi zdjęciami. Tej operacji nie da
            się cofnąć.
          </Text>

          {organizers.data && organizers.data.total > 0 ? (
            <Alert
              color="orange"
              variant="light"
              icon={<IconAlertTriangle size={18} />}
              title={
                organizers.data.total === 1
                  ? 'Zniknie też organizer tej skrzynki'
                  : `Zniknie też ${organizers.data.total} organizerów tej skrzynki`
              }
            >
              <List size="sm" spacing={2}>
                {organizers.data.items.map((organizer) => (
                  <List.Item key={organizer.id}>
                    {organizer.number}. {organizer.name}
                    {organizer.tools.length > 0 ? (
                      <Text span size="xs" c="dimmed">
                        {' '}
                        ({organizer.tools.length} narzędzi)
                      </Text>
                    ) : null}
                  </List.Item>
                ))}
              </List>
              <Text size="sm" mt="xs">
                Same narzędzia zostają w katalogu — znika tylko informacja, co w czym leżało.
              </Text>
            </Alert>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={confirm.close}>
              Anuluj
            </Button>
            <Button color="red" loading={remove.isPending} onClick={() => remove.mutate()}>
              Usuń
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
        <Field label="Producent" value={item.manufacturer} />
        <Field label="System" value={item.system} />
        <Field label="Wymiary zewnętrzne" value={outerDimensions(item)} />
        <Field label="Wymiary wewnętrzne" value={innerDimensions(item)} />
        <Field label="Przekątna" value={formatNumber(item.diagonalMm, 'mm')} />
        <Field label="Pojemność" value={formatNumber(item.capacityL, 'L')} />
        <Field label="Ładowność" value={formatNumber(item.loadKg, 'kg')} />
        <Field label="EAN" value={item.ean} />
        <Field label="SKU" value={item.sku} />
      </SimpleGrid>

      {item.notes ? (
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Notatki
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
