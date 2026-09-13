import {
  ActionIcon,
  Anchor,
  Button,
  FileButton,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconCheck,
  IconCloudDownload,
  IconFileTypePdf,
  IconLink,
  IconPencil,
  IconTrash,
  IconUpload,
  IconX,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import {
  deleteManual,
  fetchManuals,
  importManualFromUrl,
  importManualsFromPage,
  renameManual,
  uploadManual,
} from '../../../api/manuals'
import { apiFileUrl } from '../../../api/client'
import type { Manual } from '../../../api/types'
import { COUNTS, t, tCount, tDate } from '../../../i18n'

// The PDFs that belong beside a tool: the manual from the box, a parts
// diagram, a safety sheet.
//
// Three ways in, and they are three because that is how a document actually
// reaches somebody — the file is on this laptop, it is one link away on the
// maker's website, or it is on the product page this card was imported from
// and nobody should have to go and find it again.
export function ManualPanel({
  canEdit,
  reference,
  toolId,
}: {
  canEdit: boolean
  // The address this card was read from, when it was imported. What "fetch the
  // manuals from the product page" starts with, so the common case is one
  // press rather than a paste.
  reference: string
  toolId: number
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<null | number>(null)
  const [url, setUrl] = useState('')

  const manuals = useQuery({
    queryKey: ['tool-manuals', toolId],
    queryFn: () => fetchManuals(toolId),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['tool-manuals', toolId] })
  const failed = (error: unknown) =>
    notifications.show({ color: 'red', message: (error as Error).message })

  const upload = useMutation({
    mutationFn: (file: File) => uploadManual(toolId, file),
    onSuccess: async () => {
      await refresh()
      notifications.show({ color: 'teal', message: t('Instrukcja dodana') })
    },
    onError: failed,
  })

  const fromUrl = useMutation({
    mutationFn: (address: string) => importManualFromUrl(toolId, address),
    onSuccess: async () => {
      setUrl('')
      await refresh()
      notifications.show({ color: 'teal', message: t('Instrukcja dodana') })
    },
    onError: failed,
  })

  const fromPage = useMutation({
    mutationFn: (address: string) => importManualsFromPage(toolId, address),
    onSuccess: async ({ manuals: added }) => {
      await refresh()
      notifications.show({
        color: 'teal',
        message: t('Pobrano {manuals}', { manuals: tCount(COUNTS.manual, added.length) }),
      })
    },
    onError: failed,
  })

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => renameManual(toolId, id, title),
    onSuccess: async () => {
      setEditing(null)
      await refresh()
    },
    onError: failed,
  })

  const drop = useMutation({
    mutationFn: (id: number) => deleteManual(toolId, id),
    onSuccess: refresh,
    onError: failed,
  })

  const items = manuals.data?.manuals ?? []
  const working = upload.isPending || fromUrl.isPending || fromPage.isPending || drop.isPending

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconFileTypePdf size={18} />
          <Text fw={600}>
            {t('Instrukcje')} {items.length > 0 ? `(${items.length})` : ''}
          </Text>
        </Group>
        {manuals.isFetching ? <Loader size="xs" /> : null}
      </Group>

      {manuals.isPending ? null : items.length === 0 ? (
        <Text c="dimmed" size="sm">
          {canEdit
            ? t('Brak instrukcji. Wgraj plik PDF, wklej adres albo pobierz ze strony producenta.')
            : t('Nikt nie dodał jeszcze instrukcji do tego narzędzia.')}
        </Text>
      ) : (
        <Stack gap={4}>
          {items.map((manual) =>
            editing === manual.id ? (
              <ManualTitleEdit
                key={manual.id}
                manual={manual}
                onCancel={() => setEditing(null)}
                onSave={(title) => rename.mutate({ id: manual.id, title })}
                pending={rename.isPending}
              />
            ) : (
              <Group key={manual.id} gap="xs" wrap="nowrap" justify="space-between">
                <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                  <IconFileTypePdf size={18} color="var(--mantine-color-red-7)" />
                  {/* A manual is opened, not downloaded: it is something to
                      read on the spot, on a phone, with gloves on. */}
                  <Anchor
                    href={apiFileUrl(manual.url)}
                    target="_blank"
                    rel="noopener"
                    size="sm"
                    lineClamp={1}
                    title={manual.title}
                  >
                    {manual.title}
                  </Anchor>
                  <Text span size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {megabytes(manual.byteSize)} · {tDate(manual.createdAt)}
                  </Text>
                </Group>

                {canEdit ? (
                  <Group gap={2} wrap="nowrap">
                    <Tooltip label={t('Zmień nazwę')}>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={t('Zmień nazwę instrukcji {title}', { title: manual.title })}
                        disabled={working}
                        onClick={() => setEditing(manual.id)}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t('Usuń instrukcję')}>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={t('Usuń instrukcję {title}', { title: manual.title })}
                        loading={drop.isPending && drop.variables === manual.id}
                        disabled={working}
                        onClick={() => drop.mutate(manual.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                ) : null}
              </Group>
            ),
          )}
        </Stack>
      )}

      {canEdit ? (
        <Stack gap="xs">
          <Group gap="sm" wrap="wrap">
            <FileButton accept="application/pdf" onChange={(file) => file && upload.mutate(file)}>
              {(props) => (
                <Button
                  {...props}
                  variant="light"
                  leftSection={<IconUpload size={18} />}
                  loading={upload.isPending}
                >
                  {t('Wgraj PDF')}
                </Button>
              )}
            </FileButton>

            {/* One press when the card was imported: the address it came from
                is already written on it. */}
            {reference ? (
              <Button
                variant="light"
                color="gray"
                leftSection={<IconCloudDownload size={18} />}
                loading={fromPage.isPending}
                onClick={() => fromPage.mutate(reference)}
              >
                {t('Pobierz ze strony producenta')}
              </Button>
            ) : null}
          </Group>

          <Group gap="sm" align="flex-end" wrap="wrap">
            <TextInput
              label={t('Albo wklej adres pliku PDF')}
              placeholder="https://…/instrukcja.pdf"
              leftSection={<IconLink size={16} />}
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && url.trim()) fromUrl.mutate(url.trim())
              }}
              style={{ flexGrow: 1 }}
              miw={220}
            />
            <Button
              variant="default"
              disabled={url.trim().length === 0}
              loading={fromUrl.isPending}
              onClick={() => fromUrl.mutate(url.trim())}
            >
              {t('Dodaj')}
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Stack>
  )
}

function ManualTitleEdit({
  manual,
  onCancel,
  onSave,
  pending,
}: {
  manual: Manual
  onCancel: () => void
  onSave: (title: string) => void
  pending: boolean
}) {
  const [title, setTitle] = useState(manual.title)
  const ready = title.trim().length > 0

  return (
    <Group gap="xs" wrap="nowrap">
      <TextInput
        size="xs"
        value={title}
        aria-label={t('Nazwa instrukcji')}
        onChange={(event) => setTitle(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && ready) onSave(title.trim())
          if (event.key === 'Escape') onCancel()
        }}
        style={{ flexGrow: 1 }}
      />
      <ActionIcon
        variant="subtle"
        color="teal"
        aria-label={t('Zapisz')}
        disabled={!ready}
        loading={pending}
        onClick={() => onSave(title.trim())}
      >
        <IconCheck size={16} />
      </ActionIcon>
      <ActionIcon variant="subtle" color="gray" aria-label={t('Anuluj')} onClick={onCancel}>
        <IconX size={16} />
      </ActionIcon>
    </Group>
  )
}

// A manual is measured in megabytes on a phone with one bar of signal, which
// is the number worth showing before somebody opens it.
function megabytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(Math.round(bytes / 1024), 1)} kB`
}
