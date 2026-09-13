import {
  ActionIcon,
  Alert,
  Button,
  Badge,
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconTrash } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { deleteUser, fetchUsers, updateUser } from '../../../api/users'
import type { ManagedUser, Role } from '../../../api/types'
import { t } from '../../../i18n'
import { useSession } from '../../../session/SessionContext'
import { ROLE_DESCRIPTIONS, roleOptions } from '../../tools/presentation'

export function UsersPage() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  const [pendingDelete, setPendingDelete] = useState<null | ManagedUser>(null)
  const [confirmOpen, confirm] = useDisclosure(false)

  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers })

  const patch = useMutation({
    mutationFn: ({ id, ...changes }: { id: number; role?: Role; status?: 'active' | 'disabled' }) =>
      updateUser(id, changes),
    onSuccess: async ({ user }) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      notifications.show({ color: 'teal', message: `Zapisano zmiany dla ${user.email}` })
    },
    // The API refuses two things this screen can ask for — changing your own
    // role, and removing the last active admin — and its message says which.
    // Repeating that message is better than inventing a second wording.
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      notifications.show({ color: 'teal', message: t('Konto usunięte') })
      confirm.close()
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  if (users.isPending) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    )
  }

  if (users.isError) {
    return (
      <Alert color="red" variant="light" title={t('Nie udało się wczytać użytkowników')}>
        {(users.error as Error).message}
      </Alert>
    )
  }

  return (
    <Stack gap="md">
      <Stack gap={0}>
        <Title order={2}>{t('Użytkownicy')}</Title>
        <Text c="dimmed" size="sm">
          {t('Nowe konta dostają rolę Podgląd. Rolę i dostęp zmieniasz tutaj.')}
        </Text>
      </Stack>

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={640}>
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('Konto')}</Table.Th>
                <Table.Th w={200}>{t('Rola')}</Table.Th>
                <Table.Th w={130}>{t('Aktywne')}</Table.Th>
                <Table.Th w={60} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.data.users.map((user) => {
                const self = user.id === session?.user.id

                return (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Stack gap={0}>
                        <Group gap="xs">
                          <Text fw={600} size="sm">
                            {user.displayName || user.email}
                          </Text>
                          {self ? (
                            <Badge size="xs" variant="light">
                              to Ty
                            </Badge>
                          ) : null}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {user.email}
                        </Text>
                      </Stack>
                    </Table.Td>

                    <Table.Td>
                      <Tooltip
                        label={
                          self
                            ? t('Własnej roli nie zmienisz — poproś innego administratora')
                            : t(ROLE_DESCRIPTIONS[user.role])
                        }
                        multiline
                        w={240}
                      >
                        <Select
                          size="sm"
                          data={roleOptions()}
                          value={user.role}
                          allowDeselect={false}
                          disabled={self || patch.isPending}
                          onChange={(value) =>
                            value && patch.mutate({ id: user.id, role: value as Role })
                          }
                        />
                      </Tooltip>
                    </Table.Td>

                    <Table.Td>
                      <Switch
                        checked={user.status === 'active'}
                        disabled={self || patch.isPending}
                        onChange={(event) =>
                          patch.mutate({
                            id: user.id,
                            status: event.currentTarget.checked ? 'active' : 'disabled',
                          })
                        }
                        label={user.status === 'active' ? 'Tak' : 'Nie'}
                      />
                    </Table.Td>

                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={t('Usuń konto {email}', { email: user.email })}
                        disabled={self}
                        onClick={() => {
                          setPendingDelete(user)
                          confirm.open()
                        }}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal opened={confirmOpen} onClose={confirm.close} title={t('Usunąć konto?')} centered>
        <Stack gap="md">
          <Text size="sm">
            {t('Konto {email} straci dostęp. Karty narzędzi, które dodało, zostają w katalogu.', {
              email: pendingDelete?.email ?? '',
            })}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={confirm.close}>
              {t('Anuluj')}
            </Button>
            <Button
              color="red"
              loading={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              {t('Usuń konto')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
