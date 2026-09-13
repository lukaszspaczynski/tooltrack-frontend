import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconWand } from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { apiFileUrl } from '../../../api/client'
import { commitCutout, previewCutout } from '../../../api/photos'
import { CUTOUT_SETTINGS_KEY, fetchCutoutSettings } from '../../../api/settings'
import type { CutoutMethod, CutoutPreview, CutoutSettings, PhotoOwner } from '../../../api/types'
import { t } from '../../../i18n'

// The cutout screen: original on the left, result on the right, and nothing is
// written until somebody says so.
//
// The method list is built from what the server can actually run — `auto` and
// `none` are settings rather than choices, and a service with no key would
// only produce a 503 — so a method offered here is one that will answer.
export function CutoutStudio({
  onClose,
  onSaved,
  opened,
  owner,
  photo,
}: {
  onClose: () => void
  onSaved: () => void
  opened: boolean
  photo: {
    contentType: string
    height: null | number
    id: number
    url: string
    width: null | number
  }
  owner: PhotoOwner
}) {
  const settings = useQuery({
    queryKey: CUTOUT_SETTINGS_KEY,
    queryFn: fetchCutoutSettings,
    enabled: opened,
  })

  // Which method to use for this photo. Null means "the first one that can
  // run", derived during render rather than copied into state by an effect:
  // the settings arrive after the first paint, and writing them back would
  // render twice to say the same thing. The modal is mounted per photo, so
  // there is nothing to reset.
  const [chosen, setChosen] = useState<CutoutMethod | null>(null)
  const [chosenThreshold, setChosenThreshold] = useState<null | number | string>(null)
  const [padding, setPadding] = useState<number | string>(6)
  const [removeBgType, setRemoveBgType] = useState<'auto' | 'product'>('product')
  const [preview, setPreview] = useState<null | { image: CutoutPreview; provider: string }>(null)

  const available = availableMethods(settings.data)
  const missing = missingMethods(settings.data)
  const method = chosen ?? available[0] ?? null
  const threshold = chosenThreshold ?? settings.data?.threshold ?? 735

  const run = useMutation({
    mutationFn: () =>
      previewCutout(owner, photo.id, {
        method: method ?? undefined,
        padding: Number(padding),
        removeBgType,
        threshold: Number(threshold),
      }),
    onSuccess: (response) => setPreview({ image: response.preview, provider: response.provider }),
    onError: () => setPreview(null),
  })

  const keep = useMutation({
    mutationFn: (checksum: string) => commitCutout(owner, photo.id, checksum),
    onSuccess: () => {
      notifications.show({ color: 'teal', message: t('Wycinka zapisana jako nowe zdjęcie') })
      onSaved()
      onClose()
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const usesLocal = method === 'local'

  return (
    <Modal opened={opened} onClose={onClose} title={t('Wytnij samo narzędzie')} size="xl" centered>
      <Stack gap="md">
        {available.length === 0 ? (
          <Alert color="orange" variant="light" icon={<IconAlertTriangle size={18} />}>
            {t('Wycinanie jest wyłączone w Ustawieniach.')}
          </Alert>
        ) : (
          <>
            <Group align="flex-end" gap="sm" wrap="wrap">
              <Select
                label={t('Metoda')}
                description={method ? t(METHOD_HINTS[method]) : undefined}
                data={available.map((value) => ({ label: t(METHOD_LABELS[value]), value }))}
                value={method}
                allowDeselect={false}
                onChange={(value) => {
                  setChosen(value as CutoutMethod)
                  // The result on screen was made by the previous method.
                  setPreview(null)
                }}
                size="sm"
                w={200}
              />

              {usesLocal ? (
                <>
                  <NumberInput
                    label={t('Próg jasności tła')}
                    description="1–765"
                    min={1}
                    max={765}
                    value={threshold}
                    onChange={setChosenThreshold}
                    size="sm"
                    w={160}
                  />
                  <NumberInput
                    label={t('Margines')}
                    description={t('pikseli wokół')}
                    min={0}
                    max={200}
                    value={padding}
                    onChange={setPadding}
                    size="sm"
                    w={130}
                  />
                </>
              ) : null}

              {method === 'removebg' ? (
                <Select
                  label={t('Typ obiektu')}
                  description={t('podpowiedź dla usługi')}
                  data={[
                    { label: 'Produkt', value: 'product' },
                    { label: t('Wykryj sam'), value: 'auto' },
                  ]}
                  value={removeBgType}
                  allowDeselect={false}
                  onChange={(value) => setRemoveBgType((value as 'auto' | 'product') ?? 'product')}
                  size="sm"
                  w={180}
                />
              ) : null}

              <Button
                leftSection={<IconWand size={16} />}
                loading={run.isPending}
                onClick={() => run.mutate()}
                size="sm"
              >
                {preview ? t('Generuj ponownie') : t('Generuj podgląd')}
              </Button>
            </Group>

            {missing.length > 0 ? (
              <Text c="dimmed" size="xs">
                {t(
                  'Niedostępne bez klucza: {methods} — konfiguruje je administrator w Ustawieniach.',
                  {
                    methods: missing.join(', '),
                  },
                )}
              </Text>
            ) : null}

            {run.isError ? (
              <Alert color="orange" variant="light" title={t('Nie udało się wyciąć')}>
                {(run.error as Error).message}
              </Alert>
            ) : null}

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Pane
                caption={photo.width ? `${photo.width}×${photo.height}` : ''}
                title={t('Oryginał')}
              >
                <Image src={apiFileUrl(photo.url)} alt={t('Oryginał')} h={320} fit="contain" />
              </Pane>

              <Pane
                caption={
                  preview
                    ? `${preview.image.width}×${preview.image.height} · ${t(METHOD_LABELS[preview.provider] ?? preview.provider)}`
                    : ''
                }
                title={t('Po wycięciu')}
              >
                {run.isPending ? (
                  <Center h={320}>
                    <Loader />
                  </Center>
                ) : preview ? (
                  <Image
                    src={apiFileUrl(preview.image.url)}
                    alt={t('Wycinka')}
                    h={320}
                    fit="contain"
                    // A checkerboard, so transparent background reads as
                    // transparent rather than as white.
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, var(--mantine-color-default-hover) 25%, transparent 25%), linear-gradient(-45deg, var(--mantine-color-default-hover) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--mantine-color-default-hover) 75%), linear-gradient(-45deg, transparent 75%, var(--mantine-color-default-hover) 75%)',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                      backgroundSize: '16px 16px',
                    }}
                  />
                ) : (
                  <Center h={320}>
                    <Text c="dimmed" size="sm" ta="center" px="md">
                      {t(
                        'Ustaw metodę i kliknij „Generuj podgląd”. Nic nie zostanie zapisane, dopóki nie potwierdzisz.',
                      )}
                    </Text>
                  </Center>
                )}
              </Pane>
            </SimpleGrid>
          </>
        )}

        <Group justify="space-between">
          <Text c="dimmed" size="xs">
            {t('Zapis tworzy nowe zdjęcie. Oryginał zostaje nietknięty.')}
          </Text>
          <Group gap="sm">
            <Button variant="default" onClick={onClose}>
              {t('Anuluj')}
            </Button>
            <Button
              disabled={!preview}
              loading={keep.isPending}
              onClick={() => preview && keep.mutate(preview.image.checksum)}
            >
              {t('Zapisz wycinkę')}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}

