import { Badge, Card, Group, Image, Stack, Text, Tooltip } from '@mantine/core'
import { IconPhotoOff } from '@tabler/icons-react'
import { Link } from 'react-router-dom'

import { apiFileUrl } from '../../../api/client'
import type { ToolListItem } from '../../../api/types'
import { t } from '../../../i18n'
import { CONDITION_COLORS, CONDITION_LABELS, formatDateTime, toolSubtitle } from '../presentation'

// One tool, as it appears in the grid. A card rather than a table row on
// purpose: this list is read on a phone held in one hand, and a row that has to
// scroll sideways is a row nobody reads.
export function ToolCard({ tool }: { tool: ToolListItem }) {
  const subtitle = toolSubtitle(tool)

  return (
    <Card withBorder padding="md" radius="md" pos="relative">
      <Card.Section pos="relative">
        {/* Where this one lives, as a sticker on its own picture: the number
            said out loud and the case it is in. On a shelf of near-identical
            packs that is the fact somebody is actually looking for. */}
        {tool.organizer ? <PlacementBadge placement={tool.organizer} /> : null}

        {/* Fixed height whether or not there is a photo: a grid where every
            other card is shorter is a grid nobody can scan. */}
        {tool.primaryPhotoUrl ? (
          <Image
            src={apiFileUrl(tool.primaryPhotoUrl)}
            alt={tool.name}
            h={140}
            fit="contain"
            bg="var(--mantine-color-default-hover)"
          />
        ) : (
          <Group h={140} justify="center" bg="var(--mantine-color-default-hover)">
            <IconPhotoOff size={28} color="var(--mantine-color-dimmed)" />
          </Group>
        )}
      </Card.Section>

      <Stack gap="xs" h="100%" justify="space-between" pt="sm">
        <Stack gap={4}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
            {/* The card's link, stretched over all of it. A nested anchor
                would be invalid HTML, so the badge below sits above this one
                rather than inside it. */}
            <Text
              component={Link}
              to={`/tools/${tool.id}`}
              className="stretched-link"
              fw={600}
              lineClamp={2}
              c="var(--mantine-color-text)"
              style={{ textDecoration: 'none' }}
            >
              {tool.name}
            </Text>
            <Badge
              color={CONDITION_COLORS[tool.condition]}
              variant="light"
              style={{ flexShrink: 0 }}
            >
              {t(CONDITION_LABELS[tool.condition])}
            </Badge>
          </Group>

          {subtitle ? (
            <Text size="sm" c="dimmed" lineClamp={1}>
              {subtitle}
            </Text>
          ) : null}
        </Stack>

        <Group justify="space-between" gap="xs" wrap="nowrap">
          {tool.category ? (
            <Badge variant="default" size="sm">
              {tool.category}
            </Badge>
          ) : (
            <Text size="xs" c="dimmed">
              bez kategorii
            </Text>
          )}
          <Text size="xs" c="dimmed">
            {formatDateTime(tool.updatedAt)}
          </Text>
        </Group>
      </Stack>
    </Card>
  )
}

function PlacementBadge({ placement }: { placement: NonNullable<ToolListItem['organizer']> }) {
  return (
    <Tooltip label={`Organizer ${placement.number} · ${placement.caseName}`}>
      <Link
        to={`/organizers/${placement.organizerId}`}
        className="above-stretched-link"
        aria-label={`Organizer ${placement.number}`}
        style={{ position: 'absolute', right: 6, textDecoration: 'none', top: 6 }}
      >
        <Group
          gap={4}
          wrap="nowrap"
          p={3}
          pr={7}
          style={{
            backgroundColor: 'var(--mantine-color-body)',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 999,
          }}
        >
          {placement.casePhotoUrl ? (
            <Image
              src={apiFileUrl(placement.casePhotoUrl)}
              alt={placement.caseName}
              h={20}
              w={20}
              fit="contain"
              radius={999}
            />
          ) : null}
          <Text size="xs" fw={700} lh={1} c="var(--mantine-color-text)">
            {placement.number}
          </Text>
        </Group>
      </Link>
    </Tooltip>
  )
}
