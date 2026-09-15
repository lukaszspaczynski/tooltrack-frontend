import { Alert, Button, Group, List, Modal, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { ApiError } from '../../../api/client'
import { refreshToolFromPage } from '../../../api/items'
import { COUNTS, t, tCount } from '../../../i18n'
import { useImportSources } from '../useImportSources'

// Reading the product page again into a card that already exists.
//
// The dialog says what it will overwrite before it does, because the answer is
// not obvious and two of the lines are destructive: the parameters and the
// documents are cleared and written again rather than merged. A page is the
// source of truth for what a machine is, so a parameter the maker has dropped
// should leave the card — but somebody who typed one in by hand deserves to
// know that first.
export function RefreshFromPageModal({
  onClose,
  opened,
  reference,
  itemId,
}: {
  onClose: () => void
  opened: boolean
  // The address this card was last read from, when it was read from one. The
  // common case is updating from the same page, so it starts filled in.
  reference: string
  itemId: number
}) {
  const [url, setUrl] = useState(reference)
  const queryClient = useQueryClient()

  const { sources } = useImportSources(opened)

  const refresh = useMutation({
    mutationFn: (address: string) => refreshToolFromPage(itemId, address),
    onSuccess: async ({ imported, item }) => {
      queryClient.setQueryData(['item', itemId], { item })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['item-manuals', itemId] })
      await queryClient.invalidateQueries({ queryKey: ['item-attribute-names'] })
      await queryClient.invalidateQueries({ queryKey: ['manual-library'] })

      notifications.show({
        color: 'teal',
        message: t('Zaktualizowano: {attributes} parametrów, {manuals}', {
          attributes: imported.attributes,
          manuals: tCount(COUNTS.manual, imported.manuals),
        }),
      })
      onClose()
    },
    onError: (error) =>
      notifications.show({
        color: 'red',
        message:
          error instanceof ApiError ? error.message : t('Nie udało się zaktualizować narzędzia'),
      }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title={t('Aktualizuj z karty produktu')} centered>
      <Stack gap="md">
        <TextInput
          label={t('Adres karty produktu')}
          placeholder={`https://${sources[0]?.host ?? ''}/…`}
          value={url}
          onChange={(event) => setUrl(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && url.trim()) refresh.mutate(url.trim())
          }}
          data-autofocus
        />

        <Alert color="orange" variant="light" icon={<IconAlertTriangle size={18} />}>
          <Text size="sm" fw={600}>
            {t('Zostanie nadpisane')}
          </Text>
          <List size="xs" withPadding>
            <List.Item>{t('Marka, model, kategoria i opis')}</List.Item>
            <List.Item>{t('Parametry — wszystkie, łącznie z dopisanymi ręcznie')}</List.Item>
            <List.Item>{t('Instrukcje — stare znikają, przychodzą te ze strony')}</List.Item>
          </List>
          <Text size="sm" fw={600} mt="xs">
            {t('Zostaje bez zmian')}
          </Text>
          <List size="xs" withPadding>
            <List.Item>{t('Nazwa, numer seryjny i stan')}</List.Item>
            <List.Item>{t('Zdjęcia — także te wgrane ręcznie')}</List.Item>
          </List>
        </Alert>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={refresh.isPending}>
            {t('Anuluj')}
          </Button>
          <Button
            leftSection={<IconRefresh size={18} />}
            loading={refresh.isPending}
            disabled={url.trim().length === 0}
            onClick={() => refresh.mutate(url.trim())}
          >
            {t('Aktualizuj')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
