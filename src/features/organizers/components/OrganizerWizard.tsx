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

import type { CaseListItem, OrganizerFields, ToolListItem } from '../../../api/types'
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
  // The tools themselves rather than their ids: one of them is the name of the
  // arrangement, and only the picker ever knew what it was called.
  const [tools, setTools] = useState<ToolListItem[]>([])
  // Null until somebody types, which is what lets the suggestion follow the
  // selection without ever overwriting a name that was entered by hand. An
  // empty string is a typed name too — the person cleared the box.
  const [typedName, setTypedName] = useState<null | string>(null)
  const [description, setDescription] = useState('')
  const [number, setNumber] = useState<number | string>('')

  const toggleTool = (tool: ToolListItem) =>
    setTools((current) =>
      current.some((entry) => entry.id === tool.id)
        ? current.filter((entry) => entry.id !== tool.id)
        : [...current, tool],
    )

  // An arrangement holding one machine is called after it nine times out of
  // ten, and the name is already on the tile that was just ticked. Only for
  // exactly one: with two, naming it after either would be a guess.
  const suggestedName = tools.length === 1 ? tools[0].name : ''
  const name = typedName ?? suggestedName

  const submit = () => {
    if (!chosenCase || !name.trim()) return
    onCreate({
      caseId: chosenCase.id,
      description: description.trim(),
      name: name.trim(),
      number: typeof number === 'number' ? number : undefined,
      toolIds: tools.length > 0 ? tools.map((tool) => tool.id) : undefined,
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Nowy organizer" size="xl" centered>
      <Stack gap="md">
        <Stepper active={step} onStepClick={setStep} size="sm" allowNextStepsSelect={false}>
          <Stepper.Step label="Skrzynka" description={chosenCase?.name ?? 'nie wybrano'} />
          <Stepper.Step
            label="Narzędzia"
            description={tools.length > 0 ? `wybrano ${tools.length}` : 'opcjonalnie'}
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

        {step === 1 ? (
          <ToolPicker selected={tools.map((tool) => tool.id)} onToggle={toggleTool} />
        ) : null}

        {step === 2 ? (
          <Stack gap="sm">
            <TextInput
              label="Nazwa organizera"
              placeholder="Wiertarki i wkrętarki"
              required
              data-autofocus
              value={name}
              onChange={(event) => setTypedName(event.currentTarget.value)}
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
            {tools.length > 0 ? ` · narzędzi: ${tools.length}` : ' · bez narzędzi'}
          </Text>
        ) : null}
      </Stack>
    </Modal>
  )
}
