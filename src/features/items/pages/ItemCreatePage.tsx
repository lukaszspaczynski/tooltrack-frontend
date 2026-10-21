import { Anchor, Group, Paper, Stack, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IconChevronLeft } from '@tabler/icons-react'
import { Link, useNavigate } from 'react-router-dom'

import { hasCode } from '../../../api/client'
import { createItem } from '../../../api/items'
import type { ItemFields } from '../../../api/types'
import { t } from '../../../i18n'
import { ItemForm } from '../components/ItemForm'

export function ItemCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (fields: ItemFields) => createItem(fields),
    onSuccess: async ({ item }) => {
      // The list and the category list both changed.
      await queryClient.invalidateQueries({ queryKey: ['items'] })
      await queryClient.invalidateQueries({ queryKey: ['item-categories'] })
      notifications.show({ color: 'teal', message: t('Dodano „{name}"', { name: item.name }) })
      navigate(`/items/${item.id}`, { replace: true })
    },
    onError: (error) => {
      // A taken serial number is shown on the field instead; anything else is a
      // toast, because there is no field to attach it to.
      if (hasCode(error, 'SERIAL_NUMBER_TAKEN')) return
      notifications.show({ color: 'red', message: (error as Error).message })
    },
  })

  // Narrowed into a string here rather than at the call site: the check and
  // the message have to come from the same read of the error.
  const serialConflict = hasCode(mutation.error, 'SERIAL_NUMBER_TAKEN')
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
        <ItemForm
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
