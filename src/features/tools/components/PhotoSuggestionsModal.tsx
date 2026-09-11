import {
  Alert,
  Badge,
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
import { IconPhotoOff, IconSearch } from '@tabler/icons-react'
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

        {/* Several engines can be on at once, so a partial failure is normal:
            the results are still usable and the screen says what is missing. */}
        {search.data && search.data.failed.length > 0 ? (
          <Alert color="yellow" variant="light" title="Część wyszukiwarek nie odpowiedziała">
            {search.data.failed.map((entry) => entry.message).join(' · ')}
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
                {`Wyniki z: ${(search.data?.providers ?? []).map(providerLabel).join(', ')}`}
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
  const [broken, setBroken] = useState(false)

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
          {broken ? (
            // A dead link in a search result is ordinary. Saying so is the
            // point: an invisible placeholder makes a failed load look like an
            // empty result set, which is what it did before.
            <Stack align="center" justify="center" gap={4} h={120}>
              <IconPhotoOff size={24} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed">
                brak podglądu
              </Text>
            </Stack>
          ) : (
            <Image
              src={suggestion.thumbnailUrl}
              alt={suggestion.title}
              h={120}
              fit="contain"
              // Lazily, because a suggestion thumbnail is the full image on the
              // source CDN and a grid of ten should not fetch what is scrolled
              // out of sight.
              loading="lazy"
              onError={() => setBroken(true)}
            />
          )}
          <Checkbox
            checked={checked}
            onChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            disabled={broken}
            style={{ left: 6, position: 'absolute', top: 6 }}
          />

          {/* Which engine found this. With several engines on, the same query
              returns pictures of very different provenance — a manufacturer's
              product shot and someone's photo on Flickr — and that is worth
              knowing before ticking the box. */}
          <Badge
            size="xs"
            variant="filled"
            color={PROVIDER_COLORS[suggestion.provider] ?? 'gray'}
            style={{ position: 'absolute', right: 6, top: 6 }}
          >
            {providerLabel(suggestion.provider)}
          </Badge>
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

const PROVIDER_LABELS: Record<string, string> = {
  brave: 'Brave',
  google: 'Google',
  openverse: 'Openverse',
}

// One colour per engine, so a mixed result set reads at a glance: which of
// these came from the paid index and which from the free one.
const PROVIDER_COLORS: Record<string, string> = {
  brave: 'orange',
  google: 'blue',
  openverse: 'teal',
}

function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider
}

function defaultQuery(tool: Tool): string {
  const parts = [tool.brand, tool.model].map((part) => part.trim()).filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : tool.name
}
