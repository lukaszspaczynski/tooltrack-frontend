import { Alert, Button, Group, List, Modal, Stack, Text, TextInput } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconDownload } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { importCase } from '../../../api/cases'
import { ApiError } from '../../../api/client'
import { COUNTS, t, tCount } from '../../../i18n'
import { isKnownCaseSource, useCaseImportSources } from '../useCaseImportSources'

// Making a case out of a maker's product page: paste the address, and the box
// arrives with its measurements and its photographs already on it.
//
// The dialog says which pages it can read before asking for anything, because
// the answer to "why was my link refused" should be on the screen that refused
// it. The list is the cases one, not the items one — a page that sells drills
// has nothing to say about a box.
export function ImportCaseModal({ onClose, opened }: { onClose: () => void; opened: boolean }) {
  const [url, setUrl] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { sources: known } = useCaseImportSources(opened)
  const unsupported = url.trim().length > 0 && known.length > 0 && !isKnownCaseSource(url, known)

  const run = useMutation({
    mutationFn: importCase,
    onSuccess: async ({ case: imported, imported: outcome }) => {
      queryClient.setQueryData(['case', imported.id], { case: imported })
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
      await queryClient.invalidateQueries({ queryKey: ['case-systems'] })

      notifications.show({
        color: 'teal',
        message: t('Zaimportowano skrzynkę: {photos}', {
          photos: tCount(COUNTS.photo, outcome.photos),
        }),
      })

      // Straight to the case: the point of importing is to look at what came in
      // and add the label slots, which no page can know about.
      setUrl('')
      onClose()
      navigate(`/cases/${imported.id}`)
    },
    onError: (error) =>
      notifications.show({
        color: 'red',
        message:
          error instanceof ApiError ? error.message : t('Nie udało się zaimportować skrzynki'),
      }),
  })

  return (
    <Modal opened={opened} onClose={onClose} title={t('Importuj ze strony producenta')} centered>
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
          error={unsupported ? t('To źródło nie jest obsługiwane') : null}
          onChange={(event) => setUrl(event.currentTarget.value)}
        />

        <Alert icon={<IconAlertTriangle size={16} />} color="gray" variant="light">
          {t('Miejsca na etykiety trzeba dodać samodzielnie — strona producenta ich nie zna.')}
        </Alert>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('Anuluj')}
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
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
