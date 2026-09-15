import {
  ActionIcon,
  Autocomplete,
  Button,
  Group,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import type { AttributeNameCount, ToolAttribute } from '../../../api/types'
import { t } from '../../../i18n'

// What this particular machine is: mains voltage, speed, chuck, weight.
//
// Outside the editing form for the same reason the photos are: a parameter is
// added and removed one at a time and immediately, while the fields of the
// card are edited and then saved. Every call answers with the whole item, so
// the screen replaces what it holds rather than merging a row into it.
// What one kind of thing has to supply to get this panel: the four calls and
// the two cache keys. An item and a case keep identical spec sheets — both
// halves free text, one name each, edited a row at a time — so the form, the
// suggestions and the refusals are written once and the wiring is passed in.
export type AttributeApi<T> = {
  add: (referenceId: number, attribute: { name: string; value: string }) => Promise<T>
  // Where the answer goes, and what it invalidates. The answer is the whole
  // thing rather than the row, so the screen never shows a sheet assembled from
  // two different moments.
  cache: (queryClient: QueryClient, referenceId: number, answer: T) => Promise<void>
  names: () => Promise<{ names: AttributeNameCount[] }>
  namesKey: string
  remove: (referenceId: number, attributeId: number) => Promise<T>
  update: (
    referenceId: number,
    attributeId: number,
    patch: { name?: string; value?: string },
  ) => Promise<T>
}

export function AttributePanel<T>({
  api,
  attributes,
  canEdit,
  emptyText,
  referenceId,
}: {
  api: AttributeApi<T>
  attributes: ToolAttribute[]
  canEdit: boolean
  // What a sheet with nothing on it says. An item points at the rating plate; a
  // case has no plate to point at.
  emptyText: string
  referenceId: number
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<null | number>(null)

  // The vocabulary other cards already use, so the catalog ends up with one
  // spelling of "napięcie sieciowe" rather than four. Only worth asking for
  // when there is a form to offer it in.
  const names = useQuery({
    queryKey: [api.namesKey],
    queryFn: api.names,
    enabled: canEdit,
  })

  const replace = (answer: T) => api.cache(queryClient, referenceId, answer)

  const failed = (error: unknown) =>
    notifications.show({ color: 'red', message: (error as Error).message })

  const add = useMutation({
    mutationFn: (attribute: { name: string; value: string }) => api.add(referenceId, attribute),
    onSuccess: async (answer) => {
      await replace(answer)
      notifications.show({ color: 'teal', message: t('Parametr dodany') })
    },
    onError: failed,
  })

  const edit = useMutation({
    mutationFn: ({ id, ...patch }: { id: number; name: string; value: string }) =>
      api.update(referenceId, id, patch),
    onSuccess: async (answer) => {
      await replace(answer)
      setEditing(null)
    },
    onError: failed,
  })

  const drop = useMutation({
    mutationFn: (id: number) => api.remove(referenceId, id),
    onSuccess: replace,
    onError: failed,
  })

  const working = add.isPending || edit.isPending || drop.isPending

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text fw={600}>
          {t('Parametry')} {attributes.length > 0 ? `(${attributes.length})` : ''}
        </Text>
      </Group>

      {attributes.length === 0 ? (
        <Text c="dimmed" size="sm">
          {canEdit ? t('Nic tu jeszcze nie zapisano.') : emptyText}
        </Text>
      ) : (
        <Table verticalSpacing="xs" horizontalSpacing={0} withRowBorders={false}>
          <Table.Tbody>
            {attributes.map((attribute) =>
              editing === attribute.id ? (
                <AttributeEdit
                  key={attribute.id}
                  attribute={attribute}
                  onCancel={() => setEditing(null)}
                  onSave={(name, value) => edit.mutate({ id: attribute.id, name, value })}
                  pending={edit.isPending}
                />
              ) : (
                <Table.Tr key={attribute.id}>
                  <Table.Td w="45%">
                    <Text size="sm" c="dimmed">
                      {attribute.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {attribute.value}
                    </Text>
                  </Table.Td>
                  {canEdit ? (
                    <Table.Td w={80}>
                      <Group gap={2} justify="flex-end" wrap="nowrap">
                        <Tooltip label={t('Edytuj parametr')}>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            aria-label={t('Edytuj parametr {name}', { name: attribute.name })}
                            disabled={working}
                            onClick={() => setEditing(attribute.id)}
                          >
                            <IconPencil size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('Usuń parametr')}>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            aria-label={t('Usuń parametr {name}', { name: attribute.name })}
                            loading={drop.isPending && drop.variables === attribute.id}
                            disabled={working}
                            onClick={() => drop.mutate(attribute.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  ) : null}
                </Table.Tr>
              ),
            )}
          </Table.Tbody>
        </Table>
      )}

      {canEdit ? (
        <AttributeForm
          knownNames={(names.data?.names ?? []).map((entry) => entry.name)}
          onAdd={(name, value) => add.mutate({ name, value })}
          pending={add.isPending}
        />
      ) : null}
    </Stack>
  )
}

// The row being edited, in place. Both halves at once: correcting a typo in
// the name and reading the value off the plate again are the same errand.
function AttributeEdit({
  attribute,
  onCancel,
  onSave,
  pending,
}: {
  attribute: ToolAttribute
  onCancel: () => void
  onSave: (name: string, value: string) => void
  pending: boolean
}) {
  const [name, setName] = useState(attribute.name)
  const [value, setValue] = useState(attribute.value)
  const ready = name.trim().length > 0 && value.trim().length > 0

  return (
    <Table.Tr>
      <Table.Td w="45%">
        <TextInput
          size="xs"
          value={name}
          aria-label={t('Nazwa parametru')}
          onChange={(event) => setName(event.currentTarget.value)}
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          size="xs"
          value={value}
          aria-label={t('Wartość')}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && ready) onSave(name, value)
            if (event.key === 'Escape') onCancel()
          }}
        />
      </Table.Td>
      <Table.Td w={80}>
        <Group gap={2} justify="flex-end" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="teal"
            aria-label={t('Zapisz')}
            disabled={!ready}
            loading={pending}
            onClick={() => onSave(name, value)}
          >
            <IconCheck size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" aria-label={t('Anuluj')} onClick={onCancel}>
            <IconX size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}

// Adding one. The name offers what other cards already call the same thing;
// the value is typed with its unit, because "230" on its own is a number
// nobody can read.
function AttributeForm({
  knownNames,
  onAdd,
  pending,
}: {
  knownNames: string[]
  onAdd: (name: string, value: string) => void
  pending: boolean
}) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const ready = name.trim().length > 0 && value.trim().length > 0

  const submit = () => {
    if (!ready) return
    onAdd(name.trim(), value.trim())
    setName('')
    setValue('')
  }

  return (
    <Group gap="sm" align="flex-end" wrap="wrap">
      <Autocomplete
        label={t('Nazwa parametru')}
        placeholder={t('np. Napięcie sieciowe')}
        data={knownNames}
        value={name}
        onChange={setName}
        style={{ flexGrow: 1 }}
        miw={180}
      />
      <TextInput
        label={t('Wartość')}
        description={t('Razem z jednostką')}
        placeholder={t('np. 230 V')}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit()
        }}
        style={{ flexGrow: 1 }}
        miw={160}
      />
      <Button
        leftSection={<IconPlus size={18} />}
        disabled={!ready}
        loading={pending}
        onClick={submit}
      >
        {t('Dodaj')}
      </Button>
    </Group>
  )
}
