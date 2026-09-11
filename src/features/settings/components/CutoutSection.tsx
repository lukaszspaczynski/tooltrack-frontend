import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberInput,
  PasswordInput,
  Stack,
  Switch,
  Text,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconWand } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import {
  CUTOUT_SETTINGS_KEY,
  fetchCutoutSettings,
  saveCutoutMethod,
  saveCutoutThreshold,
} from '../../../api/settings'
import type { CutoutMethod, CutoutMethodSettings, CutoutSettings } from '../../../api/types'

// The second half of the settings page, shaped like the first: a list of
// methods, each either usable or not. There is no "default method" — the
// method for a given photo is chosen on the cutout screen, from whatever is
// switched on here and has its key.
export function CutoutSection({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient()
  // Null means "unchanged", so the save button can tell an untouched field
  // from one typed back to the stored value.
  const [pendingThreshold, setPendingThreshold] = useState<null | number>(null)

  const settings = useQuery({ queryKey: CUTOUT_SETTINGS_KEY, queryFn: fetchCutoutSettings })

  const applyResponse = (response: CutoutSettings) => {
    queryClient.setQueryData(CUTOUT_SETTINGS_KEY, response)
  }

  const save = useMutation({
    mutationFn: ({
      changes,
      method,
    }: {
      changes: { apiKey?: string; enabled?: boolean }
      method: CutoutMethod
    }) => saveCutoutMethod(method, changes),
    onSuccess: (response) => {
      applyResponse(response)
      notifications.show({ color: 'teal', message: 'Zapisano' })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const threshold = useMutation({
    mutationFn: saveCutoutThreshold,
    onSuccess: (response) => {
      applyResponse(response)
      notifications.show({ color: 'teal', message: 'Zapisano próg' })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  if (settings.isError) {
    return (
      <Alert color="red" variant="light" title="Nie udało się wczytać ustawień wycinania">
        {(settings.error as Error).message}
      </Alert>
    )
  }

  if (!settings.data) return null

  const localUsable = settings.data.methods.some(
    (entry) => entry.method === 'local' && entry.enabled,
  )

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <IconWand size={18} />
        <Text fw={600}>Metody wycinania</Text>
        {isAdmin ? (
          <Badge size="xs" variant="light">
            tylko administrator
          </Badge>
        ) : null}
      </Group>
      <Text c="dimmed" size="sm">
        Różdżka przy zdjęciu otwiera ekran wycinania, gdzie metodę wybiera się dla każdego zdjęcia
        osobno, widząc oryginał obok wyniku. Tutaj decyduje się,{' '}
        <strong>które metody są tam do wyboru</strong>. Wycinka zawsze powstaje jako nowe zdjęcie —
        oryginał zostaje.
      </Text>

      {settings.data.usable === 0 ? (
        <Alert color="orange" variant="light" icon={<IconAlertTriangle size={18} />}>
          Żadna metoda nie jest dostępna, więc różdżka przy zdjęciach nie zadziała.
        </Alert>
      ) : null}

      {settings.data.methods.map((method) =>
        isAdmin ? (
          <MethodCard
            key={method.method}
            method={method}
            onSave={(changes) => save.mutate({ changes, method: method.method })}
            pending={save.isPending && save.variables?.method === method.method}
          />
        ) : (
          <MethodRow key={method.method} method={method} />
        ),
      )}

      {isAdmin && localUsable ? (
        <Card withBorder padding="md" radius="md">
          <Group align="flex-end" gap="sm">
            <Tooltip
              multiline
              w={280}
              label="Suma składowych RGB, od której piksel liczy się jako tło. 735 to średnio 245 na kanał. Obniż przy szarawym tle, podnieś, gdy jasne narzędzie gubi fragmenty."
            >
              <NumberInput
                label="Domyślny próg jasności tła"
                description="Punkt wyjścia dla metody lokalnej na ekranie wycinania (1–765)"
                min={1}
                max={765}
                defaultValue={settings.data.threshold}
                onChange={(value) =>
                  setPendingThreshold(Number.isInteger(Number(value)) ? Number(value) : null)
                }
                size="sm"
                w={280}
              />
            </Tooltip>
            <Button
              size="sm"
              variant="light"
              loading={threshold.isPending}
              onClick={() => threshold.mutate(pendingThreshold ?? settings.data.threshold)}
              disabled={pendingThreshold === null || pendingThreshold === settings.data.threshold}
            >
              Zapisz próg
            </Button>
          </Group>
        </Card>
      ) : null}
    </Stack>
  )
}

// A method as a non-admin sees it: what it is and whether it is available.
function MethodRow({ method }: { method: CutoutMethodSettings }) {
  const available = method.configured && method.enabled

  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={2}>
          <Text fw={500} size="sm">
            {method.label}
          </Text>
          <Text c="dimmed" size="xs">
            {method.note}
          </Text>
        </Stack>
        <Badge size="xs" color={available ? 'teal' : 'gray'} variant="light">
          {available ? 'dostępna' : method.configured ? 'wyłączona' : 'brak klucza'}
        </Badge>
      </Group>
    </Card>
  )
}

function MethodCard({
  method,
  onSave,
  pending,
}: {
  method: CutoutMethodSettings
  onSave: (changes: { apiKey?: string; enabled?: boolean }) => void
  pending: boolean
}) {
  const [key, setKey] = useState('')

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={500}>{method.label}</Text>
              {method.configured ? (
                method.enabled ? (
                  <Badge size="xs" color="teal" variant="light">
                    dostępna
                  </Badge>
                ) : (
                  <Badge size="xs" color="gray" variant="light">
                    wyłączona
                  </Badge>
                )
              ) : (
                <Badge size="xs" color="gray" variant="light">
                  brak klucza
                </Badge>
              )}
              {method.keySource === 'environment' ? (
                <Tooltip label="Klucz pochodzi ze zmiennej środowiskowej serwera. Zapisanie go tutaj przykryje tamtą wartość.">
                  <Badge size="xs" color="blue" variant="light">
                    ze środowiska
                  </Badge>
                </Tooltip>
              ) : null}
            </Group>
            <Text c="dimmed" size="xs">
              {method.note}
            </Text>
          </Stack>

          <Tooltip label="Wyłączona metoda nie pojawia się na ekranie wycinania">
            <div>
              <Switch
                checked={method.enabled}
                disabled={pending}
                onChange={(event) => onSave({ enabled: event.currentTarget.checked })}
                aria-label={`Włącz ${method.label}`}
              />
            </div>
          </Tooltip>
        </Group>

        {method.requiresKey ? (
          <Group align="flex-end" gap="sm" grow preventGrowOverflow={false}>
            <PasswordInput
              label={method.keyLabel}
              placeholder={method.keyHint || 'nie ustawiono'}
              description={method.configured ? `Zapisany: ${method.keyHint}` : 'Nie ustawiono'}
              value={key}
              onChange={(event) => setKey(event.currentTarget.value)}
              size="sm"
              style={{ flexGrow: 1 }}
            />
            <Button
              size="sm"
              variant="light"
              loading={pending}
              disabled={key === ''}
              onClick={() => {
                // Only what was typed. An untouched field must not overwrite a
                // stored key with an empty string.
                onSave({ apiKey: key.trim() })
                setKey('')
              }}
              style={{ flexGrow: 0 }}
            >
              Zapisz klucz
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Card>
  )
}
