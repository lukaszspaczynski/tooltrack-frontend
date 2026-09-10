import {
  Alert,
  Button,
  Card,
  Center,
  Checkbox,
  Group,
  Image,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchPhotoSuggestions } from '../../../api/photos'
import type { PhotoSuggestion, Tool } from '../../../api/types'

// The web search, on demand. It opens empty and searches when asked: the
// request costs the server a call to a search provider, so it must never be a
// side effect of opening a tool.
//
// Multi-select, because the useful outcome is "these three are the right
// machine" — the tick boxes are the point of the screen, not a refinement.
export function PhotoSuggestionsModal({
  onClose,
  onSave,
  opened,
  saving,
  tool,
}: {
  onClose: () => void
  onSave: (items: { attribution: string; url: string }[]) => void
  opened: boolean
  saving: boolean
  tool: Tool
}) {
  const [query, setQuery] = useState(defaultQuery(tool))
  const [selected, setSelected] = useState<string[]>([])

  const search = useMutation({
    mutationFn: (value: string) => fetchPhotoSuggestions(tool.id, value),
    onSuccess: () => setSelected([]),
  })

  const suggestions = search.data?.suggestions ?? []

  const toggle = (url: string) => {
    setSelected((current) =>
      current.includes(url) ? current.filter((entry) => entry !== url) : [...current, url],
    )
  }

  const save = () => {
    const chosen = suggestions.filter((suggestion) => selected.includes(suggestion.url))
    onSave(chosen.map((s) => ({ attribution: s.attribution, url: s.url })))
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Znajdź zdjęcia w internecie" size="xl" centered>
      <Stack gap="md">
        <Group align="flex-end" gap="sm">
          <TextInput
            label="Czego szukamy"
            description="Domyślnie marka i model — to one identyfikują maszynę"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && search.mutate(query)}
            style={{ flexGrow: 1 }}
            leftSection={<IconSearch size={16} />}
          />
          <Button onClick={() => search.mutate(query)} loading={search.isPending}>
            Szukaj
          </Button>
        </Group>

        {search.isError ? (
          <Alert color="orange" variant="light" title="Wyszukiwanie niedostępne">
            {(search.error as Error).message}
          </Alert>
        ) : null}

        {search.isPending ? (
          <Center py="xl">
            <Loader />
          </Center>
        ) : null}

        {search.isSuccess && suggestions.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="md">
            Nic nie znaleziono. Spróbuj innego zapytania — na przykład samej marki.
          </Text>
        ) : null}

        {suggestions.length > 0 ? (
          <>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {suggestions.map((suggestion) => (
                <SuggestionTile
                  key={suggestion.url}
                  checked={selected.includes(suggestion.url)}
                  onToggle={() => toggle(suggestion.url)}
                  suggestion={suggestion}
                />
              ))}
            </SimpleGrid>

            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {search.data?.provider === 'openverse'
                  ? 'Wyniki z Openverse (zdjęcia na wolnych licencjach)'
                  : 'Wyniki z wyszukiwarki Google'}
                {selected.length > 0 ? ` · zaznaczono ${selected.length}` : ''}
              </Text>
              <Group gap="sm">
                <Button variant="default" onClick={onClose}>
                  Anuluj
                </Button>
                <Button disabled={selected.length === 0} loading={saving} onClick={save}>
                  Zapisz zaznaczone
                </Button>
              </Group>
            </Group>
          </>
        ) : null}
      </Stack>
    </Modal>
  )
}

function SuggestionTile({
  checked,
  onToggle,
  suggestion,
}: {
  checked: boolean
  onToggle: () => void
  suggestion: PhotoSuggestion
}) {
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
          <Image
            src={suggestion.thumbnailUrl}
            alt={suggestion.title}
            h={120}
            fit="contain"
            // A dead link in a search result is ordinary; the tile says so
            // instead of showing a broken image icon.
            fallbackSrc="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3C/svg%3E"
          />
          <Checkbox
            checked={checked}
            onChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            style={{ left: 6, position: 'absolute', top: 6 }}
          />
        </div>
        <Text size="xs" lineClamp={1} title={suggestion.title}>
          {suggestion.title || 'bez tytułu'}
        </Text>
        {suggestion.attribution ? (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {suggestion.attribution}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}

function defaultQuery(tool: Tool): string {
  const parts = [tool.brand, tool.model].map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : tool.name
}
