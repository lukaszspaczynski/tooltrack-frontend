import {
  Alert,
  Card,
  Checkbox,
  Group,
  Image,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconPhotoOff, IconSearch } from '@tabler/icons-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { apiFileUrl } from '../../../api/client'
import { fetchTools } from '../../../api/tools'
import type { ToolListItem } from '../../../api/types'

// Picking tools for an organizer. Only those in no organizer are offered: a
// tool lies in exactly one place, and the server refuses a second with a 409
// rather than moving it, so offering one would be offering to fail.
//
// Tiles rather than a list of labels — on a shelf of near-identical black
// packs the picture tells them apart faster than the model number does.
export function ToolPicker({
  onToggle,
  selected,
}: {
  onToggle: (id: number) => void
  selected: number[]
}) {
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const applySearch = useDebouncedCallback((value: string) => setSearch(value.trim() || null), 300)

  const tools = useQuery({
    queryKey: ['organizer-tool-picker', search],
    queryFn: () =>
      fetchTools({
        category: null,
        condition: null,
        direction: 'asc',
        inOrganizer: false,
        limit: 100,
        offset: 0,
        search,
        sort: 'name',
      }),
    placeholderData: keepPreviousData,
  })

  const items = tools.data?.items ?? []

  return (
    <Stack gap="sm">
      <TextInput
        label="Szukaj narzędzia"
        placeholder="Nazwa, marka, model…"
        leftSection={<IconSearch size={16} />}
        value={searchText}
        onChange={(event) => {
          setSearchText(event.currentTarget.value)
          applySearch(event.currentTarget.value)
        }}
      />

      {tools.data && items.length === 0 ? (
        <Alert color="gray" variant="light">
          {search
            ? 'Nic nie pasuje — albo te narzędzia są już w innych organizerach.'
            : 'Wszystkie narzędzia są już w organizerach.'}
        </Alert>
      ) : null}

      <ScrollArea.Autosize mah={340}>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
          {items.map((tool) => (
            <ToolTile
              key={tool.id}
              checked={selected.includes(tool.id)}
              onToggle={() => onToggle(tool.id)}
              tool={tool}
            />
          ))}
        </SimpleGrid>
      </ScrollArea.Autosize>
    </Stack>
  )
}

// The whole card is the target, and the checkbox sits on the picture so the
// tick is visible at a glance across a grid rather than hidden in a column.
function ToolTile({
  checked,
  onToggle,
  tool,
}: {
  checked: boolean
  onToggle: () => void
  tool: ToolListItem
}) {
  const subtitle = [tool.brand, tool.model].filter(Boolean).join(' ')

  return (
    <Card
      withBorder
      padding="xs"
      radius="md"
      onClick={onToggle}
      style={{
        borderColor: checked ? 'var(--mantine-color-amber-6)' : undefined,
        cursor: 'pointer',
      }}
    >
      <Stack gap={6}>
        <div style={{ position: 'relative' }}>
          {tool.primaryPhotoUrl ? (
            <Image src={apiFileUrl(tool.primaryPhotoUrl)} alt={tool.name} h={84} fit="contain" />
          ) : (
            <Group h={84} justify="center">
              <IconPhotoOff size={20} color="var(--mantine-color-dimmed)" />
            </Group>
          )}
          <Checkbox
            checked={checked}
            onChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Wybierz ${tool.name}`}
            style={{ left: 4, position: 'absolute', top: 4 }}
          />
        </div>

        <Text size="xs" fw={500} lineClamp={2} title={tool.name}>
          {tool.name}
        </Text>
        {subtitle ? (
          <Text size="xs" c="dimmed" lineClamp={1} title={subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}
