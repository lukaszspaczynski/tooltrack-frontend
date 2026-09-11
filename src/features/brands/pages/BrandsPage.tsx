import {
  ActionIcon,
  Alert,
  ColorInput,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPencil,
  IconPhoto,
  IconPhotoOff,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  clearBrandLogo,
  createBrand,
  deleteBrand,
  fetchBrands,
  setBrandLogo,
  updateBrand,
} from '../../../api/brands'
import { apiFileUrl } from '../../../api/client'
import type { Brand, BrandFields } from '../../../api/types'
import { useSession } from '../../../session/SessionContext'
import { LogoPicker } from '../components/LogoPicker'

// The makers. A small screen on purpose: a brand is a name, a logo and a count
// of the tools that carry it, and the count is the reason to look.
export function BrandsPage() {
  const queryClient = useQueryClient()
  const { can } = useSession()
  const canEdit = can('catalog.write')

  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const applySearch = useDebouncedCallback((value: string) => setSearch(value.trim() || null), 300)

  const [editing, setEditing] = useState<null | Brand>(null)
  const [creating, create] = useDisclosure(false)
  const [pendingDelete, setPendingDelete] = useState<null | Brand>(null)
  const [logoFor, setLogoFor] = useState<null | Brand>(null)

  const brands = useQuery({
    queryKey: ['brands', search],
    queryFn: () => fetchBrands({ limit: 200, offset: 0, search, sort: 'name' }),
    placeholderData: keepPreviousData,
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['brands'] })
    // A rename rewrites the maker on its tools, so the catalog is stale too.
    await queryClient.invalidateQueries({ queryKey: ['tools'] })
  }

  const save = useMutation({
    mutationFn: ({ fields, id }: { fields: BrandFields; id: null | number }) =>
      id === null ? createBrand(fields) : updateBrand(id, fields),
    onSuccess: async () => {
      await refresh()
      setEditing(null)
      create.close()
      notifications.show({ color: 'teal', message: 'Zapisano' })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteBrand(id),
    onSuccess: async () => {
      await refresh()
      setPendingDelete(null)
      notifications.show({ color: 'teal', message: 'Marka usunięta' })
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const logo = useMutation({
    mutationFn: ({ id, photoId }: { id: number; photoId: null | number }) =>
      photoId === null ? clearBrandLogo(id) : setBrandLogo(id, photoId),
    onSuccess: async () => {
      await refresh()
      setLogoFor(null)
    },
    onError: (error) => notifications.show({ color: 'red', message: (error as Error).message }),
  })

  const items = brands.data?.items ?? []

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={0}>
          <Title order={2}>Producenci</Title>
          <Text c="dimmed" size="sm">
            Marki, które robią to, co mamy
          </Text>
        </Stack>

        {canEdit ? (
          <Button leftSection={<IconPlus size={18} />} onClick={create.open}>
            Dodaj markę
          </Button>
        ) : null}
      </Group>

      <TextInput
        label="Szukaj"
        placeholder="Nazwa marki…"
        leftSection={<IconSearch size={16} />}
        value={searchText}
        onChange={(event) => {
          setSearchText(event.currentTarget.value)
          applySearch(event.currentTarget.value)
        }}
        maw={420}
      />

      {brands.isError ? (
        <Alert color="red" variant="light" title="Nie udało się wczytać producentów">
          {(brands.error as Error).message}
        </Alert>
      ) : null}

      {brands.isPending ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {brands.data && items.length === 0 ? (
        <Alert color="gray" variant="light">
          {search ? 'Nic nie pasuje.' : 'Nie ma jeszcze żadnej marki.'}
        </Alert>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {items.map((brand) => (
          <Card
            key={brand.id}
            withBorder
            padding="md"
            radius="md"
            style={
              brand.color
                ? {
                    borderLeft: `4px solid ${brand.color}`,
                    paddingLeft: 'calc(var(--mantine-spacing-md) - 3px)',
                  }
                : undefined
            }
          >
            <Group wrap="nowrap" align="flex-start" gap="md">
              {brand.logoUrl ? (
                <Image
                  src={apiFileUrl(brand.logoUrl)}
                  alt={brand.name}
                  h={56}
                  w={56}
                  fit="contain"
                  radius="sm"
                />
              ) : (
                <Group h={56} w={56} justify="center" bg="var(--mantine-color-default)">
                  <IconPhotoOff size={18} color="var(--mantine-color-dimmed)" />
                </Group>
              )}

              <Stack gap={4} style={{ flexGrow: 1, minWidth: 0 }}>
                <Group justify="space-between" wrap="nowrap" align="flex-start" gap="xs">
                  <Text fw={600} lineClamp={2}>
                    {brand.name}
                  </Text>
                  {canEdit ? (
                    <Group gap={2} wrap="nowrap">
                      <Tooltip label={brand.logoUrl ? 'Zmień logo' : 'Ustaw logo'}>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label="Logo"
                          onClick={() => setLogoFor(brand)}
                        >
                          <IconPhoto size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edytuj">
                        <ActionIcon
                          variant="subtle"
                          aria-label="Edytuj markę"
                          onClick={() => setEditing(brand)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Usuń">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          aria-label="Usuń markę"
                          onClick={() => setPendingDelete(brand)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  ) : null}
                </Group>

                {/* The count is the reason this screen exists: it says which
                    makers the shed actually runs on. */}
                <Badge
                  component={Link}
                  to={`/?q=${encodeURIComponent(brand.name)}`}
                  variant="light"
                  size="sm"
                  style={{ cursor: 'pointer', width: 'fit-content' }}
                >
                  {toolCountLabel(brand.toolCount)}
                </Badge>

                {brand.notes ? (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {brand.notes}
                  </Text>
                ) : null}
              </Stack>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      {canEdit && (creating || editing) ? (
        <BrandForm
          brand={editing}
          onClose={() => {
            setEditing(null)
            create.close()
          }}
          onSave={(fields) => save.mutate({ fields, id: editing?.id ?? null })}
          saving={save.isPending}
        />
      ) : null}

      {canEdit && logoFor ? (
        <LogoPicker
          opened
          onClose={() => setLogoFor(null)}
          onPick={(photoId) => logo.mutate({ id: logoFor.id, photoId })}
          saving={logo.isPending}
        />
      ) : null}

      <Modal
        opened={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Usunąć markę?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Marka „{pendingDelete?.name}" zniknie z listy.{' '}
            {pendingDelete && pendingDelete.toolCount > 0
              ? `${toolCountLabel(pendingDelete.toolCount)} zostaną w katalogu i zachowają nazwę producenta jako tekst — stracą tylko powiązanie z tą pozycją.`
              : 'Żadne narzędzie jej nie używa.'}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setPendingDelete(null)}>
              Anuluj
            </Button>
            <Button
              color="red"
              loading={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              Usuń
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}

// Create and edit are the same two fields, so they are the same modal — mounted
// per opening, so it starts from the brand it was given.
function BrandForm({
  brand,
  onClose,
  onSave,
  saving,
}: {
  brand: null | Brand
  onClose: () => void
  onSave: (fields: BrandFields) => void
  saving: boolean
}) {
  const [name, setName] = useState(brand?.name ?? '')
  const [notes, setNotes] = useState(brand?.notes ?? '')
  const [color, setColor] = useState(brand?.color ?? '')

  return (
    <Modal opened onClose={onClose} title={brand ? 'Edytuj markę' : 'Nowa marka'} centered>
      <Stack gap="md">
        <TextInput
          label="Nazwa"
          placeholder="Makita"
          required
          data-autofocus
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        {/* The brand book gives this as three numbers and CSS wants hex; the
            server takes either, so the picker and a pasted "18 36 71" both
            work. */}
        <ColorInput
          label="Wiodący kolor"
          placeholder="#122447 albo 18 36 71"
          format="hex"
          value={color}
          onChange={setColor}
          swatches={['#122447', '#244930', '#f5d24a', '#3f6652', '#4b66a4', '#d0392a']}
        />

        <Textarea
          label="Notatki"
          placeholder="Serwis, przedstawiciel, cokolwiek warto pamiętać"
          autosize
          minRows={2}
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
        />

        {brand && brand.toolCount > 0 ? (
          <Text size="xs" c="dimmed">
            Zmiana nazwy poprawi ją też na {toolCountLabel(brand.toolCount)}.
          </Text>
        ) : null}

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={saving}>
            Anuluj
          </Button>
          <Button
            loading={saving}
            disabled={!name.trim()}
            onClick={() => onSave({ color: color.trim(), name: name.trim(), notes: notes.trim() })}
          >
            Zapisz
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// "3 narzędzia" is not "3 narzędzi". Polish picks a form by the last digits.
function toolCountLabel(count: number): string {
  const lastTwo = count % 100
  const last = count % 10

  if (count === 0) return 'brak narzędzi'
  if (count === 1) return '1 narzędzie'
  if (lastTwo >= 12 && lastTwo <= 14) return `${count} narzędzi`
  if (last >= 2 && last <= 4) return `${count} narzędzia`
  return `${count} narzędzi`
}
