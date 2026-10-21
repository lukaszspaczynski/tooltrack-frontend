import {
  Alert,
  Button,
  Card,
  Checkbox,
  Group,
  Image,
  Modal,
  Radio,
  ScrollArea,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  TextInput,
} from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { apiFileUrl } from '../../../api/client'
import { fetchLabelSlots, type LabelRequest } from '../../../api/organizers'
import type { Organizer, OrganizerLabelSlot } from '../../../api/types'
import { t } from '../../../i18n'
import { defaultCaptionSource, labelPhotos, maxPhotosFor, toolModels } from '../labelDefaults'

// What the server accepts for a line somebody types. A label is 30 mm across;
// past this the template can only shrink the type until nobody can read it.
const MAX_TEXT = 120

type Template = 'contents' | 'number'

// Adding a label: the size first, the template second, and then whatever that
// template asks for.
//
// The size comes from the case's own list of places, so the wizard cannot
// offer one the box has nowhere to put. A case with no places has nothing to
// offer at all, and says so rather than showing an empty step.
export function LabelWizard({
  onClose,
  onCreate,
  opened,
  organizer,
  saving,
}: {
  onClose: () => void
  onCreate: (request: LabelRequest) => void
  opened: boolean
  organizer: Organizer
  saving: boolean
}) {
  const [step, setStep] = useState(0)
  const [slot, setSlot] = useState<null | OrganizerLabelSlot>(null)
  const [template, setTemplate] = useState<null | Template>(null)
  const [withLogos, setWithLogos] = useState(true)
  const [withTitle, setWithTitle] = useState(true)
  const [withNames, setWithNames] = useState(true)
  // Each of the two lines is either worked out from the catalog or typed. The
  // text is kept even while the other source is chosen, so switching back and
  // forth does not lose what somebody wrote.
  const [titleSource, setTitleSource] = useState<'custom' | 'organizer'>('organizer')
  // Null until somebody chooses, so the default can depend on what this
  // organizer actually has to say.
  const [chosenNamesSource, setChosenNamesSource] = useState<null | 'models' | 'text' | 'items'>(
    null,
  )
  const [titleText, setTitleText] = useState('')
  const [namesText, setNamesText] = useState('')
  // Null until somebody ticks a picture themselves. Until then the selection is
  // worked out from the slot, so a bigger place fills up on its own and a
  // smaller one drops what no longer fits; afterwards it is theirs, and an
  // empty list is a decision too.
  const [pickedPhotos, setPickedPhotos] = useState<null | number[]>(null)
  const [printReady, setPrintReady] = useState(true)

  const slots = useQuery({
    queryKey: ['organizer-label-slots', organizer.id],
    queryFn: () => fetchLabelSlots(organizer.id),
    enabled: opened,
  })

  const photos = labelPhotos(organizer.items)

  const maxPhotos = maxPhotosFor(slot)

  // A label with empty picture places is a label nobody wanted: the template
  // draws as many as it holds, and the items of this organizer are what it is
  // for. The first ones, in the order the catalog lists them — somebody who
  // wants other ones says so, and from then on the choice is theirs.
  const photoIds = pickedPhotos ?? photos.slice(0, maxPhotos).map((photo) => photo.id)

  const togglePhoto = (id: number) =>
    setPickedPhotos(
      photoIds.includes(id)
        ? photoIds.filter((entry) => entry !== id)
        : photoIds.length >= maxPhotos
          ? photoIds
          : [...photoIds, id],
    )

  // What the label would say on its own, and what a custom field starts from:
  // editing down from the real answer is easier than typing it out.
  const automaticNames = organizer.items.map((item) => item.name).join(', ')
  const automaticModels = toolModels(organizer.items)
  const namesSource = chosenNamesSource ?? defaultCaptionSource(organizer.items)

  const startTyping = (
    source: 'custom' | 'models' | 'organizer' | 'text' | 'items',
    current: string,
    automatic: string,
    set: (value: string) => void,
  ) => {
    if ((source === 'custom' || source === 'text') && current === '')
      set(automatic.slice(0, MAX_TEXT))
  }

  const submit = () => {
    if (!slot || !template) return

    onCreate(
      template === 'number'
        ? { printReady, slotId: slot.id, template, withLogos }
        : {
            // Empty means "work it out": the server puts the organizer's name
            // and the item names on. Only a typed line travels as text.
            namesSource,
            namesText: withNames && namesSource === 'text' ? namesText.trim() : '',
            photoIds,
            printReady,
            slotId: slot.id,
            template,
            titleText: withTitle && titleSource === 'custom' ? titleText.trim() : '',
            withNames,
            withTitle,
          },
    )
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('Nowa etykieta')} size="xl" centered>
      <Stack gap="md">
        <Stepper active={step} onStepClick={setStep} size="sm" allowNextStepsSelect={false}>
          <Stepper.Step
            label={t('Rozmiar')}
            description={slot ? `${slot.widthMm} × ${slot.heightMm} mm` : t('nie wybrano')}
          />
          <Stepper.Step
            label={t('Szablon')}
            description={
              template === 'number' ? t('numer') : template === 'contents' ? t('zawartość') : '—'
            }
          />
          <Stepper.Step label={t('Opcje')} />
          <Stepper.Step
            label={t('Plik')}
            description={printReady ? t('do druku') : t('sama grafika')}
          />
        </Stepper>

        {step === 0 ? (
          <Stack gap="sm">
            {slots.data && slots.data.slots.length === 0 ? (
              <Alert
                color="orange"
                variant="light"
                title={t('Ta skrzynka nie ma miejsc na etykiety')}
              >
                {t('Dodaj rozmiar na karcie skrzynki „{name}”, a potem wróć tutaj.', {
                  name: organizer.case.name,
                })}
              </Alert>
            ) : null}

            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
              {(slots.data?.slots ?? []).map((entry) => (
                <Card
                  key={entry.id}
                  withBorder
                  padding="md"
                  radius="md"
                  onClick={() => {
                    setSlot(entry)
                    // A front holds three where a lid held six, so going back
                    // and choosing a smaller place drops what no longer fits
                    // rather than letting the server refuse the whole label. A
                    // selection nobody has touched is left alone: it follows
                    // the new shape by itself.
                    setPickedPhotos((current) =>
                      current === null ? null : current.slice(0, maxPhotosFor(entry)),
                    )
                    setStep(1)
                  }}
                  style={{
                    borderColor: slot?.id === entry.id ? 'var(--mantine-color-amber-6)' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  <Stack gap={4} align="center">
                    {/* The proportions, drawn. On a list of numbers a lid and a
                        front look alike; as rectangles they never do. */}
                    <div
                      style={{
                        backgroundColor: 'var(--mantine-color-default-hover)',
                        border: '1px solid var(--mantine-color-default-border)',
                        height:
                          44 *
                          Math.min(1, entry.heightMm / Math.max(entry.widthMm, entry.heightMm)),
                        width:
                          44 * Math.min(1, entry.widthMm / Math.max(entry.widthMm, entry.heightMm)),
                      }}
                    />
                    <Text size="sm" fw={600}>
                      {entry.widthMm} × {entry.heightMm} mm
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        ) : null}

        {step === 1 ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TemplateCard
              chosen={template === 'number'}
              description={t(
                'Duży numer organizera na tle w kolorach producentów. Opcjonalnie z ich logo.',
              )}
              onChoose={() => {
                setTemplate('number')
                setStep(2)
              }}
              title={t('Numer porządkowy')}
            />
            <TemplateCard
              chosen={template === 'contents'}
              description={t(
                'Do trzech zdjęć narzędzi, pod nimi nazwa organizera i nazwy narzędzi.',
              )}
              onChoose={() => {
                setTemplate('contents')
                setStep(2)
              }}
              title={t('Zawartość')}
            />
          </SimpleGrid>
        ) : null}

        {step === 2 && template === 'number' ? (
          <Stack gap="sm">
            <Checkbox
              checked={withLogos}
              onChange={(event) => setWithLogos(event.currentTarget.checked)}
              label={t('Umieść logo producentów')}
              description={t('Marki bez logo są pomijane')}
            />
          </Stack>
        ) : null}

        {step === 2 && template === 'contents' ? (
          <Stack gap="sm">
            <Stack gap={6}>
              <Checkbox
                checked={withTitle}
                onChange={(event) => setWithTitle(event.currentTarget.checked)}
                label={t('Nazwa')}
                description={t('Duży napis nad linią')}
              />
              {withTitle ? (
                <Stack gap={6} pl={34}>
                  <Radio.Group
                    value={titleSource}
                    onChange={(value) => {
                      const source = value as 'custom' | 'organizer'
                      setTitleSource(source)
                      startTyping(source, titleText, organizer.name, setTitleText)
                    }}
                  >
                    <Group gap="lg">
                      <Radio
                        value="organizer"
                        label={t('Nazwa organizera („{name}")', { name: organizer.name })}
                      />
                      <Radio value="custom" label={t('Własny tekst')} />
                    </Group>
                  </Radio.Group>
                  {titleSource === 'custom' ? (
                    <TextInput
                      value={titleText}
                      onChange={(event) => setTitleText(event.currentTarget.value)}
                      maxLength={MAX_TEXT}
                      placeholder={t('np. Akumulatory')}
                      aria-label={t('Własna nazwa na etykiecie')}
                    />
                  ) : null}
                </Stack>
              ) : null}
            </Stack>

            <Stack gap={6}>
              <Checkbox
                checked={withNames}
                onChange={(event) => setWithNames(event.currentTarget.checked)}
                label={t('Podpis')}
                description={t('Mniejszy napis pod linią, wersalikami')}
              />
              {withNames ? (
                <Stack gap={6} pl={34}>
                  <Radio.Group
                    value={namesSource}
                    onChange={(value) => {
                      const source = value as 'models' | 'text' | 'items'
                      setChosenNamesSource(source)
                      startTyping(source, namesText, automaticNames, setNamesText)
                    }}
                  >
                    <Group gap="lg">
                      <Radio
                        value="items"
                        label={t('Nazwy narzędzi')}
                        description={t(
                          'Jeśli nie mieszczą się wszystkie, etykieta pokaże ile zostało',
                        )}
                      />
                      <Radio
                        value="models"
                        label={t('Modele urządzeń')}
                        description={
                          automaticModels
                            ? t('Na tej etykiecie: „{models}"', { models: automaticModels })
                            : t('Żadne narzędzie tutaj nie ma wpisanego modelu')
                        }
                        disabled={automaticModels === ''}
                      />
                      <Radio value="text" label={t('Własny tekst')} />
                    </Group>
                  </Radio.Group>
                  {namesSource === 'text' ? (
                    <TextInput
                      value={namesText}
                      onChange={(event) => setNamesText(event.currentTarget.value)}
                      maxLength={MAX_TEXT}
                      placeholder={t('np. 18 V + 12 V, Li-Ion')}
                      aria-label={t('Własny podpis na etykiecie')}
                    />
                  ) : null}
                </Stack>
              ) : null}
            </Stack>

            <Text size="sm" fw={600}>
              {t('Zdjęcia')} ({photoIds.length}/{maxPhotos})
            </Text>

            {photos.length === 0 ? (
              <Alert color="gray" variant="light">
                {t('Narzędzia w tym organizerze nie mają zdjęć.')}
              </Alert>
            ) : (
              <ScrollArea.Autosize mah={260}>
                <SimpleGrid cols={{ base: 3, sm: 4, md: 5 }} spacing="sm">
                  {photos.map((photo) => {
                    const chosen = photoIds.includes(photo.id)
                    return (
                      <Card
                        key={photo.id}
                        withBorder
                        padding="xs"
                        radius="md"
                        onClick={() => togglePhoto(photo.id)}
                        style={{
                          borderColor: chosen ? 'var(--mantine-color-amber-6)' : undefined,
                          cursor: 'pointer',
                          opacity: !chosen && photoIds.length >= maxPhotos ? 0.45 : 1,
                        }}
                      >
                        <Stack gap={4}>
                          <Image
                            src={apiFileUrl(photo.url)}
                            alt={photo.name}
                            h={60}
                            fit="contain"
                          />
                          <Text size="xs" lineClamp={1} title={photo.name}>
                            {photo.name}
                          </Text>
                        </Stack>
                      </Card>
                    )
                  })}
                </SimpleGrid>
              </ScrollArea.Autosize>
            )}
          </Stack>
        ) : null}

        {step === 3 ? (
          <Stack gap="sm">
            <Radio.Group
              value={printReady ? 'print' : 'plain'}
              onChange={(value) => setPrintReady(value === 'print')}
            >
              <Stack gap="sm">
                <Radio
                  value="print"
                  label={t('Gotowy do druku')}
                  description={t(
                    'Margines ze znacznikami cięcia w rogach, linia cięcia wzdłuż etykiety i linijka kontrolna — zmierz ją po wydruku, żeby sprawdzić, czy drukarka nie przeskalowała pliku',
                  )}
                />
                <Radio
                  value="plain"
                  label={t('Sama grafika')}
                  description={t(
                    'Strona dokładnie w rozmiarze etykiety, bez żadnych linii. Do wstawienia gdzie indziej albo do obejrzenia',
                  )}
                />
              </Stack>
            </Radio.Group>
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

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 0 ? !slot : !template}>
              {t('Dalej')}
            </Button>
          ) : (
            <Button onClick={submit} loading={saving} disabled={!slot || !template}>
              {t('Wygeneruj PDF')}
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  )
}

function TemplateCard({
  chosen,
  description,
  onChoose,
  title,
}: {
  chosen: boolean
  description: string
  onChoose: () => void
  title: string
}) {
  return (
    <Card
      withBorder
      padding="md"
      radius="md"
      onClick={onChoose}
      style={{
        borderColor: chosen ? 'var(--mantine-color-amber-6)' : undefined,
        cursor: 'pointer',
      }}
    >
      <Stack gap={4}>
        <Text fw={600}>{title}</Text>
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      </Stack>
    </Card>
  )
}
