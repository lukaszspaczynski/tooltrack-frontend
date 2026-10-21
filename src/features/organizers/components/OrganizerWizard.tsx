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

import type { OrganizerFields, ItemSummary } from '../../../api/types'
import { COUNTS, t, tCount } from '../../../i18n'
import { CasePicker } from './CasePicker'
import { ItemPicker } from './ItemPicker'

// The wizard: the case first, then the items, then the name.
//
// The case comes first because it is what the arrangement is *of*. The item
// step offers only items in no organizer, which is the picker's own rule.
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
  const [chosenCase, setChosenCase] = useState<null | ItemSummary>(null)
  // The items themselves rather than their ids: one of them is the name of the
  // arrangement, and only the picker ever knew what it was called.
  const [items, setTools] = useState<ItemSummary[]>([])
  // Null until somebody types, which is what lets the suggestion follow the
  // selection without ever overwriting a name that was entered by hand. An
  // empty string is a typed name too — the person cleared the box.
  const [typedName, setTypedName] = useState<null | string>(null)
  const [description, setDescription] = useState('')
  const [number, setNumber] = useState<number | string>('')

  const toggleTool = (item: ItemSummary) =>
    setTools((current) =>
      current.some((entry) => entry.id === item.id)
        ? current.filter((entry) => entry.id !== item.id)
        : [...current, item],
    )

  // An arrangement holding one machine is called after it nine times out of
  // ten, and the name is already on the tile that was just ticked. Only for
  // exactly one: with two, naming it after either would be a guess.
  const suggestedName = items.length === 1 ? items[0].name : ''
  const name = typedName ?? suggestedName

  const submit = () => {
    if (!chosenCase || !name.trim()) return
    onCreate({
      // Not asked for here. The wizard's job is the case and the items in it;
      // where the box stands is something somebody sets afterwards, on the
      // arrangement, and asking for it in step one would be a field nobody has
      // an answer to yet.
      addressId: null,
      caseId: chosenCase.id,
      description: description.trim(),
      name: name.trim(),
      number: typeof number === 'number' ? number : undefined,
      itemIds: items.length > 0 ? items.map((item) => item.id) : undefined,
    })
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('Nowy organizer')} size="xl" centered>
      <Stack gap="md">
        <Stepper active={step} onStepClick={setStep} size="sm" allowNextStepsSelect={false}>
          <Stepper.Step label={t('Skrzynka')} description={chosenCase?.name ?? t('nie wybrano')} />
          <Stepper.Step
            label={t('Narzędzia')}
            description={
              items.length > 0 ? t('wybrano {n}', { n: items.length }) : t('opcjonalnie')
            }
          />
          <Stepper.Step label={t('Nazwa')} />
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
          <ItemPicker selected={items.map((item) => item.id)} onToggle={toggleTool} />
        ) : null}

        {step === 2 ? (
          <Stack gap="sm">
            <TextInput
              label={t('Nazwa organizera')}
              placeholder={t('Wiertarki i wkrętarki')}
              required
              data-autofocus
              value={name}
              onChange={(event) => setTypedName(event.currentTarget.value)}
            />
            <Textarea
              label={t('Opis')}
              placeholder={t('Co i dlaczego jest w tym układzie')}
              autosize
              minRows={2}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
            <NumberInput
              label={t('Numer porządkowy')}
              description={t('Zostaw puste, żeby dostać kolejny wolny')}
              placeholder={t('kolejny wolny')}
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
              {t('Dalej')}
            </Button>
          ) : (
            <Button onClick={submit} loading={saving} disabled={!name.trim() || !chosenCase}>
              {t('Utwórz')}
            </Button>
          )}
        </Group>

        {step === 2 ? (
          <Text size="xs" c="dimmed">
            {t('Skrzynka')}: {chosenCase?.name ?? '—'}
            {items.length > 0
              ? ` · ${tCount(COUNTS.item, items.length)}`
              : ` · ${t('bez narzędzi')}`}
          </Text>
        ) : null}
      </Stack>
    </Modal>
  )
}
