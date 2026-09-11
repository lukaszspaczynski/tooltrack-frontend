import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { fetchCategories, fetchTools } from '../../../api/tools'
import { useSession } from '../../../session/SessionContext'
import { ToolCard } from '../components/ToolCard'
import {
  offsetFromPage,
  PAGE_SIZE,
  pageFromOffset,
  readToolParams,
  SORT_OPTIONS,
  withFilter,
  writeToolParams,
} from '../listParams'
import { conditionOptions, toolCountLabel } from '../presentation'

export function ToolsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = useSession()

  const query = readToolParams(searchParams)

  // The text input is the one control that cannot be driven straight from the
  // URL: writing a history entry per keystroke would make the back button
  // useless. It keeps its own value and pushes it after a pause.
  const [searchText, setSearchText] = useState(query.search ?? '')

  const apply = (next: Parameters<typeof withFilter>[1]) => {
    setSearchParams(writeToolParams(withFilter(query, next)), { replace: true })
  }

  const applySearch = useDebouncedCallback((value: string) => {
    apply({ search: value.trim() || null })
  }, 300)

  const tools = useQuery({
    queryKey: ['tools', query],
    queryFn: () => fetchTools(query),
    // The grid keeps the previous page while the next one loads, instead of
    // collapsing to a spinner every time a filter changes.
    placeholderData: keepPreviousData,
  })

  const categories = useQuery({
    queryKey: ['tool-categories'],
    queryFn: fetchCategories,
    staleTime: 60_000,
  })

  const total = tools.data?.total ?? 0
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Title order={2}>Narzędzia</Title>
          {tools.data ? (
            <Text c="dimmed" size="sm">
              {toolCountLabel(total)}
            </Text>
          ) : null}
        </Stack>

        {can('catalog.write') ? (
          <Button component={Link} to="/tools/new" leftSection={<IconPlus size={18} />}>
            Dodaj
          </Button>
        ) : null}
      </Group>

      <Group align="flex-end" gap="sm" grow preventGrowOverflow={false} wrap="wrap">
        <TextInput
          label="Szukaj"
          placeholder="Nazwa, marka, model, numer seryjny…"
          leftSection={<IconSearch size={16} />}
          value={searchText}
          onChange={(event) => {
            setSearchText(event.currentTarget.value)
            applySearch(event.currentTarget.value)
          }}
          miw={220}
          style={{ flexGrow: 2 }}
        />
        <Select
          label="Kategoria"
          placeholder="Wszystkie"
          clearable
          data={categories.data?.categories.map((entry) => ({
            label: `${entry.category} (${entry.count})`,
            value: entry.category,
          }))}
          value={query.category}
          onChange={(value) => apply({ category: value })}
          miw={160}
        />
        <Select
          label="Stan"
          placeholder="Dowolny"
          clearable
          data={conditionOptions()}
          value={query.condition}
          onChange={(value) => apply({ condition: value })}
          miw={150}
        />
        <Select
          label="Sortowanie"
          data={SORT_OPTIONS.map((option) => ({ ...option }))}
          allowDeselect={false}
          value={query.sort}
          onChange={(value) => apply({ sort: value ?? 'updatedAt' })}
          miw={170}
        />
      </Group>

      {tools.isError ? (
        <Alert color="red" variant="light" title="Nie udało się wczytać katalogu">
          {(tools.error as Error).message}
        </Alert>
      ) : null}

      {tools.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {tools.data && tools.data.items.length === 0 ? (
        <EmptyState filtered={Boolean(query.search || query.category || query.condition)} />
      ) : null}

      {tools.data && tools.data.items.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {tools.data.items.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </SimpleGrid>

          {pages > 1 ? (
            <Group justify="center" mt="sm">
              <Pagination
                total={pages}
                value={pageFromOffset(query.offset)}
                onChange={(page) => {
                  setSearchParams(writeToolParams({ ...query, offset: offsetFromPage(page) }))
                  window.scrollTo({ top: 0 })
                }}
              />
            </Group>
          ) : null}
        </>
      ) : null}
    </Stack>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  const { can } = useSession()

  return (
    <Stack align="center" gap="xs" py="xl">
      <Text fw={600}>{filtered ? 'Nic nie pasuje do filtrów' : 'Katalog jest pusty'}</Text>
      <Text c="dimmed" size="sm" ta="center">
        {filtered
          ? 'Zmień wyszukiwanie albo wyczyść filtry.'
          : can('catalog.write')
            ? 'Dodaj pierwsze narzędzie, żeby zacząć ewidencję.'
            : 'Nikt jeszcze nie dodał żadnego narzędzia.'}
      </Text>
      {!filtered && can('catalog.write') ? (
        <Button component={Link} to="/tools/new" leftSection={<IconPlus size={18} />} mt="sm">
          Dodaj narzędzie
        </Button>
      ) : null}
    </Stack>
  )
}
