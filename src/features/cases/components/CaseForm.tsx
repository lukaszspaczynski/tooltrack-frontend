import { Autocomplete, Button, Group, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchBrands } from '../../../api/brands'
import { fetchModels } from '../../../api/cases'
import type { CaseFields } from '../../../api/types'
import { t } from '../../../i18n'

const EMPTY: CaseFields = {
  brandId: null,
  name: '',
  notes: '',
  referenceUrl: '',
  model: '',
}

export type CaseFormProps = {
  initialValues?: CaseFields
  onCancel: () => void
  onSubmit: (fields: CaseFields) => void
  pending: boolean
  submitLabel: string
}

// What a box is called, who makes it, and what it stacks with.
//
// Everything a spec sheet states — the six measurements, the diagonal, the
// capacity, the load, the barcode, the catalogue number — is a parameter now,
// added below this form one at a time in the panel that already existed for
// exactly that. So there are no measurement inputs here any more, and a box
// that states a twelfth thing needs no field added for it.
export function CaseForm({
  initialValues,
  onCancel,
  onSubmit,
  pending,
  submitLabel,
}: CaseFormProps) {
  const form = useForm<CaseFields>({
    initialValues: initialValues ?? EMPTY,
    validate: {
      name: (value) => (value.trim() ? null : t('Nazwa jest wymagana')),
    },
  })

  // Its own state, merged at submit: a Select writes a string and the field is
  // an id, and the maker is a row this box points at rather than a name on it.
  const [brandId, setBrandId] = useState(initialValues?.brandId ?? null)

  const brands = useQuery({
    queryFn: () => fetchBrands({ limit: 500, offset: 0, search: null, sort: 'name' }),
    queryKey: ['brands', null],
    staleTime: 60_000,
  })

  const models = useQuery({
    queryFn: fetchModels,
    queryKey: ['case-models'],
    staleTime: 60_000,
  })

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(trimAll({ ...values, brandId })))}>
      <Stack gap="md">
        <TextInput
          label={t('Nazwa')}
          placeholder="Qbrick System PRO Toolbox 2.0"
          withAsterisk
          data-autofocus
          key={form.key('name')}
          {...form.getInputProps('name')}
        />

        <Group grow align="flex-start">
          <Select
            label={t('Producent')}
            placeholder={t('Wybierz producenta')}
            data={(brands.data?.items ?? []).map((brand) => ({
              label: brand.name,
              value: String(brand.id),
            }))}
            searchable
            clearable
            nothingFoundMessage={t('Nie ma takiego producenta')}
            value={brandId === null ? null : String(brandId)}
            onChange={(next) => setBrandId(next === null || next === '' ? null : Number(next))}
          />
          {/* Free text on purpose: which modular range a box stacks with is not
              a list that is ours to close. */}
          <Autocomplete
            label="Model"
            placeholder="PRO"
            data={models.data?.models.map((entry) => entry.model) ?? []}
            key={form.key('model')}
            {...form.getInputProps('model')}
          />
        </Group>

        <TextInput
          label={t('Strona producenta')}
          placeholder="https://…"
          type="url"
          key={form.key('referenceUrl')}
          {...form.getInputProps('referenceUrl')}
        />

        <Textarea
          label={t('Notatki')}
          placeholder={t('Co jest w środku, gdzie stoi, co się w niej zepsuło…')}
          autosize
          minRows={3}
          key={form.key('notes')}
          {...form.getInputProps('notes')}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onCancel} disabled={pending}>
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
// value the person will see when the box comes back.
function trimAll(fields: CaseFields): CaseFields {
  return {
    brandId: fields.brandId,
    name: fields.name.trim(),
    notes: fields.notes.trim(),
    referenceUrl: fields.referenceUrl.trim(),
    model: fields.model.trim(),
  }
}
