import {
  Alert,
  Anchor,
  Button,
  Center,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { PasswordInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMutation } from '@tanstack/react-query'
import { IconTool } from '@tabler/icons-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { login, register } from '../../../api/auth'
import { ApiError } from '../../../api/client'
import { t } from '../../../i18n'
import { useSession } from '../../../session/SessionContext'

const MIN_PASSWORD_LENGTH = 8

type LocationState = { from?: { pathname: string } }

export function LoginPage() {
  const [tab, setTab] = useState<string>('login')
  const { refresh } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  // Where the guard sent us from, so a link someone shared still works after
  // logging in.
  const destination = (location.state as LocationState | null)?.from?.pathname ?? '/'

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { displayName: '', email: '', password: '' },
    validate: {
      email: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : t('Podaj poprawny adres e-mail'),
      password: (value) =>
        value.length >= MIN_PASSWORD_LENGTH
          ? null
          : t('Hasło musi mieć co najmniej {n} znaków', { n: MIN_PASSWORD_LENGTH }),
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: { displayName: string; email: string; password: string }) => {
      if (tab === 'register') {
        return register({
          displayName: values.displayName || undefined,
          email: values.email,
          password: values.password,
        })
      }
      return login({ email: values.email, password: values.password })
    },
    onSuccess: async () => {
      // The cookie is set; the session query has to be re-asked before the app
      // knows what this account may do.
      await refresh()
      navigate(destination, { replace: true })
    },
  })

  const error = mutation.error instanceof ApiError ? mutation.error : null

  return (
    <Center mih="100dvh" p="md">
      <Stack w="100%" maw={420} gap="lg">
        <Stack align="center" gap={4}>
          <IconTool size={36} />
          <Title order={1} size="h2">
            ToolTrack
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            {t('Katalog narzędzi budowlanych. Wiesz, co masz i w jakim jest stanie.')}
          </Text>
        </Stack>

        <Paper withBorder shadow="sm" p="lg" radius="md">
          <Tabs
            value={tab}
            onChange={(value) => {
              setTab(value ?? 'login')
              mutation.reset()
            }}
            mb="md"
          >
            <Tabs.List grow>
              <Tabs.Tab value="login">{t('Logowanie')}</Tabs.Tab>
              <Tabs.Tab value="register">{t('Rejestracja')}</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
            <Stack gap="md">
              {error ? (
                <Alert color="red" variant="light">
                  {error.message}
                </Alert>
              ) : null}

              {tab === 'register' ? (
                <TextInput
                  label={t('Nazwa')}
                  placeholder={t('Jak mamy Cię podpisywać')}
                  description={t('Opcjonalne — domyślnie część adresu przed @')}
                  key={form.key('displayName')}
                  {...form.getInputProps('displayName')}
                />
              ) : null}

              <TextInput
                label={t('E-mail')}
                placeholder="ty@example.com"
                autoComplete="email"
                required
                key={form.key('email')}
                {...form.getInputProps('email')}
              />

              <PasswordInput
                label={t('Hasło')}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                required
                key={form.key('password')}
                {...form.getInputProps('password')}
              />

              <Button type="submit" loading={mutation.isPending} fullWidth>
                {tab === 'register' ? t('Załóż konto') : t('Zaloguj')}
              </Button>

              {tab === 'register' ? (
                <Text c="dimmed" size="xs" ta="center">
                  {t('Nowe konta dostają rolę')} <strong>{t('Podgląd')}</strong>{' '}
                  {t('— katalog widzisz od razu, o prawo do edycji poproś administratora.')}
                </Text>
              ) : (
                <Text c="dimmed" size="xs" ta="center">
                  {t('Nie masz konta?')}{' '}
                  <Anchor
                    component="button"
                    type="button"
                    size="xs"
                    onClick={() => setTab('register')}
                  >
                    {t('Zarejestruj się')}
                  </Anchor>
                </Text>
              )}
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Center>
  )
}
