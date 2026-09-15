import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPencil, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { createAddress, deleteAddress, fetchAddresses, updateAddress } from '../../../api/addresses'
import { hasCode } from '../../../api/client'
import type { Address, AddressFields } from '../../../api/types'
import { COUNTS, t, tCount } from '../../../i18n'
import { useSession } from '../../../session/SessionContext'
import { AddressDot } from '../components/AddressDot'
import { AddressForm } from '../components/AddressForm'
import { addressContents, addressLine } from '../presentation'

const PAGE_SIZE = 500

// The places the kit is kept. A small screen, like the makers: a place is a
// name, an address and a count of what is standing there, and the count is the
// reason to look — it answers "where is the kit" and "which of these is empty".
export function AddressesPage() {
  const queryClient = useQueryClient()
  const { can } = useSession()
  const canEdit = can('catalog.write')

  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const applySearch = useDebouncedCallback((value: string) => setSearch(value.trim() || null), 300)

  const [editing, setEditing] = useState<null | Address>(null)
  const [creating, create] = useDisclosure(false)
  const [confirming, setConfirming] = useState<null | Address>(null)

  const query = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchAddresses({ limit: PAGE_SIZE, offset: 0, search, sort: 'name' }),
    queryKey: ['addresses', { limit: PAGE_SIZE, search, sort: 'name' }],
  })

  // Everything that can change a place changes what a picker offers and what
  // the tool and organizer screens show beside a card, so all three go.
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['addresses'] })
    await queryClient.invalidateQueries({ queryKey: ['tools'] })
    await queryClient.invalidateQueries({ queryKey: ['organizers'] })
  }

  const save = useMutation({
    mutationFn: (fields: AddressFields) =>
      editing ? updateAddress(editing.id, fields) : createAddress(fields),
    onSuccess: async () => {
      setEditing(null)
      create.close()
      await refresh()
    },
  })

  const remove = useMutation({
    mutationFn: (address: Address) => deleteAddress(address.id),
    onSuccess: async (answer) => {
      setConfirming(null)
      const lost = answer.cleared.tools + answer.cleared.organizers
      notifications.show({
        color: 'green',
        message:
          lost === 0
            ? t('Adres usunięty.')
            : t('Adres usunięty. {n} pozycji straciło lokalizację.', { n: lost }),
      })
      await refresh()
    },
  })

  const nameTaken = hasCode(save.error, 'ADDRESS_NAME_TAKEN') ? save.error.message : null
  const items = query.data?.items ?? []

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start" gap="sm">
        <Stack gap={4}>
          <Title order={2}>{t('Adresy')}</Title>
          <Text c="dimmed" size="sm">
            {t('Miejsca, w których stoi sprzęt: magazyn, plac, budowa.')}
          </Text>
        </Stack>

        {canEdit ? (
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => {
              setEditing(null)
              save.reset()
              create.open()
            }}
          >
            {t('Dodaj adres')}
          </Button>
        ) : null}
      </Group>

      <TextInput
        placeholder={t('Szukaj po nazwie, mieście, ulicy…')}
        leftSection={<IconSearch size={16} />}
        value={searchText}
        onChange={(event) => {
          setSearchText(event.currentTarget.value)
          applySearch(event.currentTarget.value)
        }}
      />

      {query.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : query.isError ? (
        <Alert color="red" variant="light" title={t('Nie udało się wczytać adresów')}>
          {(query.error as Error)?.message ?? t('Nieznany błąd')}
        </Alert>
      ) : items.length === 0 ? (
        <Alert variant="light" title={t('Nie ma jeszcze żadnego adresu')}>
          {t('Dodaj pierwsze miejsce, a potem przypiszesz do niego narzędzia i organizery.')}
        </Alert>
      ) : (
        <SimpleGrid cols={{ base: 1, lg: 3, sm: 2 }} spacing="md">
          {items.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              canEdit={canEdit}
              onDelete={() => setConfirming(address)}
              onEdit={() => {
                save.reset()
                setEditing(address)
              }}
            />
          ))}
        </SimpleGrid>
      )}

      <Modal
        opened={creating || editing !== null}
        onClose={() => {
          setEditing(null)
          create.close()
        }}
        title={editing ? t('Edytuj adres') : t('Nowy adres')}
        centered
      >
        <Stack gap="md">
          {nameTaken ? (
            <Alert color="red" variant="light">
              {nameTaken}
            </Alert>
          ) : null}

          <AddressForm
            // Remounted per address, so opening a second one does not show the
            // first one's values.
            key={editing?.id ?? 'new'}
            initialValues={editing ? toFields(editing) : undefined}
            onCancel={() => {
              setEditing(null)
              create.close()
            }}
            onSubmit={(fields) => save.mutate(fields)}
            pending={save.isPending}
            submitLabel={editing ? t('Zapisz zmiany') : t('Dodaj')}
          />
        </Stack>
      </Modal>

      <Modal
        opened={confirming !== null}
        onClose={() => setConfirming(null)}
        title={t('Usunąć adres?')}
        centered
      >
        {confirming ? (
          <Stack gap="md">
            <Text size="sm">
              {t('Miejsce „{name}” zniknie z listy.', { name: confirming.name })}
            </Text>

            {/* The number is the point of this dialog. Deleting a place reads
                like tidying up, and forty cards quietly losing their location
                does not — so it is said before anybody agrees, not after. */}
            {addressContents(confirming).empty ? (
              <Text size="sm" c="dimmed">
                {t('Nic tu nie stoi.')}
              </Text>
            ) : (
              <Alert color="amber" variant="light">
                {t('{things} stracą lokalizację. Zostaną w katalogu.', {
                  things: contentsText(confirming),
                })}
              </Alert>
            )}

            <Group justify="flex-end" gap="sm">
              <Button variant="default" onClick={() => setConfirming(null)}>
                {t('Anuluj')}
              </Button>
              <Button
                color="red"
                loading={remove.isPending}
                onClick={() => remove.mutate(confirming)}
              >
                {t('Usuń')}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  )
}

