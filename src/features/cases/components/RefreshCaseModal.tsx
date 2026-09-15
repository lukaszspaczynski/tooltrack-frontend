import { Alert, Button, Group, List, Modal, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { refreshCaseFromPage } from '../../../api/cases'
import { ApiError } from '../../../api/client'
import { t } from '../../../i18n'
import { isKnownCaseSource, useCaseImportSources } from '../useCaseImportSources'

// Reading the product page again into a case that already exists.
//
// The dialog says what it will overwrite before it does. Unlike the item one it
// has nothing destructive to warn about — what a page knows about a box it
// simply restates — but it does have something to promise: the label slots stay.
// A slot is where a sticker goes on this box in this van, and somebody who
// measured one deserves to know it will still be there afterwards.
export function RefreshCaseModal({
  caseId,
  onClose,
  opened,
  reference,
}: {
  caseId: number
  onClose: () => void
  opened: boolean
  // The address this case was last read from, when it was read from one. The
  // common case is updating from the same page, so it starts filled in.
  reference: string
}) {
  const [url, setUrl] = useState(reference)
  const queryClient = useQueryClient()

  const { sources } = useCaseImportSources(opened)
  const unsupported =
    url.trim().length > 0 && sources.length > 0 && !isKnownCaseSource(url, sources)

  const refresh = useMutation({
    mutationFn: (address: string) => refreshCaseFromPage(caseId, address),
    onSuccess: async ({ case: updated }) => {
      queryClient.setQueryData(['case', caseId], { case: updated })
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
      await queryClient.invalidateQueries({ queryKey: ['case-models'] })

      notifications.show({ color: 'teal', message: t('Zaktualizowano skrzynkę ze strony') })
      onClose()
    },
    onError: (error) =>
      notifications.show({
        color: 'red',
        message:
          error instanceof ApiError ? error.message : t('Nie udało się zaktualizować skrzynki'),
      }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title={t('Aktualizuj ze strony producenta')} centered>
      <Stack gap="md">
        <Alert icon={<IconAlertTriangle size={16} />} color="gray" variant="light">
          <Stack gap={4}>
            <Text size="sm">{t('Ze strony zostaną nadpisane:')}</Text>
            <List size="sm" withPadding>
              <List.Item>{t('producent, nazwa i model')}</List.Item>
              <List.Item>{t('wszystkie wymiary, pojemność i ładowność')}</List.Item>
              <List.Item>{t('EAN, SKU i notatka')}</List.Item>
            </List>
            <Text size="sm">{t('Miejsca na etykiety i zdjęcia zostają bez zmian.')}</Text>
          </Stack>
        </Alert>

        <TextInput
          label={t('Adres strony produktu')}
          placeholder={`https://${sources[0]?.host ?? ''}/…`}
          value={url}
          error={unsupported ? t('To źródło nie jest obsługiwane') : null}
          onChange={(event) => setUrl(event.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('Anuluj')}
          </Button>
          <Button
            leftSection={<IconRefresh size={16} />}
            loading={refresh.isPending}
            disabled={url.trim().length === 0 || unsupported}
            onClick={() => refresh.mutate(url.trim())}
          >
            {t('Aktualizuj')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
