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

import type { CaseListItem } from '../../../api/types'
import { CasePicker } from './CasePicker'

export type OrganizerFormValues = {
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
    validate: { name: (value) => (value.trim() ? null : 'Nazwa jest wymagana') },
  })

  const [chosenCase, setChosenCase] = useState({ id: initialValues.caseId, name: caseName })
  const [caseOpen, casePicker] = useDisclosure(false)

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        onSubmit({ ...values, caseId: chosenCase.id, name: values.name.trim() }),
      )}
    >
      <Stack gap="md">
        <Group grow align="flex-start">
          <TextInput
            label="Nazwa"
            required
            data-autofocus
            key={form.key('name')}
            {...form.getInputProps('name')}
          />
          <NumberInput
            label="Numer porządkowy"
            description="Musi być wolny"
            min={1}
            allowDecimal={false}
            key={form.key('number')}
            {...form.getInputProps('number')}
          />
        </Group>

        <Textarea
          label="Opis"
          placeholder="Co i dlaczego jest w tym układzie"
          autosize
          minRows={2}
          key={form.key('description')}
          {...form.getInputProps('description')}
        />

        <Stack gap={4}>
          <Group justify="space-between" align="center">
            <Stack gap={0}>
              <Text size="sm" fw={600}>
                Skrzynka
              </Text>
              <Text size="sm" c="dimmed">
                {chosenCase.name}
              </Text>
            </Stack>
            <Button size="xs" variant="light" onClick={casePicker.toggle}>
              {caseOpen ? 'Zwiń' : 'Zmień'}
            </Button>
          </Group>

          <Collapse expanded={caseOpen}>
            <CasePicker
              selectedId={chosenCase.id}
              onSelect={(item: CaseListItem) => {
                setChosenCase(item)
                casePicker.close()
              }}
            />
          </Collapse>
        </Stack>

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onCancel} disabled={pending}>
            Anuluj
          </Button>
          <Button type="submit" loading={pending}>
            Zapisz zmiany
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
