import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Burger,
  Group,
  Menu,
  NavLink,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconLogout,
  IconMoon,
  IconBox,
  IconLayoutGrid,
  IconPhoto,
  IconSettings,
  IconSun,
  IconTool,
  IconUsers,
} from '@tabler/icons-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { ROLE_LABELS } from '../../features/tools/presentation'
import { useSession } from '../../session/SessionContext'

export function AppLayout() {
  const [opened, { close, toggle }] = useDisclosure()
  const { can, session, signOut } = useSession()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppShell
      padding="md"
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened, desktop: !session } }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            {session ? <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" /> : null}
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Group gap={8} wrap="nowrap">
                <IconTool size={22} />
                <Text fw={700} size="lg" c="var(--mantine-color-text)">
                  ToolTrack
                </Text>
              </Group>
            </Link>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <ColorSchemeToggle />
            {session ? <AccountMenu onSignOut={handleSignOut} /> : null}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <NavLink
          component={Link}
          to="/"
          label="Narzędzia"
          leftSection={<IconTool size={18} />}
          active={location.pathname === '/' || location.pathname.startsWith('/tools')}
          onClick={close}
        />
        <NavLink
          component={Link}
          to="/cases"
          label="Skrzynki"
          leftSection={<IconBox size={18} />}
          active={location.pathname.startsWith('/cases')}
          onClick={close}
        />
        <NavLink
          component={Link}
          to="/organizers"
          label="Organizer"
          leftSection={<IconLayoutGrid size={18} />}
          active={location.pathname.startsWith('/organizers')}
          onClick={close}
        />
        <NavLink
          component={Link}
          to="/photos"
          label="Zdjęcia"
          leftSection={<IconPhoto size={18} />}
          active={location.pathname.startsWith('/photos')}
          onClick={close}
        />
        <NavLink
          component={Link}
          to="/settings"
          label="Ustawienia"
          leftSection={<IconSettings size={18} />}
          active={location.pathname.startsWith('/settings')}
          onClick={close}
        />
        {/* Rendered from the capability, so the menu can never offer a screen
            the API would refuse. */}
        {can('users.manage') ? (
          <NavLink
            component={Link}
            to="/users"
            label="Użytkownicy"
            leftSection={<IconUsers size={18} />}
            active={location.pathname.startsWith('/users')}
            onClick={close}
          />
        ) : null}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

function AccountMenu({ onSignOut }: { onSignOut: () => void }) {
  const { session } = useSession()
  if (!session) return null

  return (
    <Menu position="bottom-end" width={220}>
      <Menu.Target>
        <Avatar color="amber" radius="xl" size="md" style={{ cursor: 'pointer' }}>
          {initials(session.user.displayName || session.user.email)}
        </Avatar>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Text size="sm" fw={600} truncate>
            {session.user.displayName || session.user.email}
          </Text>
          <Badge size="xs" variant="light" mt={4}>
            {ROLE_LABELS[session.effectiveRole]}
          </Badge>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={16} />} onClick={onSignOut}>
          Wyloguj
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const scheme = useComputedColorScheme('light')

  return (
    <Tooltip label={scheme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}>
      <ActionIcon
        variant="subtle"
        size="lg"
        aria-label="Przełącz motyw"
        onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}
      >
        {scheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
      </ActionIcon>
    </Tooltip>
  )
}

function initials(name: string): string {
  const parts = name.split(/[\s.@]+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