function AddressCard({
  address,
  canEdit,
  onDelete,
  onEdit,
}: {
  address: Address
  canEdit: boolean
  onDelete: () => void
  onEdit: () => void
}) {
  const line = addressLine(address)
  const contents = addressContents(address)

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
          <Group gap="xs" wrap="nowrap">
            <AddressDot color={address.color} size={16} />
            <Text fw={600}>{address.name}</Text>
          </Group>

          {canEdit ? (
            <Group gap={2} wrap="nowrap">
              <ActionIcon variant="subtle" aria-label={t('Edytuj')} onClick={onEdit}>
                <IconPencil size={16} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red" aria-label={t('Usuń')} onClick={onDelete}>
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          ) : null}
        </Group>

        {line ? (
          <Text size="sm" c="dimmed">
            {line}
          </Text>
        ) : null}

        <Group gap="xs">
          {contents.empty ? (
            <Badge variant="default" color="gray">
              {t('Pusto')}
            </Badge>
          ) : (
            <>
              {/* A link rather than a number: the count is only interesting
                  because of what it stands for, and this is the way there. */}
              {contents.tools > 0 ? (
                <Badge
                  component={Link}
                  to={`/?addressId=${address.id}`}
                  variant="light"
                  style={{ cursor: 'pointer' }}
                >
                  {tCount(COUNTS.tool, contents.tools)}
                </Badge>
              ) : null}
              {contents.organizers > 0 ? (
                <Badge variant="light" color="amber">
                  {t('{n} organizerów', { n: contents.organizers })}
                </Badge>
              ) : null}
            </>
          )}
        </Group>

        {address.notes ? (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {address.notes}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}

function contentsText(address: Address): string {
  const contents = addressContents(address)
  const parts: string[] = []

  if (contents.tools > 0) parts.push(tCount(COUNTS.tool, contents.tools))
  if (contents.organizers > 0) parts.push(t('{n} organizerów', { n: contents.organizers }))

  return parts.join(', ')
}

function toFields(address: Address): AddressFields {
  return {
    building: address.building,
    city: address.city,
    color: address.color,
    name: address.name,
    notes: address.notes,
    postalCode: address.postalCode,
    street: address.street,
    unit: address.unit,
  }
}
