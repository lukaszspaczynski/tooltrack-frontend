import { Anchor, Group, Paper, Stack, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconChevronLeft } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { createItem } from '../../../api/items'
import { t } from '../../../i18n'
import { CaseForm, type CaseFields } from '../components/CaseForm'

export function CaseCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    // A box is a card of kind `case`. The fields this form does not ask about
    // are the ones that are a question about a machine rather than about a box:
    // a serial number, a category, a condition, a place.
    mutationFn: (fields: CaseFields) =>
      createItem({
        ...fields,
        addressId: null,
        category: '',
        condition: 'good',
        kind: 'case',
        serialNumber: '',
      }),
    onSuccess: async ({ item: created }) => {
      // The shelf, the catalog and the model list all changed — the boxes are
      // in the catalog too.
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['item-models', 'case'] })
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