const METHOD_LABELS: Record<string, string> = {
  gemini: 'Gemini',
  local: 'Lokalny skrypt',
  removebg: 'remove.bg',
}

const METHOD_HINTS: Record<string, string> = {
  gemini: 'Model ogólny — narzędzie na białym tle, bez przezroczystości.',
  local: 'Bez klucza i natychmiast. Wymaga jasnego, jednolitego tła.',
  removebg: 'Usługa do wycinania — radzi sobie ze zdjęciami z warsztatu.',
}

// What can actually run: methods an admin has switched on and given a key to.
// There is no "try the free one first" option: this screen shows the refusal,
// and choosing whether a photo is worth a paid call is the person's decision,
// not a hidden one.
function availableMethods(settings: CutoutSettings | undefined): CutoutMethod[] {
  if (!settings) return []

  return settings.methods
    .filter((entry) => entry.configured && entry.enabled)
    .map((entry) => entry.method)
}

// Named so the screen can say what is missing rather than silently offering
// less: someone wondering where remove.bg went should be told why.
function missingMethods(settings: CutoutSettings | undefined): string[] {
  if (!settings) return []

  return settings.methods
    .filter((entry) => !entry.configured || !entry.enabled)
    .map((entry) => `${entry.label} (${entry.configured ? t('wyłączona') : 'brak klucza'})`)
}

function Pane({
  caption,
  children,
  title,
}: {
  caption: string
  children: React.ReactNode
  title: string
}) {
  return (
    <Card withBorder padding="xs" radius="md">
      <Stack gap={6}>
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            {title}
          </Text>
          {caption ? (
            <Badge size="xs" variant="default">
              {caption}
            </Badge>
          ) : null}
        </Group>
        {children}
      </Stack>
    </Card>
  )
}
