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
import { IconFileSearch, IconSearch } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchPageSuggestions, fetchPhotoSuggestions } from '../../../api/photos'
import type { PhotoOwner, PhotoSuggestion } from '../../../api/types'
import { t } from '../../../i18n'

// The web search, on demand. It opens empty and searches when asked: the
// request costs the server a call to a search provider, so it must never be a
// side effect of opening a card.
//
// Multi-select, because the useful outcome is "these three are the right
// machine" — the tick boxes are the point of the screen, not a refinement.
export function PhotoSuggestionsModal({
  defaultQuery,
  fromPage,
  onClose,
  onSave,
  opened,
  owner,
  saving,
}: {
  // What to search for before anyone types. An item is identified by its brand
  // and model, a case by its maker and name, and the caller knows which it is.
  defaultQuery: string
  // Whether this card knows where it came from. When it does, the page it was
  // imported from is offered beside the engines — and it is the better answer,
  // being the maker's own photographs of this exact machine rather than ten
  // plausible pictures of something like it.
  fromPage: boolean
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
    mutationFn: (where: 'page' | 'web') =>
      where === 'page' ? fetchPageSuggestions(owner) : fetchPhotoSuggestions(owner, query),
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

  // What each engine contributed, in the order the results came back. Built
  // from the visible ones only: a tile that failed to load is not something
  // "select all" may put in the basket.
  const byProvider = new Map<string, string[]>()
  for (const suggestion of suggestions) {
    byProvider.set(suggestion.provider, [
      ...(byProvider.get(suggestion.provider) ?? []),
      suggestion.url,
    ])
  }

  const allSelected =
    suggestions.length > 0 && suggestions.every((suggestion) => selected.includes(suggestion.url))

  const save = () => {
    const chosen = suggestions.filter((suggestion) => selected.includes(suggestion.url))
    onSave(chosen.map((s) => ({ attribution: s.attribution, url: s.url })))
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('Znajdź zdjęcia w internecie')}
      size="xl"
      centered
    >
      <Stack gap="md">
        <Group align="flex-end" gap="sm">
          <TextInput
            label={t('Czego szukamy')}
            description={t('Domyślnie marka i model — to one identyfikują maszynę')}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => event.key === 'Enter' && search.mutate('web')}
            style={{ flexGrow: 1 }}
            leftSection={<IconSearch size={16} />}
          />
          <Button
            onClick={() => search.mutate('web')}
            loading={search.isPending && search.variables === 'web'}
          >
            {t('Szukaj')}
          </Button>
        </Group>

        {/* The card's own page, when it has one. Offered as a button rather
            than as a second search box: there is nothing to type, the address
            is already on the card. */}
        {fromPage ? (
          <Group gap="sm" align="center">
            <Button
              variant="light"
              leftSection={<IconFileSearch size={18} />}
              onClick={() => search.mutate('page')}
              loading={search.isPending && search.variables === 'page'}
            >
              {t('Z karty produktu')}
            </Button>
            <Text size="xs" c="dimmed">
              {t('Zdjęcia producenta tego właśnie modelu, zamiast wyników wyszukiwania')}
            </Text>
          </Group>
        ) : null}

        {search.isError ? (
          <Alert color="orange" variant="light" title={t('Wyszukiwanie niedostępne')}>
            {(search.error as Error).message}
          </Alert>
        ) : null}

        {/* Several engines can be on at once, so a partial failure is normal:
            the results are still usable and the screen says what is missing. */}
        {/* Read defensively: an answer without this field is a bug on the
            other side, and a blank screen is a poor way to report one. */}
        {(search.data?.failed ?? []).length > 0 ? (
          <Alert color="yellow" variant="light" title={t('Część wyszukiwarek nie odpowiedziała')}>
            {(search.data?.failed ?? []).map((entry) => entry.message).join(' · ')}
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
              ? t('Nic nie znaleziono. Spróbuj innego zapytania — na przykład samej marki.')
              : t('Znaleziono {n}, ale żaden podgląd się nie wczytał. Spróbuj innego zapytania.', {
                  n: found.length,
                })}
          </Text>
        ) : null}

        {suggestions.length > 0 ? (
          <>
            <Group gap="sm" align="center">
              <Checkbox
                size="xs"
                label={`Zaznacz wszystkie (${suggestions.length})`}
                checked={allSelected}
                indeterminate={selected.length > 0 && !allSelected}
                onChange={() =>
                  setSelected(allSelected ? [] : suggestions.map((suggestion) => suggestion.url))
                }
              />

              {/* With one engine on, "only from it" is the same button twice.
                  With several it is the useful one: a search for a model the
                  shop sells finds the right machine there and lookalikes
                  everywhere else. */}
              {byProvider.size > 1 ? (
                <>
                  <Text size="xs" c="dimmed">
                    tylko z:
                  </Text>
                  {[...byProvider].map(([provider, urls]) => (
                    <Button
                      key={provider}
                      size="compact-xs"
                      variant="light"
                      color={providerColor(provider)}
                      onClick={() => setSelected(urls)}
                    >
                      {providerLabel(provider)} ({urls.length})
                    </Button>
                  ))}
                </>
              ) : null}
            </Group>

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
                  {t('Anuluj')}
                </Button>
                <Button disabled={selected.length === 0} loading={saving} onClick={save}>
                  {t('Zapisz zaznaczone')}
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
            color={providerColor(suggestion.provider)}
            style={{ position: 'absolute', right: 6, top: 6 }}
          >
            {providerLabel(suggestion.provider)}
          </Badge>
        </div>
        <Text size="xs" lineClamp={1} title={suggestion.title}>
          {suggestion.title || t('bez tytułu')}
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

function providerColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? 'gray'
}
