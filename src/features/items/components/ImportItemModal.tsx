import { Alert, Button, Group, List, Modal, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconDownload } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '../../../api/client'
import { importItem } from '../../../api/items'
import { COUNTS, t, tCount } from '../../../i18n'
import { isKnownSource, useImportSources } from '../useImportSources'

// Making a card out of a shop's product page: paste the address, and the card
// arrives with its parameters and its photographs already on it.
//
// The dialog says which shops it can read before asking for anything, because
// the answer to "why was my link refused" should be on the screen that refused
// it. An address from anywhere else is stopped here as well as on the server —
// here so nobody waits for a round trip to be told, there because that is
// where it is true.
export function ImportItemModal({ onClose, opened }: { onClose: () => void; opened: boolean }) {
  const [url, setUrl] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { sources: known } = useImportSources(opened)
  const unsupported = url.trim().length > 0 && known.length > 0 && !isKnownSource(url, known)

  const run = useMutation({
    mutationFn: importItem,
    onSuccess: async ({ imported, item }) => {
      // The contract allows a null card: the server reads it back after writing
      // it, and says so rather than pretending it cannot fail. Nothing useful
      // to show without one, so this is the same refusal as any other.
      if (!item) {
        notifications.show({
          color: 'red',
          message: t('Nie udało się odczytać zaimportowanej karty'),
        })
        return
      }

      queryClient.setQueryData(['item', item.id], { item })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['item-categories'] })
      await queryClient.invalidateQueries({ queryKey: ['item-attribute-names'] })

      notifications.show({
        color: 'teal',
        message: imported.manuals
          ? t('Zaimportowano: {photos} zdjęć, {attributes} parametrów, {manuals}', {
              attributes: imported.attributes,
              manuals: tCount(COUNTS.manual, imported.manuals),
              photos: imported.photos,
            })
          : t('Zaimportowano: {photos} zdjęć, {attributes} parametrów', {
              attributes: imported.attributes,
              photos: imported.photos,
            }),
      })

      // Straight to the card: the point of importing is to look at what came
      // in and correct the one field the shop had wrong.
      setUrl('')
      onClose()
      navigate(`/items/${item.id}`)
    },
    onError: (error) =>
      notifications.show({
        color: 'red',
        message:
          error instanceof ApiError ? error.message : t('Nie udało się zaimportować narzędzia'),
      }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title={t('Importuj ze strony sklepu')} centered>
      <Stack gap="md">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            {t('Wklej adres strony produktu. Obsługiwane źródła:')}
          </Text>
          <List size="sm" withPadding>
            {known.map((source) => (
              <List.Item key={source.host}>{source.label}</List.Item>
            ))}
          </List>
        </Stack>

        <TextInput
          label={t('Adres strony produktu')}
          placeholder={`https://${known[0]?.host ?? ''}/…`}
          value={url}
          error={unsupported ? t('Ten sklep nie jest obsługiwany') : null}
          onChange={(event) => setUrl(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !unsupported && url.trim()) run.mutate(url.trim())
          }}
          data-autofocus
        />

        {/* Sixteen photographs are sixteen files fetched, converted and
            stored. Saying so beats a spinner somebody thinks has hung. */}
        <Alert color="gray" variant="light" icon={<IconAlertTriangle size={18} />}>
          <Text size="xs">
            {t(
              'Import pobiera wszystkie zdjęcia i parametry, więc może potrwać kilkanaście sekund.',
            )}
          </Text>
        </Alert>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={run.isPending}>
            {t('Anuluj')}
          </Button>
          <Button
            leftSection={<IconDownload size={18} />}
            loading={run.isPending}
            disabled={url.trim().length === 0 || unsupported}
            onClick={() => run.mutate(url.trim())}
          >
            {t('Importuj')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
