import { Group, Select } from '@mantine/core'
import { IconMapPin } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'

import { fetchAddresses } from '../../../api/addresses'
import { t } from '../../../i18n'
import { addressSummary } from '../presentation'
import { AddressDot } from './AddressDot'

// Choosing where a thing is kept. A select rather than the search-and-grid
// pickers a case or a tool gets: a workshop has a handful of places and they
// are read whole, so a dialog to find one among five would be ceremony.
//
// Clearable, and that clears to null rather than to an empty string — "nobody
// has said" is a real state and the column holds it.
export function AddressSelect({
  disabled,
  label,
  onChange,
  value,
}: {
  disabled?: boolean
  label?: string
  onChange: (addressId: null | number) => void
  value: null | number
}) {
  // The whole list, because it is short. Shared cache key with the addresses
  // screen, so opening a form after visiting it costs nothing.
  const query = useQuery({
    queryFn: () => fetchAddresses({ limit: 500, offset: 0, search: null, sort: 'name' }),
    queryKey: ['addresses', { limit: 500, search: null, sort: 'name' }],
  })

  const data = query.data?.items ?? []
  const chosen = data.find((address) => address.id === value) ?? null

  return (
    <Select
      label={label ?? t('Miejsce')}
      placeholder={
        query.isPending
          ? t('Wczytywanie…')
          : data.length === 0
            ? t('Brak adresów')
            : t('Nie podano')
      }
      data={data.map((address) => ({
        label: addressSummary(address),
        value: String(address.id),
      }))}
      // The colour beside the chosen place, so a form shows the same mark the
      // list and the card do. The options carry it through renderOption below.
      leftSection={chosen ? <AddressDot color={chosen.color} /> : <IconMapPin size={16} />}
      renderOption={({ option }) => {
        const address = data.find((item) => String(item.id) === option.value)
        return (
          <Group gap={8} wrap="nowrap">
            <AddressDot color={address?.color ?? ''} />
            <span>{option.label}</span>
          </Group>
        )
      }}
      value={value === null ? null : String(value)}
      // An empty select is null, not 0: the API tells "not set" from "set to
      // nothing" and so does the column behind it.
      onChange={(next) => onChange(next === null || next === '' ? null : Number(next))}
      disabled={disabled || (data.length === 0 && !query.isPending)}
      clearable
      searchable={data.length > 8}
      nothingFoundMessage={t('Nic nie pasuje')}
    />
  )
}
