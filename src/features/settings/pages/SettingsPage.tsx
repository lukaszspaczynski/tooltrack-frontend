import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  NumberInput,
  PasswordInput,
  Stack,
  Switch,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconKey, IconSearch } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import {
  fetchSearchEngines,
  saveSearchEngine,
  SEARCH_ENGINES_KEY,
  setMySearchEngine,
} from '../../../api/settings'
import type {
  SearchEngineSettings,
  SearchEnginesResponse,
  SearchProvider,
} from '../../../api/types'
import { useSession } from '../../../session/SessionContext'
import { CutoutSection } from '../components/CutoutSection'

// Two things on one page, owned by two different people. The keys belong to
// the installation and only an admin may change them; which of the configured
// engines a given person searches with is their own business.
export function SettingsPage() {
  const { can } = useSession()
  const queryClient = useQueryClient()
  const isAdmin = can('users.manage')

  const engines = useQuery({ queryKey: SEARCH_ENGINES_KEY, queryFn: fetchSearchEngines })

  const applyResponse = (response: SearchEnginesResponse) => {
    queryClient.setQueryData(SEARCH_ENGINES_KEY, response)
  }

  const mine = useMutation({
    mutationFn: ({ enabled, provider }: { enabled: boolean; provider: SearchProvider }) =>
      setMySearchEngine(provider, enabled),
    onSuccess: applyResponse,
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const global = useMutation({
    mutationFn: ({
      changes,
      provider,
    }: {
      changes: { apiKey?: string; apiSecret?: string; enabled?: boolean }
      provider: SearchProvider
    }) => saveSearchEngine(provider, changes),
    onSuccess: (response) => {
      applyResponse(response)
      notifications.show({ color: 'teal', message: 'Zapisano' })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  if (engines.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  if (engines.isError) {
    return (
      <Alert color="red" variant="light" title="Nie udało się wczytać ustawień">
        {(engines.error as Error).message}
      </Alert>
    )
  }

  const { engines: list, usable } = engines.data

  return (
    <Stack gap="lg" maw={760}>
      <Stack gap={0}>
        <Title order={2}>Ustawienia</Title>
        <Text c="dimmed" size="sm">
          Wyszukiwarki zdjęć używane przy „Znajdź w internecie”.
        </Text>
      </Stack>

      {usable === 0 ? (
        <Alert
          color="orange"
          variant="light"
          icon={<IconAlertTriangle size={18} />}
          title="Wyszukiwanie zdjęć jest wyłączone"
        >
          Żadna wyszukiwarka nie jest dla Ciebie aktywna, więc przycisk „Znajdź w internecie” jest
          nieaktywny.{' '}
          {isAdmin
            ? 'Włącz którąś poniżej albo uzupełnij jej klucz.'
            : 'Włącz którąś poniżej lub poproś administratora o skonfigurowanie kluczy.'}
        </Alert>
      ) : null}

      <Stack gap="xs">
        <Group gap="xs">
          <IconSearch size={18} />
          <Text fw={600}>Moje wyszukiwarki</Text>
        </Group>
        <Text c="dimmed" size="sm">
          Dotyczy tylko Twojego konta. Wyłączona wyszukiwarka nie jest odpytywana przy Twoich
          wyszukiwaniach.
        </Text>

        {list.map((engine) => (
          <MyEngineRow
            key={engine.provider}
            engine={engine}
            onToggle={(enabled) => mine.mutate({ enabled, provider: engine.provider })}
            pending={mine.isPending && mine.variables?.provider === engine.provider}
          />
        ))}
      </Stack>

      <Divider />

      <CutoutSection isAdmin={isAdmin} />

      {isAdmin ? (
        <Stack gap="xs">
          <Group gap="xs">
            <IconKey size={18} />
            <Text fw={600}>Klucze wyszukiwarek</Text>
            <Badge size="xs" variant="light">
              tylko administrator
            </Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Konfiguracja wspólna dla całej instalacji. Klucze nie są nigdy odsyłane z serwera —
            widać tylko cztery ostatnie znaki. Puste pole zapisane przyciskiem usuwa klucz.
          </Text>

          {list.map((engine) => (
            <GlobalEngineCard
              key={engine.provider}
              engine={engine}
              onSave={(changes) => global.mutate({ changes, provider: engine.provider })}
              pending={global.isPending && global.variables?.provider === engine.provider}
            />
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}

function MyEngineRow({
  engine,
  onToggle,
  pending,
}: {
  engine: SearchEngineSettings
  onToggle: (enabled: boolean) => void
  pending: boolean
}) {
  const blocked = !engine.configured || !engine.globallyEnabled
  const reason = !engine.globallyEnabled
    ? 'Wyłączona globalnie przez administratora'
    : 'Brak klucza — poproś administratora o konfigurację'

  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={500}>{engine.label}</Text>
            {blocked ? (
              <Badge size="xs" color="gray" variant="light">
                niedostępna
              </Badge>
            ) : null}
          </Group>
          <Text c="dimmed" size="xs">
            {blocked ? reason : engine.note}
          </Text>
        </Stack>

        <Tooltip label={reason} disabled={!blocked}>
          <div>
            <Switch
              checked={engine.usedByMe && !blocked}
              disabled={blocked || pending}
              onChange={(event) => onToggle(event.currentTarget.checked)}
              aria-label={`Używaj ${engine.label}`}
            />
          </div>
        </Tooltip>
      </Group>
    </Card>
  )
}

function GlobalEngineCard({
  engine,
  onSave,
  pending,
}: {
  engine: SearchEngineSettings
  onSave: (changes: {
    apiKey?: string
    apiSecret?: string
    enabled?: boolean
    resultLimit?: number
  }) => void
  pending: boolean
}) {
  const [key, setKey] = useState('')
  const [secret, setSecret] = useState('')
  const [limit, setLimit] = useState(engine.resultLimit)

  const save = () => {
    // Only what was typed is sent. An untouched field must not overwrite a
    // stored key with an empty string.
    const changes: { apiKey?: string; apiSecret?: string } = {}
    if (key !== '') changes.apiKey = key.trim()
    if (secret !== '') changes.apiSecret = secret.trim()
    onSave(changes)
    setKey('')
    setSecret('')
  }

  // Saved when the field is left rather than on every keystroke: typing "20"
  // would otherwise be a request for 2 and a request for 20.
  const saveLimit = () => {
    if (limit !== engine.resultLimit) onSave({ resultLimit: limit })
  }

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={500}>{engine.label}</Text>
              {engine.configured ? (
                <Badge size="xs" color="teal" variant="light">
                  skonfigurowana
                </Badge>
              ) : engine.requiresKey ? (
                <Badge size="xs" color="gray" variant="light">
                  brak klucza
                </Badge>
              ) : null}
              {engine.keySource === 'environment' ? (
                <Tooltip label="Klucz pochodzi ze zmiennej środowiskowej serwera. Zapisanie go tutaj przykryje tamtą wartość.">
                  <Badge size="xs" color="blue" variant="light">
                    ze środowiska
                  </Badge>
                </Tooltip>
              ) : null}
            </Group>
            <Text c="dimmed" size="xs">
              {engine.note}
            </Text>
          </Stack>

          <Tooltip label="Wyłącza tę wyszukiwarkę dla wszystkich kont">
            <div>
              <Switch
                checked={engine.globallyEnabled}
                disabled={pending}
                onChange={(event) => onSave({ enabled: event.currentTarget.checked })}
                aria-label={`Włącz ${engine.label} globalnie`}
              />
            </div>
          </Tooltip>
        </Group>

        <NumberInput
          label="Limit wyników"
          description={
            engine.maxResults < 30
              ? `Ile zdjęć ta wyszukiwarka dokłada do jednego wyszukiwania. Nie więcej niż ${engine.maxResults} — tyle oddaje jej API.`
              : `Ile zdjęć ta wyszukiwarka dokłada do jednego wyszukiwania (1–${engine.maxResults})`
          }
          min={1}
          max={engine.maxResults}
          clampBehavior="strict"
          allowDecimal={false}
          value={limit}
          onChange={(value) => setLimit(typeof value === 'number' ? value : engine.resultLimit)}
          onBlur={saveLimit}
          disabled={pending}
          size="sm"
          w={260}
        />

        {engine.requiresKey ? (
          <Group align="flex-end" gap="sm" grow>
            <PasswordInput
              label={engine.keyLabel}
              placeholder={engine.keyHint || 'wklej klucz'}
              description={engine.keyHint ? `Zapisany: ${engine.keyHint}` : 'Nie ustawiono'}
              value={key}
              onChange={(event) => setKey(event.currentTarget.value)}
              size="sm"
            />
            {engine.requiresSecret ? (
              <PasswordInput
                label={engine.secretLabel}
                placeholder={engine.secretHint || 'wklej identyfikator'}
                description={engine.secretHint ? `Zapisany: ${engine.secretHint}` : 'Nie ustawiono'}
                value={secret}
                onChange={(event) => setSecret(event.currentTarget.value)}
                size="sm"
              />
            ) : null}
            <Button
              size="sm"
              variant="light"
              loading={pending}
              disabled={key === '' && secret === ''}
              onClick={save}
              style={{ flexGrow: 0 }}
            >
              Zapisz
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Card>
  )
}
