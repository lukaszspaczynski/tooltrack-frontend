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
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { IconDownload, IconPlus, IconSearch } from '@tabler/icons-react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { fetchCategories, fetchItems } from '../../../api/items'
import { useSession } from '../../../session/SessionContext'
import { ImportItemModal } from '../components/ImportItemModal'
import { ItemCard } from '../components/ItemCard'
import {
  offsetFromPage,
  PAGE_SIZE,
  pageFromOffset,
  readItemParams,
  SORT_OPTIONS,
  withFilter,
  writeItemParams,
} from '../listParams'
import type { ItemKind } from '../../../api/types'
import { t } from '../../../i18n'
import { conditionOptions, itemCountLabel } from '../presentation'

export function ItemsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = useSession()
  const [importingOpen, importing] = useDisclosure(false)

  const query = readItemParams(searchParams)

  // The text input is the one control that cannot be driven straight from the
  // URL: writing a history entry per keystroke would make the back button
  // useless. It keeps its own value and pushes it after a pause.
  const [searchText, setSearchText] = useState(query.search ?? '')

  const apply = (next: Parameters<typeof withFilter>[1]) => {
    setSearchParams(writeItemParams(withFilter(query, next)), { replace: true })
  }

  const applySearch = useDebouncedCallback((value: string) => {
    apply({ search: value.trim() || null })
  }, 300)

  const items = useQuery({
    queryKey: ['items', query],
    queryFn: () => fetchItems(query),
    // The grid keeps the previous page while the next one loads, instead of
    // collapsing to a spinner every time a filter changes.
    placeholderData: keepPreviousData,
  })

  const categories = useQuery({
    queryKey: ['item-categories'],
    queryFn: fetchCategories,
    staleTime: 60_000,
  })

  const total = items.data?.total ?? 0
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Stack gap={0}>
          <Title order={2}>{t('Katalog')}</Title>
          {items.data ? (
            <Text c="dimmed" size="sm">
              {itemCountLabel(total)}
            </Text>
          ) : null}
        </Stack>

        {can('catalog.write') ? (
          <Group gap="xs" wrap="nowrap">
            {/* Beside Add, because it is the other way a card starts: typed
                from the plate, or read off the page it was bought from. */}
            <Button
              variant="light"
              leftSection={<IconDownload size={18} />}
              onClick={importing.open}
            >
              {t('Importuj')}
            </Button>
            <Button component={Link} to="/items/new" leftSection={<IconPlus size={18} />}>
              {t('Dodaj')}
            </Button>
          </Group>
        ) : null}
      </Group>

      <Group align="flex-end" gap="sm" grow preventGrowOverflow={false} wrap="wrap">
        <TextInput
          label={t('Szukaj')}
          placeholder={t('Nazwa, marka, model, numer seryjny…')}
          leftSection={<IconSearch size={16} />}
          value={searchText}
          onChange={(event) => {
            setSearchText(event.currentTarget.value)
            applySearch(event.currentTarget.value)
          }}
          miw={220}
          style={{ flexGrow: 2 }}
        />
        {/* Which sort of thing, which is not the category: the category is
            somebody's own word for a shelf and there are dozens, this is the
            three the catalog itself behaves differently about. */}
        <Select
          label={t('Rodzaj')}
          placeholder={t('Wszystkie')}
          clearable
          data={[
            { label: t('Narzędzie'), value: 'tool' },
            { label: t('RTV/AGD'), value: 'appliance' },
            // A box is a card too, since the fold, and this is the only way to
            // see the boxes: there is no screen of their own any more.
            { label: t('Skrzynka'), value: 'case' },
          ]}
          value={query.kind ?? null}
          onChange={(value) => apply({ kind: (value as ItemKind) ?? null })}
          miw={150}
        />
        <Select
          label={t('Kategoria')}
          placeholder={t('Wszystkie')}
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
          label={t('Stan')}
          placeholder={t('Dowolny')}
          clearable
          data={conditionOptions()}
          value={query.condition}
          onChange={(value) => apply({ condition: value })}
          miw={150}
        />
        <Select
          label={t('Sortowanie')}
          data={SORT_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
          allowDeselect={false}
          value={query.sort}
          onChange={(value) => apply({ sort: value ?? 'updatedAt' })}
          miw={170}
        />
      </Group>

      {items.isError ? (
        <Alert color="red" variant="light" title={t('Nie udało się wczytać katalogu')}>
          {(items.error as Error).message}
        </Alert>
      ) : null}

      {items.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {items.data && items.data.items.length === 0 ? (
        <EmptyState filtered={Boolean(query.search || query.category || query.condition)} />
      ) : null}

      {items.data && items.data.items.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {items.data.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </SimpleGrid>

          {pages > 1 ? (
            <Group justify="center" mt="sm">
              <Pagination
                total={pages}
                value={pageFromOffset(query.offset)}
                onChange={(page) => {
                  setSearchParams(writeItemParams({ ...query, offset: offsetFromPage(page) }))
                  window.scrollTo({ top: 0 })
                }}
              />
            </Group>
          ) : null}
        </>
      ) : null}
      <ImportItemModal opened={importingOpen} onClose={importing.close} />
    </Stack>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  const { can } = useSession()

  return (
    <Stack align="center" gap="xs" py="xl">
      <Text fw={600}>{filtered ? t('Nic nie pasuje do filtrów') : t('Katalog jest pusty')}</Text>
      <Text c="dimmed" size="sm" ta="center">
        {filtered
          ? t('Zmień wyszukiwanie albo wyczyść filtry.')
          : can('catalog.write')
            ? t('Dodaj pierwsze narzędzie, żeby zacząć ewidencję.')
            : t('Nikt jeszcze nie dodał żadnego narzędzia.')}
      </Text>
      {!filtered && can('catalog.write') ? (
        <Button component={Link} to="/items/new" leftSection={<IconPlus size={18} />} mt="sm">
          {t('Dodaj narzędzie')}
        </Button>
      ) : null}
    </Stack>
  )
}
