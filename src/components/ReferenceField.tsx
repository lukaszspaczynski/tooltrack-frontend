import { Anchor, Stack, Text } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'

import { t } from '../i18n'

// Where a card was read from, on the reading side of a detail page.
//
// It shows at all because it used to: the address was a parameter called
// Referencja and sat in the spec sheet where anybody could see it. Moving it
// into a column took it off the screen as well, which is not what moving a
// field is supposed to mean.
//
// A link rather than text. The reason to look at it is to open it — the maker
// corrected a spec, somebody wants the manual — and an address that has to be
// selected and copied is an address nobody follows. The whole thing rather
// than the host, because two cards from one shop differ only in the path;
// `break-all` is what keeps a long one from widening the page on a phone.
export function ReferenceField({ url }: { url: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {t('Strona producenta')}
      </Text>

      {url ? (
        <Anchor
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          size="sm"
          style={{ wordBreak: 'break-all' }}
        >
          {url} <IconExternalLink size={13} style={{ verticalAlign: '-1px' }} />
        </Anchor>
      ) : (
        <Text size="sm" c="dimmed">
          —
        </Text>
      )}
    </Stack>
  )
}
