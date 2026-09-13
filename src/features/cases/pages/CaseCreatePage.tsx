import { Anchor, Group, Paper, Stack, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconChevronLeft } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { createCase } from '../../../api/cases'
import type { CaseFields } from '../../../api/types'
import { t } from '../../../i18n'
import { CaseForm } from '../components/CaseForm'

export function CaseCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (fields: CaseFields) => createCase(fields),
    onSuccess: async ({ case: created }) => {
      // The shelf and the system list both changed.
      await queryClient.invalidateQueries({ queryKey: ['cases'] })
      await queryClient.invalidateQueries({ queryKey: ['case-systems'] })
      notifications.show({ color: 'teal', message: `Dodano „${created.name}"` })
      navigate(`/cases/${created.id}`, { replace: true })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  return (
    <Stack gap="md" maw={720}>
      <Group gap={4}>
        <Anchor component={Link} to="/cases" size="sm" c="dimmed">
          <Group gap={2} wrap="nowrap">
            <IconChevronLeft size={14} />
            {t('Skrzynki')}
          </Group>
        </Anchor>
      </Group>

      <Title order={2}>{t('Nowa skrzynka')}</Title>

      <Paper withBorder p="lg" radius="md">
        <CaseForm
          onCancel={() => navigate('/cases')}
          onSubmit={(fields) => mutation.mutate(fields)}
          pending={mutation.isPending}
          submitLabel="Zapisz"
        />
      </Paper>
    </Stack>
  )
}
