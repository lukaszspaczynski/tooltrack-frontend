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

import { fetchCases } from '../../../api/cases'
import { useSession } from '../../../session/SessionContext'
import { ImportCaseModal } from '../components/ImportCaseModal'
import { CaseCard } from '../components/CaseCard'
import {
  PAGE_SIZE,
  pageFromOffset,
  readCaseParams,
  SORT_OPTIONS,
  withFilter,
  writeCaseParams,
} from '../listParams'
import { t } from '../../../i18n'
import { caseCountLabel } from '../presentation'

export function CasesListPage() {
  const [importingOpen, importing] = useDisclosure(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const { can } = useSession()

  const query = readCaseParams(searchParams)

  // The text input is the one control that cannot be driven straight from the
  // URL: writing a history entry per keystroke would make the back button
  // useless. It keeps its own value and pushes it after a pause.
  const [searchText, setSearchText] = useState(query.search ?? '')

  const apply = (next: Parameters<typeof withFilter>[1]) => {
    setSearchParams(writeCaseParams(withFilter(query, next)), { replace: true })
  }

  const applySearch = useDebouncedCallback((value: string) => {
    apply({ search: value.trim() || null })
  }, 300)

  const cases = useQuery({
    queryKey: ['cases', query],
    queryFn: () => fetchCases(query),
    // The grid keeps the previous page while the next one loads, instead of
    // collapsing to a spinner every time a filter changes.
    placeholderData: keepPreviousData,
  })

  const total = cases.data?.total ?? 0
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={0}>
          <Title order={2}>{t('Skrzynki')}</Title>
          {cases.data ? (
            <Text c="dimmed" size="sm">
              {caseCountLabel(total)}
            </Text>
          ) : null}
        </Stack>

        {can('catalog.write') ? (
          <Group gap="xs" wrap="nowrap">
            {/* Beside Add, because it is the other way a case starts: measured
                with a tape, or read off the page it was bought from. */}
            <Button
              variant="light"
              leftSection={<IconDownload size={18} />}
              onClick={importing.open}
            >
              {t('Importuj')}
            </Button>
            <Button component={Link} to="/cases/new" leftSection={<IconPlus size={18} />}>
              {t('Dodaj')}
            </Button>
          </Group>
        ) : null}
      </Group>

      <Group align="flex-end" gap="sm" grow preventGrowOverflow={false} wrap="wrap">
        <TextInput
          label={t('Szukaj')}
          placeholder={t('Nazwa, producent, model, EAN, SKU…')}
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
          label={t('Sortowanie')}
          data={SORT_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))}
          allowDeselect={false}
          value={query.sort}
          onChange={(value) => apply({ sort: value ?? 'name' })}
          miw={170}
        />
      </Group>

      {cases.isError ? (
        <Alert color="red" variant="light" title={t('Nie udało się wczytać skrzynek')}>
          {(cases.error as Error).message}
        </Alert>
      ) : null}

      {cases.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {cases.data && cases.data.items.length === 0 ? (
        <Alert color="gray" variant="light">
          {query.search
            ? t('Nic nie pasuje do tego wyszukiwania.')
            : t('Nie ma jeszcze żadnych skrzynek.')}
        </Alert>
      ) : null}

      {cases.data && cases.data.items.length > 0 ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
            {cases.data.items.map((item) => (
              <CaseCard key={item.id} item={item} />
            ))}
          </SimpleGrid>

          {pages > 1 ? (
            <Group justify="center" mt="sm">
              <Pagination
                total={pages}
                value={pageFromOffset(query.offset)}
                onChange={(page) => {
                  setSearchParams(writeCaseParams({ ...query, offset: (page - 1) * PAGE_SIZE }))
                  window.scrollTo({ top: 0 })
                }}
              />
            </Group>
          ) : null}
        </>
      ) : null}

      <ImportCaseModal opened={importingOpen} onClose={importing.close} />
    </Stack>
  )
}
