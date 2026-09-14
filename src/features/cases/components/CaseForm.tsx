import {
  Autocomplete,
  Button,
  Fieldset,
  Group,
  NumberInput,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useQuery } from '@tanstack/react-query'

import { fetchSystems } from '../../../api/cases'
import type { CaseFields } from '../../../api/types'
import { t } from '../../../i18n'

const EMPTY: CaseFields = {
  capacityL: null,
  diagonalMm: null,
  ean: '',
  innerHeightMm: null,
  innerLengthMm: null,
  innerWidthMm: null,
  loadKg: null,
  manufacturer: '',
  name: '',
  notes: '',
  referenceUrl: '',
  outerHeightMm: null,
  outerLengthMm: null,
  outerWidthMm: null,
  sku: '',
  system: '',
}

export type CaseFormProps = {
  initialValues?: CaseFields
  onCancel: () => void
  onSubmit: (fields: CaseFields) => void
  pending: boolean
  submitLabel: string
}

// Name and maker are required; everything below comes off a spec sheet, and a
// spec sheet is something you have or you do not. An empty measurement stays
// null rather than becoming zero — a box with no height does not exist, and
// "not measured" has to remain sayable.
// The form's type is whatever this returns, which is how the small helpers
// below can take it without anybody writing Mantine's generics out by hand.
function useCaseForm(initialValues?: CaseFields) {
  return useForm<CaseFields>({
    mode: 'uncontrolled',
    initialValues: initialValues ?? EMPTY,
    validate: {
      manufacturer: (value) => (value.trim() ? null : t('Producent jest wymagany')),
      name: (value) => (value.trim() ? null : t('Nazwa jest wymagana')),
    },
  })
}

type CaseFormApi = ReturnType<typeof useCaseForm>

export function CaseForm({
  initialValues,
  onCancel,
  onSubmit,
  pending,
  submitLabel,
}: CaseFormProps) {
  const form = useCaseForm(initialValues)

  // Systems come from the cases themselves, so the field suggests what is
  // already on the shelf without forcing anyone to pick from a list.
  const systems = useQuery({
    queryKey: ['case-systems'],
    queryFn: fetchSystems,
    staleTime: 60_000,
  })

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(normalise(values)))}>
      <Stack gap="md">
        <TextInput
          label={t('Nazwa')}
          placeholder="Qbrick System PRO Toolbox 2.0"
          required
          data-autofocus
          key={form.key('name')}
          {...form.getInputProps('name')}
        />

        <Group grow align="flex-start">
          <TextInput
            label={t('Producent')}
            placeholder="Qbrick"
            required
            key={form.key('manufacturer')}
            {...form.getInputProps('manufacturer')}
          />
          <Autocomplete
            label="System"
            placeholder="PRO"
            description={t('Z czym się składa')}
            data={systems.data?.systems.map((entry) => entry.system) ?? []}
            key={form.key('system')}
            {...form.getInputProps('system')}
          />
        </Group>

        <Fieldset legend={`${t('Wymiary zewnętrzne')} (mm)`}>
          <Group grow align="flex-start">
            <Millimetres form={form} field="outerLengthMm" label={t('Długość')} />
            <Millimetres form={form} field="outerWidthMm" label={t('Szerokość')} />
            <Millimetres form={form} field="outerHeightMm" label={t('Wysokość')} />
          </Group>
        </Fieldset>

        <Fieldset legend={`${t('Wymiary wewnętrzne')} (mm)`}>
          <Group grow align="flex-start">
            <Millimetres form={form} field="innerLengthMm" label={t('Długość')} />
            <Millimetres form={form} field="innerWidthMm" label={t('Szerokość')} />
            <Millimetres form={form} field="innerHeightMm" label={t('Wysokość')} />
          </Group>
        </Fieldset>

        <Group grow align="flex-start">
          <Millimetres form={form} field="diagonalMm" label={t('Przekątna')} suffix=" mm" />
          <NumberInput
            label={t('Pojemność')}
            placeholder="19"
            suffix=" L"
            min={0}
            decimalScale={2}
            // A Polish keyboard produces "4,5", and so does every spec sheet
            // these numbers are copied from.
            decimalSeparator=","
            key={form.key('capacityL')}
            {...form.getInputProps('capacityL')}
          />
          <NumberInput
            label={t('Ładowność')}
            placeholder="20"
            suffix=" kg"
            min={0}
            decimalScale={2}
            decimalSeparator=","
            key={form.key('loadKg')}
            {...form.getInputProps('loadKg')}
          />
        </Group>

        <Group grow align="flex-start">
          <TextInput
            label="EAN"
            placeholder="5901238254249"
            description={t('Kod produktu — dwie takie same skrzynki mają ten sam')}
            key={form.key('ean')}
            {...form.getInputProps('ean')}
          />
          <TextInput
            label="SKU"
            placeholder="SKRQTBPRO2CZAPG001"
            key={form.key('sku')}
            {...form.getInputProps('sku')}
          />
        </Group>

        <Textarea
          label={t('Notatki')}
          placeholder={t('Co jest w środku, gdzie stoi, co się w niej zepsuło…')}
          autosize
          minRows={3}
          key={form.key('notes')}
          {...form.getInputProps('notes')}
        />

        {/* An import fills this in, and typing it here is what gives a box
            catalogued by hand the update button an imported one has. */}
        <TextInput
          label={t('Strona producenta')}
          placeholder="https://…"
          type="url"
          key={form.key('referenceUrl')}
          {...form.getInputProps('referenceUrl')}
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

// Millimetres are whole numbers, so the input does not offer decimals at all
// rather than accepting 450,5 and letting the API refuse it.
function Millimetres({
  field,
  form,
  label,
  suffix,
}: {
  field: keyof CaseFields
  form: CaseFormApi
  label: string
  suffix?: string
}) {
  return (
    <NumberInput
      label={label}
      min={0}
      allowDecimal={false}
      suffix={suffix}
      key={form.key(field)}
      {...form.getInputProps(field)}
    />
  )
}

// Mantine's NumberInput hands back '' for an empty field. The API reads '' and
// null the same way — "forget this measurement" — but null says it plainly,
// and it is what a PATCH has to send to clear a number that was wrong.
function normalise(values: CaseFields): CaseFields {
  const result = { ...values }

  for (const [key, value] of Object.entries(result) as [keyof CaseFields, unknown][]) {
    if (typeof value === 'string' && key !== 'name' && key !== 'manufacturer') {
      const trimmed = value.trim()
      // A text field keeps '' — that is how the catalog says "not filled in".
      // A number field becomes null.
      ;(result[key] as unknown) = TEXT_FIELDS.has(key) ? trimmed : trimmed === '' ? null : value
    }
    if (typeof value === 'string' && (key === 'name' || key === 'manufacturer')) {
      ;(result[key] as unknown) = value.trim()
    }
  }

  return result
}

const TEXT_FIELDS = new Set<keyof CaseFields>(['ean', 'notes', 'referenceUrl', 'sku', 'system'])
