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
import { IconSearch } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchPhotoSuggestions } from '../../../api/photos'
import type { PhotoOwner, PhotoSuggestion } from '../../../api/types'

// The web search, on demand. It opens empty and searches when asked: the
// request costs the server a call to a search provider, so it must never be a
// side effect of opening a card.
//
// Multi-select, because the useful outcome is "these three are the right
// machine" — the tick boxes are the point of the screen, not a refinement.
export function PhotoSuggestionsModal({
  defaultQuery,
  onClose,
  onSave,
  opened,
  owner,
  saving,
}: {
  // What to search for before anyone types. A tool is identified by its brand
  // and model, a case by its maker and name, and the caller knows which it is.
  defaultQuery: string
  onClose: () => void
  onSave: (items: { attribution: string; url: string }[]) => void
  opened: boolean
  owner: PhotoOwner
  saving: boolean
}) {
  const [query, setQuery] = useState(defaultQuery)
  const [selected, setSelected] = useState<string[]>([])
  // Results whose picture did not load. A search result is a link, and some of
  // them are dead; a tile with nothing in it is not a choice, so it leaves the
  // grid rather than sitting there as a placeholder.
  const [broken, setBroken] = useState<string[]>([])

  const search = useMutation({
    mutationFn: (value: string) => fetchPhotoSuggestions(owner, value),
    onSuccess: () => {
      setSelected([])
      setBroken([])
    },
  })

  const found = search.data?.suggestions ?? []
  const suggestions = found.filter((suggestion) => !broken.includes(suggestion.url))

  const markBroken = (url: string) => {
    setBroken((current) => (current.includes(url) ? current : [...current, url]))
    // A tile that is about to disappear must not stay ticked, or the save
    // would send an address the browser has just proved it cannot fetch.
    setSelected((current) => current.filter((entry) => entry !== url))
  }

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
            {found.length === 0
              ? 'Nic nie znaleziono. Spróbuj innego zapytania — na przykład samej marki.'
              : `Znaleziono ${found.length}, ale żaden podgląd się nie wczytał. Spróbuj innego zapytania.`}
          </Text>
        ) : null}

        {suggestions.length > 0 ? (
          <>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {suggestions.map((suggestion) => (
                <SuggestionTile
                  key={suggestion.url}
                  checked={selected.includes(suggestion.url)}
                  onBroken={() => markBroken(suggestion.url)}
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
  onBroken,
  onToggle,
  suggestion,
}: {
  checked: boolean
  onBroken: () => void
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
            // Lazily, because a suggestion thumbnail is the full image on the
            // source CDN and a grid of ten should not fetch what is scrolled
            // out of sight.
            loading="lazy"
            onError={onBroken}
          />
          <Checkbox
            checked={checked}
            onChange={onToggle}
            onClick={(event) => event.stopPropagation()}
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
  mistama: 'mistama.com',
  openverse: 'Openverse',
}

// One colour per engine, so a mixed result set reads at a glance: which of
// these came from the paid index and which from the free one.
const PROVIDER_COLORS: Record<string, string> = {
  brave: 'orange',
  google: 'blue',
  mistama: 'grape',
  openverse: 'teal',
}

function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider
}
