import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Stepper,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useState } from 'react'

import type { CaseListItem, OrganizerFields } from '../../../api/types'
import { CasePicker } from './CasePicker'
import { ToolPicker } from './ToolPicker'

// The wizard: the case first, then the tools, then the name.
//
// The case comes first because it is what the arrangement is *of*. The tool
// step offers only tools in no organizer, which is the picker's own rule.
export function OrganizerWizard({
  onClose,
  onCreate,
  opened,
  saving,
}: {
  onClose: () => void
  onCreate: (fields: OrganizerFields) => void
  opened: boolean
  saving: boolean
}) {
  const [step, setStep] = useState(0)
  const [chosenCase, setChosenCase] = useState<null | CaseListItem>(null)
  const [toolIds, setToolIds] = useState<number[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [number, setNumber] = useState<number | string>('')

  const toggleTool = (id: number) =>
    setToolIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )

  const submit = () => {
    if (!chosenCase || !name.trim()) return
    onCreate({
      caseId: chosenCase.id,
      description: description.trim(),
      name: name.trim(),
      number: typeof number === 'number' ? number : undefined,
      toolIds: toolIds.length > 0 ? toolIds : undefined,
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nowy organizer" size="xl" centered>
      <Stack gap="md">
        <Stepper active={step} onStepClick={setStep} size="sm" allowNextStepsSelect={false}>
          <Stepper.Step label="Skrzynka" description={chosenCase?.name ?? 'nie wybrano'} />
          <Stepper.Step
            label="Narzędzia"
            description={toolIds.length > 0 ? `wybrano ${toolIds.length}` : 'opcjonalnie'}
          />
          <Stepper.Step label="Nazwa" />
        </Stepper>

        {step === 0 ? (
          <CasePicker
            selectedId={chosenCase?.id ?? null}
            onSelect={(item) => {
              setChosenCase(item)
              setStep(1)
            }}
          />
        ) : null}

        {step === 1 ? <ToolPicker selected={toolIds} onToggle={toggleTool} /> : null}

        {step === 2 ? (
          <Stack gap="sm">
            <TextInput
              label="Nazwa organizera"
              placeholder="Wiertarki i wkrętarki"
              required
              data-autofocus
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
            />
            <Textarea
              label="Opis"
              placeholder="Co i dlaczego jest w tym układzie"
              autosize
              minRows={2}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
            <NumberInput
              label="Numer porządkowy"
              description="Zostaw puste, żeby dostać kolejny wolny"
              placeholder="kolejny wolny"
              min={1}
              allowDecimal={false}
              value={number}
              onChange={setNumber}
            />
          </Stack>
        ) : null}

        <Group justify="space-between">
          <Button
            variant="default"
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            disabled={saving}
          >
            {step === 0 ? 'Anuluj' : 'Wstecz'}
          </Button>

          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!chosenCase}>
              Dalej
            </Button>
          ) : (
            <Button onClick={submit} loading={saving} disabled={!name.trim() || !chosenCase}>
              Utwórz
            </Button>
          )}
        </Group>

        {step === 2 ? (
          <Text size="xs" c="dimmed">
            Skrzynka: {chosenCase?.name ?? '—'}
            {toolIds.length > 0 ? ` · narzędzi: ${toolIds.length}` : ' · bez narzędzi'}
          </Text>
        ) : null}
      </Stack>
    </Modal>
  )
}
