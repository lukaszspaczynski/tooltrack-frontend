import {
  Alert,
  Button,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createOrganizer, fetchOrganizers } from '../../../api/organizers'
import type { OrganizerFields } from '../../../api/types'
import { t } from '../../../i18n'
import { useSession } from '../../../session/SessionContext'
import { OrganizerCard } from '../components/OrganizerCard'
import { OrganizerWizard } from '../components/OrganizerWizard'

// The shelf of arrangements. Reading only: everything that changes one lives
// on its own page, so a gloved thumb scrolling past cannot delete anything.
export function OrganizersPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { can } = useSession()
  const canEdit = can('catalog.write')

  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const applySearch = useDebouncedCallback((value: string) => setSearch(value.trim() || null), 300)

  const [wizardOpen, wizard] = useDisclosure(false)

  const organizers = useQuery({
    queryKey: ['organizers', search],
    queryFn: () => fetchOrganizers({ caseId: null, limit: 100, offset: 0, search }),
    placeholderData: keepPreviousData,
  })

  const create = useMutation({
    mutationFn: (fields: OrganizerFields) => createOrganizer(fields),
    onSuccess: async ({ organizer }) => {
      await queryClient.invalidateQueries({ queryKey: ['organizers'] })
      await queryClient.invalidateQueries({ queryKey: ['organizer-item-picker'] })
      wizard.close()
      notifications.show({
        color: 'teal',
        message: t('Utworzono organizer {number}', { number: organizer.number }),
      })
      // Straight to the new one: the reason to create it is to look at it.
      navigate(`/organizers/${organizer.id}`)
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const items = organizers.data?.items ?? []

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={0}>
          <Title order={2}>{t('Organizer')}</Title>
          <Text c="dimmed" size="sm">
            {t('Co leży w której skrzynce')}
          </Text>
        </Stack>

        {canEdit ? (
          <Button leftSection={<IconPlus size={18} />} onClick={wizard.open}>
            {t('Nowy organizer')}
          </Button>
        ) : null}
      </Group>

      <TextInput
        label={t('Szukaj')}
        placeholder={t('Nazwa organizera, opis, skrzynka…')}
        leftSection={<IconSearch size={16} />}
        value={searchText}
        onChange={(event) => {
          setSearchText(event.currentTarget.value)
          applySearch(event.currentTarget.value)
        }}
        maw={420}
      />

      {organizers.isError ? (
        <Alert color="red" variant="light" title={t('Nie udało się wczytać organizerów')}>
          {(organizers.error as Error).message}
        </Alert>
      ) : null}

      {organizers.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {organizers.data && items.length === 0 ? (
        <Alert color="gray" variant="light">
          {search
            ? t('Nic nie pasuje do tego wyszukiwania.')
            : t('Nie ma jeszcze żadnego organizera. Zacznij od wybrania skrzynki.')}
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="md">
        {items.map((item) => (
          <OrganizerCard key={item.id} item={item} />
        ))}
      </SimpleGrid>

      {/* Mounted per opening, like the other modals: a wizard that kept its
          half-finished choices between visits would create the wrong thing. */}
      {canEdit && wizardOpen ? (
        <OrganizerWizard
          opened
          onClose={wizard.close}
          onCreate={(fields) => create.mutate(fields)}
          saving={create.isPending}
        />
      ) : null}
    </Stack>
  )
}
