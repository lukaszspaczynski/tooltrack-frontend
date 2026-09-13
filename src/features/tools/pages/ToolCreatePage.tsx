import { Anchor, Group, Paper, Stack, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconChevronLeft } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '../../../api/client'
import { createTool } from '../../../api/tools'
import type { ToolFields } from '../../../api/types'
import { t } from '../../../i18n'
import { ToolForm } from '../components/ToolForm'

export function ToolCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (fields: ToolFields) => createTool(fields),
    onSuccess: async ({ tool }) => {
      // The list and the category list both changed.
      await queryClient.invalidateQueries({ queryKey: ['tools'] })
      await queryClient.invalidateQueries({ queryKey: ['tool-categories'] })
      notifications.show({ color: 'teal', message: `Dodano „${tool.name}"` })
      navigate(`/tools/${tool.id}`, { replace: true })
    },
    onError: (error) => {
      // 409 is shown on the serial number field instead; anything else is a
      // toast, because there is no field to attach it to.
      if (error instanceof ApiError && error.status === 409) return
      notifications.show({ color: 'red', message: (error as Error).message })
    },
  })

  // Narrowed into a string here rather than at the call site: the check and
  // the message have to come from the same read of the error.
  const serialConflict =
    mutation.error instanceof ApiError && mutation.error.status === 409
      ? mutation.error.message
      : null

  return (
    <Stack gap="md" maw={720}>
      <Group gap={4}>
        <Anchor component={Link} to="/" size="sm" c="dimmed">
          <Group gap={2} wrap="nowrap">
            <IconChevronLeft size={14} />
            {t('Katalog')}
          </Group>
        </Anchor>
      </Group>

      <Title order={2}>{t('Nowe narzędzie')}</Title>

      <Paper withBorder p="lg" radius="md">
        <ToolForm
          onCancel={() => navigate('/')}
          onSubmit={(fields) => mutation.mutate(fields)}
          pending={mutation.isPending}
          serialNumberError={serialConflict}
          submitLabel="Zapisz"
        />
      </Paper>
    </Stack>
  )
}
