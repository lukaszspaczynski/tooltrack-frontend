import {
  SegmentedControl,
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
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { fetchBrands } from '../../../api/brands'
import { fetchCategories } from '../../../api/items'
import type { ItemFields, ItemKind } from '../../../api/types'
import { AddressSelect } from '../../addresses/components/AddressSelect'
import { t } from '../../../i18n'
import { conditionOptions } from '../presentation'

const EMPTY: ItemFields = {
  addressId: null,
  brandId: null,
  kind: 'tool',
  category: '',
  condition: 'good',
  model: '',
  name: '',
  notes: '',
  referenceUrl: '',
  serialNumber: '',
}

export type ToolFormProps = {
  initialValues?: ItemFields
  onCancel: () => void
  onSubmit: (fields: ItemFields) => void
  pending: boolean
  submitLabel: string
  // A duplicate serial number comes back as a 409 from the API. It belongs on
  // the field that caused it, not in a toast that disappears while the person
  // is still looking for what to change.
  serialNumberError?: null | string
}

export function ItemForm({
  initialValues,
  onCancel,
  onSubmit,
  pending,
  serialNumberError,
  submitLabel,
}: ToolFormProps) {
  const form = useForm<ItemFields>({
    mode: 'uncontrolled',
    initialValues: initialValues ?? EMPTY,
    validate: {
      name: (value) => (value.trim() ? null : t('Nazwa jest wymagana')),
    },
  })

  // Its own state, merged at submit. The form is uncontrolled, so
  // setFieldValue writes the value and renders nothing — the select would keep
  // showing the old place while holding the new one.
  const [addressId, setAddressId] = useState(initialValues?.addressId ?? null)
  // Their own state and merged at submit, like the place below. The form is
  // uncontrolled, so setFieldValue writes the value and renders nothing.
  const [brandId, setBrandId] = useState(initialValues?.brandId ?? null)
  const [kind, setKind] = useState<ItemKind>(initialValues?.kind ?? 'tool')

  // Categories come from the items themselves, so the field suggests what is
  // already in use without forcing anyone to pick from a list. Typing a new one
  // is how a category gets created.
  const categories = useQuery({
    queryKey: ['item-categories'],
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
  // Ids rather than names. The maker is a row a card points at, so a card that
  // named one by string and a card that pointed at it were two different facts
  // to keep in step; the value here is the fact.
  const brandOptions = (brands.data?.items ?? []).map((brand) => ({
    label: brand.name,
    value: String(brand.id),
  }))

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        onSubmit(trimAll({ ...values, addressId, brandId, kind })),
      )}
    >
      <Stack gap="md">
        <TextInput
          label={t('Nazwa')}
          placeholder={t('Młotowiertarka SDS')}
          required
          data-autofocus
          key={form.key('name')}
          {...form.getInputProps('name')}
        />

        {/* What sort of thing this is, which is not the same question as the
            category: a category is your own word for a shelf, this is the three
            sorts the catalog behaves differently about. Only a tool goes in an
            organizer, and only a case has places for labels; the server refuses
            the rest, with ITEM_IS_NOT_A_TOOL and ITEM_IS_NOT_A_CASE.

            A box is here rather than on a screen of its own. It was one while
            it was a table of its own, and this is the same form it would have
            been given: a name, a maker, a model and a note. */}
        <SegmentedControl
          fullWidth
          data={[
            { label: t('Narzędzie'), value: 'tool' },
            { label: t('RTV/AGD'), value: 'appliance' },
            { label: t('Skrzynka'), value: 'case' },
          ]}
          value={kind}
          onChange={(next) => setKind(next as ItemKind)}
        />

        <Autocomplete
          label={t('Kategoria')}
          placeholder="Wiertarki"
          data={categories.data?.categories.map((entry) => entry.category) ?? []}
          key={form.key('category')}
          {...form.getInputProps('category')}
        />

        <Group grow align="flex-start">
          <Select
            label={t('Marka')}
            placeholder={t('Wybierz producenta')}
            description={
              <>
                Nowego dodasz na ekranie{' '}
                <Anchor component={Link} to="/brands" size="xs">
                  {t('Producenci')}
                </Anchor>
              </>
            }
            data={brandOptions}
            searchable
            clearable
            nothingFoundMessage={t('Nie ma takiego producenta')}
            value={brandId === null ? null : String(brandId)}
            onChange={(next) => setBrandId(next === null || next === '' ? null : Number(next))}
          />
          <TextInput
            label={t('Model')}
            placeholder="HR2470"
            key={form.key('model')}
            {...form.getInputProps('model')}
          />
        </Group>

        <Group grow align="flex-start">
          <TextInput
            label={t('Numer seryjny')}
            placeholder="12345-AB"
            description={t('Musi być unikalny — dwa razy ten sam numer to duplikat karty')}
            error={serialNumberError ?? undefined}
            key={form.key('serialNumber')}
            {...form.getInputProps('serialNumber')}
          />
          <Select
            label={t('Stan')}
            data={conditionOptions()}
            allowDeselect={false}
            key={form.key('condition')}
            {...form.getInputProps('condition')}
          />
        </Group>

        <Textarea
          label={t('Notatki')}
          placeholder={t('Szczotki do wymiany, walizka bez zamka…')}
          autosize
          minRows={3}
          maxRows={8}
          key={form.key('notes')}
          {...form.getInputProps('notes')}
        />

        {/* Where it is kept. Beside the notes rather than among the maker and
            the model: those say what the item is, this says where to go and
            get it. */}
        <AddressSelect value={addressId} onChange={setAddressId} />

        {/* An import fills this in, and typing it here is what gives a card
            written by hand the same three things: the update button, the
            manuals the maker publishes, and pictures from the page itself. */}
        <TextInput
          label={t('Strona producenta')}
          placeholder="https://…"
          type="url"
          key={form.key('referenceUrl')}
          {...form.getInputProps('referenceUrl')}
        />

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={onCancel} type="button">
            {t('Anuluj')}
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
function trimAll(fields: ItemFields): ItemFields {
  return {
    ...fields,
    category: fields.category.trim(),
    model: fields.model.trim(),
    name: fields.name.trim(),
    notes: fields.notes.trim(),
    referenceUrl: fields.referenceUrl.trim(),
    serialNumber: fields.serialNumber.trim(),
  }
}
