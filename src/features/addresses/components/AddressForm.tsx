import { Button, ColorInput, Group, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'

import type { AddressFields } from '../../../api/types'
import { t } from '../../../i18n'

// Chosen to be told apart at the size they are drawn — a dot beside a name on
// a phone — rather than to be pretty together.
const SWATCHES = [
  '#d0392a',
  '#e8871a',
  '#f5d24a',
  '#3f6652',
  '#244930',
  '#4b66a4',
  '#7a4b9c',
  '#5c5c5c',
]

const EMPTY: AddressFields = {
  building: '',
  city: '',
  color: '',
  name: '',
  notes: '',
  postalCode: '',
  street: '',
  unit: '',
}

// The name first and alone, because it is the required part and the one a
// picker shows. Everything under it is the postal half — for when somebody has
// to drive there — and every field of it is optional: a yard on a site has a
// name and no street.
export function AddressForm({
  initialValues,
  onCancel,
  onSubmit,
  pending,
  submitLabel,
}: {
  initialValues?: AddressFields
  onCancel: () => void
  onSubmit: (fields: AddressFields) => void
  pending: boolean
  submitLabel: string
}) {
  const form = useForm<AddressFields>({
    initialValues: initialValues ?? EMPTY,
    validate: {
      name: (value) => (value.trim() ? null : t('Nazwa jest wymagana')),
    },
  })

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(trimAll(values)))}>
      <Stack gap="md">
        <TextInput
          label={t('Nazwa')}
          placeholder={t('Magazyn, Budowa Mokotów…')}
          description={t('To, jak mówicie o tym miejscu. Po tym się je wybiera.')}
          withAsterisk
          key={form.key('name')}
          {...form.getInputProps('name')}
        />

        {/* What a place is recognised by across the screens without reading
            its name. The picker gives hex and the server takes "208 57 42"
            too, so a colour copied off something else pastes in. */}
        <ColorInput
          label={t('Kolor')}
          description={t('Po nim rozpoznasz miejsce na liście narzędzi.')}
          placeholder="#d0392a"
          format="hex"
          key={form.key('color')}
          {...form.getInputProps('color')}
          swatches={SWATCHES}
        />

        <Group grow align="flex-start">
          <TextInput
            label={t('Ulica')}
            placeholder="Puławska"
            key={form.key('street')}
            {...form.getInputProps('street')}
          />
          <TextInput
            label={t('Numer')}
            placeholder="12A"
            key={form.key('building')}
            {...form.getInputProps('building')}
          />
          {/* Its own field rather than part of the number, because "12A/3" and
              "12A lok. 3" are the same place written by two people. */}
          <TextInput
            label={t('Lokal')}
            placeholder="3"
            key={form.key('unit')}
            {...form.getInputProps('unit')}
          />
        </Group>

        <Group grow align="flex-start">
          <TextInput
            label={t('Kod pocztowy')}
            placeholder="02-566"
            key={form.key('postalCode')}
            {...form.getInputProps('postalCode')}
          />
          <TextInput
            label={t('Miejscowość')}
            placeholder="Warszawa"
            key={form.key('city')}
            {...form.getInputProps('city')}
          />
        </Group>

        <Textarea
          label={t('Notatki')}
          placeholder={t('Klucz u kierownika, wjazd od podwórza…')}
          autosize
          minRows={2}
          maxRows={6}
          key={form.key('notes')}
          {...form.getInputProps('notes')}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onCancel} type="button" disabled={pending}>
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
// value the person will see when the place comes back.
function trimAll(fields: AddressFields): AddressFields {
  return {
    building: fields.building.trim(),
    city: fields.city.trim(),
    color: fields.color.trim(),
    name: fields.name.trim(),
    notes: fields.notes.trim(),
    postalCode: fields.postalCode.trim(),
    street: fields.street.trim(),
    unit: fields.unit.trim(),
  }
}
