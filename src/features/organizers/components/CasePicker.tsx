import {
  Card,
  Group,
  Image,
  Loader,
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
import { fetchCases } from '../../../api/cases'
import type { CaseListItem } from '../../../api/types'
import { t } from '../../../i18n'
import { capacity, outerDimensions } from '../../cases/presentation'

const PAGE_SIZE = 24

// Choosing a case, with the two facts that decide it: how much goes in, and
// whether it fits where it has to stand.
//
// Shared by the wizard and the edit screen, so a change of layout cannot leave
// the two disagreeing about what a case looks like.
export function CasePicker({
  onSelect,
  selectedId,
}: {
  onSelect: (item: CaseListItem) => void
  selectedId: null | number
}) {
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const applySearch = useDebouncedCallback((value: string) => setSearch(value.trim() || null), 300)

  const cases = useQuery({
    queryKey: ['organizer-case-picker', search],
    queryFn: () =>
      fetchCases({ limit: PAGE_SIZE, manufacturer: null, offset: 0, search, sort: 'name' }),
    placeholderData: keepPreviousData,
  })

  return (
    <Stack gap="sm">
      <TextInput
        label={t('Szukaj skrzynki')}
        placeholder={t('Nazwa, producent…')}
        leftSection={<IconSearch size={16} />}
        value={searchText}
        onChange={(event) => {
          setSearchText(event.currentTarget.value)
          applySearch(event.currentTarget.value)
        }}
      />

      {cases.isPending ? <Loader size="sm" /> : null}

      <ScrollArea.Autosize mah={340}>
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
          {(cases.data?.items ?? []).map((item) => (
            <Card
              key={item.id}
              withBorder
              padding="xs"
              radius="md"
              onClick={() => onSelect(item)}
              style={{
                borderColor: selectedId === item.id ? 'var(--mantine-color-amber-6)' : undefined,
                cursor: 'pointer',
              }}
            >
              <Stack gap={6}>
                {item.primaryPhotoUrl ? (
                  <Image
                    src={apiFileUrl(item.primaryPhotoUrl)}
                    alt={item.name}
                    h={80}
                    fit="contain"
                  />
                ) : (
                  <Group h={80} justify="center">
                    <IconPhotoOff size={20} color="var(--mantine-color-dimmed)" />
                  </Group>
                )}
                <Text size="xs" lineClamp={2}>
                  {item.name}
                </Text>
                <Group gap={4} wrap="nowrap" justify="space-between">
                  <Text size="xs" c="dimmed">
                    {capacity(item) || '— L'}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1} title={outerDimensions(item)}>
                    {outerDimensions(item) || t('bez wymiarów')}
                  </Text>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </ScrollArea.Autosize>
    </Stack>
  )
}
