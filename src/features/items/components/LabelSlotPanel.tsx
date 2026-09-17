import { ActionIcon, Badge, Button, Group, NumberInput, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconTag, IconX } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { addLabelSlot, removeLabelSlot } from '../../../api/items'
import type { LabelSlot } from '../../../api/types'
import { t } from '../../../i18n'

// Where the labels go on a box.
//
// Only a case has any, so this panel is only rendered for one — and the server
// says the same thing with a constraint rather than a check: a slot points at
// `(id, kind)` with its kind fixed to `case`, so a drill is refused by the
// database and a box in use cannot quietly stop being a box.
//
// The sizes go in and out one at a time, immediately, unlike the fields of the
// card: a slot is a row of its own and the server has no draft to hold it in.
// Each call answers with the whole card, so the panel replaces `['item', id]`
// rather than merging a row into what it holds.
export function LabelSlotPanel({
  canEdit,
  itemId,
  slots,
}: {
  canEdit: boolean
  itemId: number
  slots: LabelSlot[]
}) {
  const queryClient = useQueryClient()
  const [width, setWidth] = useState<number | string>('')
  const [height, setHeight] = useState<number | string>('')

  const failed = (error: unknown) =>
    notifications.show({ color: 'red', message: (error as Error).message })

  const add = useMutation({
    mutationFn: (slot: { heightMm: number; widthMm: number }) => addLabelSlot(itemId, slot),
    onSuccess: ({ item }) => {
      queryClient.setQueryData(['item', itemId], { item })
      setWidth('')
      setHeight('')
    },
    onError: failed,
  })

  const drop = useMutation({
    mutationFn: (slotId: number) => removeLabelSlot(itemId, slotId),
    onSuccess: ({ item }) => queryClient.setQueryData(['item', itemId], { item }),
    onError: failed,
  })

  return (
    <Stack gap="md">
      <Group gap="xs">
        <IconTag size={18} />
        <Text fw={600}>
          {t('Miejsca na etykiety')} ({slots.length})
        </Text>
      </Group>

      {slots.length === 0 ? (
        <Text c="dimmed" size="sm">
          {t('Nie ma jeszcze żadnego miejsca.')}
        </Text>
      ) : (
        <Group gap="xs">
          {slots.map((slot) => (
            <Badge
              key={slot.id}
              variant="default"
              size="lg"
              rightSection={
                canEdit ? (
                  <ActionIcon
                    size="xs"
                    variant="transparent"
                    color="gray"
                    aria-label={t('Usuń miejsce {width} na {height}', {
                      height: slot.heightMm,
                      width: slot.widthMm,
                    })}
                    loading={drop.isPending && drop.variables === slot.id}
                    onClick={() => drop.mutate(slot.id)}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                ) : null
              }
            >
              {slot.widthMm} × {slot.heightMm} mm
            </Badge>
          ))}
        </Group>
      )}

      {canEdit ? (
        <Group align="flex-end" gap="sm">
          <NumberInput
            label={t('Szerokość')}
            suffix=" mm"
            min={1}
            allowDecimal={false}
            value={width}
            onChange={setWidth}
            w={130}
          />
          <NumberInput
            label={t('Wysokość')}
            suffix=" mm"
            min={1}
            allowDecimal={false}
            value={height}
            onChange={setHeight}
            w={130}
          />
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            loading={add.isPending}
            disabled={typeof width !== 'number' || typeof height !== 'number'}
            onClick={() =>
              typeof width === 'number' &&
              typeof height === 'number' &&
              add.mutate({ heightMm: height, widthMm: width })
            }
          >
            {t('Dodaj miejsce')}
          </Button>
        </Group>
      ) : null}
    </Stack>
  )
}
