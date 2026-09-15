import {
  Button,
  Collapse,
  Group,
  NumberInput,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { useState } from 'react'

import type { ItemSummary } from '../../../api/types'
import { AddressSelect } from '../../addresses/components/AddressSelect'
import { t } from '../../../i18n'
import { CasePicker } from './CasePicker'

export type OrganizerFormValues = {
  // Where this arrangement stands. Null is "nobody has said", which is what a
  // new one is until somebody puts the box down somewhere.
  addressId: null | number
  caseId: number
  description: string
  name: string
  number: number
}

// The fields of one arrangement. The case is picked from the same tiles the
// wizard uses — with the litres and the outside measurements, because choosing
// a case is choosing how much goes in and whether it fits where it stands.
export function OrganizerForm({
  caseName,
  initialValues,
  onCancel,
  onSubmit,
  pending,
}: {
  caseName: string
  initialValues: OrganizerFormValues
  onCancel: () => void
  onSubmit: (values: OrganizerFormValues) => void
  pending: boolean
}) {
  const form = useForm<OrganizerFormValues>({
    mode: 'uncontrolled',
    initialValues,
    validate: { name: (value) => (value.trim() ? null : t('Nazwa jest wymagana')) },
  })

  const [chosenCase, setChosenCase] = useState({ id: initialValues.caseId, name: caseName })
  const [caseOpen, casePicker] = useDisclosure(false)
  // Its own state and merged at submit, like the case above. The form is
  // uncontrolled, so setFieldValue writes the value and renders nothing — the
  // select would keep showing the old place while holding the new one.
  const [addressId, setAddressId] = useState(initialValues.addressId)

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        onSubmit({ ...values, addressId, caseId: chosenCase.id, name: values.name.trim() }),
      )}
    >
      <Stack gap="md">
        <Group grow align="flex-start">
          <TextInput
            label={t('Nazwa')}
            required
            data-autofocus
            key={form.key('name')}
            {...form.getInputProps('name')}
          />
          <NumberInput
            label={t('Numer porządkowy')}
            description={t('Musi być wolny')}
            min={1}
            allowDecimal={false}
            key={form.key('number')}
            {...form.getInputProps('number')}
          />
        </Group>

        {/* Where the box stands. The items inside carry one of their own and
            the two may disagree — a drill on a site while its box is in the
            workshop is genuinely two places. */}
        <AddressSelect value={addressId} onChange={setAddressId} />

        <Textarea
          label={t('Opis')}
          placeholder={t('Co i dlaczego jest w tym układzie')}
          autosize
          minRows={2}
          key={form.key('description')}
          {...form.getInputProps('description')}
        />

        <Stack gap={4}>
          <Group justify="space-between" align="center">
            <Stack gap={0}>
              <Text size="sm" fw={600}>
                {t('Skrzynka')}
              </Text>
              <Text size="sm" c="dimmed">
                {chosenCase.name}
              </Text>
            </Stack>
            <Button size="xs" variant="light" onClick={casePicker.toggle}>
              {caseOpen ? t('Zwiń') : t('Zmień')}
            </Button>
          </Group>

          <Collapse expanded={caseOpen}>
            <CasePicker
              selectedId={chosenCase.id}
              onSelect={(item: ItemSummary) => {
                setChosenCase(item)
                casePicker.close()
              }}
            />
          </Collapse>
        </Stack>

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onCancel} disabled={pending}>
            {t('Anuluj')}
          </Button>
          <Button type="submit" loading={pending}>
            {t('Zapisz zmiany')}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
