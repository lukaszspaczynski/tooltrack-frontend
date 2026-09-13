import { ActionIcon, Menu, Tooltip } from '@mantine/core'
import { IconLanguage } from '@tabler/icons-react'

import { useLanguage } from './I18nContext'
import { LANG_NAMES, LANGS, t } from './index'

// In the header rather than in Settings, and outside the session, because the
// login screen is the first thing somebody who does not read Polish sees.
export function LanguageMenu() {
  const { lang, setLang } = useLanguage()

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
            onClick={() => setLang(option)}
            fw={option === lang ? 700 : undefined}
          >
            {LANG_NAMES[option]}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}
