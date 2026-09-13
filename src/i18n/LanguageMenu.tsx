import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconLanguage } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'

import { setAccountLanguage } from '../api/auth'
import { SESSION_QUERY_KEY, useSession } from '../session/SessionContext'
import { LANG_NAMES, LANGS, setLang, t, type Lang } from './index'
import { useLanguage } from './useLanguage'

// In the header rather than in Settings, and outside the session, because the
// login screen is the first thing somebody who does not read Polish sees.
export function LanguageMenu() {
  const lang = useLanguage()
  const { session } = useSession()
  const queryClient = useQueryClient()

  // The screen switches first: a slow network is no reason to go on reading a
  // language nobody asked for. Signed in, the choice then goes to the account,
  // because that is where it belongs — this browser is not the only one.
  //
  // Deliberately not a `useMutation`: switching the language remounts the
  // whole tree, this component with it, and the observer's callbacks would go
  // too. The cache write and the message about a failure have to outlive that,
  // and the query client does — it is provided above the remount.
  const choose = (next: Lang) => {
    setLang(next)
    if (!session) return

    setAccountLanguage(next)
      .then((updated) => queryClient.setQueryData(SESSION_QUERY_KEY, updated))
      .catch((error: unknown) =>
        notifications.show({ color: 'red', message: (error as Error).message }),
      )
  }

  return (
    <Menu position="bottom-end" width={160}>
      <Menu.Target>
        <Tooltip label={t('Język')}>
          <ActionIcon variant="subtle" size="lg" aria-label={t('Zmień język')}>
            <IconLanguage size={18} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        {LANGS.map((option) => (
          <Menu.Item
            key={option}
            onClick={() => choose(option)}
            fw={option === lang ? 700 : undefined}
          >
            {LANG_NAMES[option]}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
