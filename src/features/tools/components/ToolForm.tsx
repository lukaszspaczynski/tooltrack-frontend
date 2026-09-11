import {
  Anchor,
  Autocomplete,
  Button,
  Group,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { fetchBrands } from '../../../api/brands'
import { fetchCategories } from '../../../api/tools'
import type { ToolFields } from '../../../api/types'
import { conditionOptions } from '../presentation'

const EMPTY: ToolFields = {
  brand: '',
  category: '',
  condition: 'good',
  model: '',
  name: '',
  notes: '',
  serialNumber: '',
}

export type ToolFormProps = {
  initialValues?: ToolFields
  onCancel: () => void
  onSubmit: (fields: ToolFields) => void
  pending: boolean
  submitLabel: string
  // A duplicate serial number comes back as a 409 from the API. It belongs on
  // the field that caused it, not in a toast that disappears while the person
  // is still looking for what to change.
  serialNumberError?: null | string
}

export function ToolForm({
  initialValues,
  onCancel,
  onSubmit,
  pending,
  serialNumberError,
  submitLabel,
}: ToolFormProps) {
  const form = useForm<ToolFields>({
    mode: 'uncontrolled',
    initialValues: initialValues ?? EMPTY,
    validate: {
      name: (value) => (value.trim() ? null : 'Nazwa jest wymagana'),
    },
  })

  // Categories come from the tools themselves, so the field suggests what is
  // already in use without forcing anyone to pick from a list. Typing a new one
  // is how a category gets created.
  const categories = useQuery({
    queryKey: ['tool-categories'],
    queryFn: fetchCategories,
    staleTime: 60_000,
  })

  // Makers are a table of their own, so this one picks from it rather than
  // being typed. A name that is only text points the card at no brand, which
  // is how the two used to drift apart.
  const brands = useQuery({
    queryKey: ['brands', null],
    queryFn: () => fetchBrands({ limit: 500, offset: 0, search: null, sort: 'name' }),
    staleTime: 60_000,
  })

  // A card written before this table existed can name a maker that is not in
  // it. Keeping that value as an option means editing the model number does
  // not silently blank the maker.
  const known = brands.data?.items.map((brand) => brand.name) ?? []
  const current = initialValues?.brand.trim() ?? ''
  const brandOptions = current && !known.includes(current) ? [...known, current] : known

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(trimAll(values)))}>
      <Stack gap="md">
        <TextInput
          label="Nazwa"
          placeholder="Młotowiertarka SDS"
          required
          data-autofocus
          key={form.key('name')}
          {...form.getInputProps('name')}
        />

        <Autocomplete
          label="Kategoria"
          placeholder="Wiertarki"
          data={categories.data?.categories.map((entry) => entry.category) ?? []}
          key={form.key('category')}
          {...form.getInputProps('category')}
        />

        <Group grow align="flex-start">
          <Select
            label="Marka"
            placeholder="Wybierz producenta"
            description={
              <>
                Nowego dodasz na ekranie{' '}
                <Anchor component={Link} to="/brands" size="xs">
                  Producenci
                </Anchor>
              </>
            }
            data={brandOptions}
            searchable
            clearable
            nothingFoundMessage="Nie ma takiego producenta"
            key={form.key('brand')}
            {...form.getInputProps('brand')}
          />
          <TextInput
            label="Model"
            placeholder="HR2470"
            key={form.key('model')}
            {...form.getInputProps('model')}
          />
        </Group>

        <Group grow align="flex-start">
          <TextInput
            label="Numer seryjny"
            placeholder="12345-AB"
            description="Musi być unikalny — dwa razy ten sam numer to duplikat karty"
            error={serialNumberError ?? undefined}
            key={form.key('serialNumber')}
            {...form.getInputProps('serialNumber')}
          />
          <Select
            label="Stan"
            data={conditionOptions()}
            allowDeselect={false}
            key={form.key('condition')}
            {...form.getInputProps('condition')}
          />
        </Group>

        <Textarea
          label="Notatki"
          placeholder="Szczotki do wymiany, walizka bez zamka…"
          autosize
          minRows={3}
          maxRows={8}
          key={form.key('notes')}
          {...form.getInputProps('notes')}
        />

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onCancel} type="button">
            Anuluj
          </Button>
          <Button type="submit" loading={pending}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

// The API trims anyway; doing it here means the value that gets sent is the
// value the person will see when the card comes back.
function trimAll(fields: ToolFields): ToolFields {
  return {
    ...fields,
    brand: fields.brand.trim(),
    category: fields.category.trim(),
    model: fields.model.trim(),
    name: fields.name.trim(),
    notes: fields.notes.trim(),
    serialNumber: fields.serialNumber.trim(),
  }
}
