import {
  Alert,
  Button,
  FileButton,
  Group,
  List,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconFileTypePdf, IconLink, IconUpload } from '@tabler/icons-react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { importManualFromUrl, importManualsFromPage, uploadManual } from '../../../api/manuals'
import { fetchImportSources, fetchTools } from '../../../api/tools'
import { COUNTS, tCount } from '../../../i18n'
import { t } from '../../../i18n'

// Where the file comes from. A shop's product page is the third way because it
// is how a document actually arrives for an imported card: the maker publishes
// it, and nobody should have to go and find the PDF by hand.
type Way = 'file' | 'page' | 'url'

// Adding a document from the library rather than from a card.
//
// It asks which tool first, and it is not being polite about it: a manual with
// no tool is a document nobody will ever look for, and the rule that clears
// unused files would treat it as one. So the tool is the first field and
// nothing can be sent without it.
export function AddManualModal({ onClose, opened }: { onClose: () => void; opened: boolean }) {
  const queryClient = useQueryClient()
  // Three ways, and they exclude each other: which file this is, is a question
  // for the person rather than for the screen, so it is asked once instead of
  // being guessed from which of three fields was filled in.
  const [way, setWay] = useState<Way>('file')
  const [toolId, setToolId] = useState<null | string>(null)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState<null | string>(null)
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<null | File>(null)

  const [pageUrl, setPageUrl] = useState('')

  const applySearch = useDebouncedCallback((value: string) => setSearch(value.trim() || null), 300)

  // Only the shops this server can read, and only when that is the way chosen:
  // the answer to "why was my link refused" belongs on the screen that refused
  // it.
  const sources = useQuery({
    queryKey: ['tool-import-sources'],
    queryFn: fetchImportSources,
    enabled: opened && way === 'page',
    staleTime: 60 * 60 * 1000,
  })

  // Only the pages that publish documents. Offering a shop here would be
  // promising a file it does not have: most shops sell the tool and leave the
  // manual to the maker.
  const pages = (sources.data?.sources ?? []).filter((source) => source.manuals)

  const tools = useQuery({
    queryKey: ['manual-tool-picker', search],
    queryFn: () =>
      fetchTools({
        category: null,
        condition: null,
        direction: 'asc',
        limit: 50,
        offset: 0,
        search,
        sort: 'name',
      }),
    enabled: opened,
    placeholderData: keepPreviousData,
  })

  const done = async (message: string) => {
    await queryClient.invalidateQueries({ queryKey: ['manual-library'] })
    await queryClient.invalidateQueries({ queryKey: ['tool-manuals'] })
    notifications.show({ color: 'teal', message })
    setUrl('')
    setPageUrl('')
    setFile(null)
    onClose()
  }

  const failed = (error: unknown) =>
    notifications.show({ color: 'red', message: (error as Error).message })

  const upload = useMutation({
    mutationFn: (chosen: { file: File; toolId: number }) =>
      uploadManual(chosen.toolId, chosen.file),
    onSuccess: () => done(t('Instrukcja dodana')),
    onError: failed,
  })

  const fromUrl = useMutation({
    mutationFn: (chosen: { toolId: number; url: string }) =>
      importManualFromUrl(chosen.toolId, chosen.url),
    onSuccess: () => done(t('Instrukcja dodana')),
    onError: failed,
  })

  // Everything a product page publishes, at once — the same call the card's
  // panel makes, which is why it refuses an unreadable shop in the same words.
  const fromPage = useMutation({
    mutationFn: (chosen: { toolId: number; url: string }) =>
      importManualsFromPage(chosen.toolId, chosen.url),
    onSuccess: ({ failed: refused, manuals }) => {
      if (refused.length > 0) {
        notifications.show({
          color: 'orange',
          message: t('Pobrano {manuals}, nie udało się: {failed}', {
            failed: refused.length,
            manuals: tCount(COUNTS.manual, manuals.length),
          }),
        })
      }

      return done(t('Pobrano {manuals}', { manuals: tCount(COUNTS.manual, manuals.length) }))
    },
    onError: failed,
  })

  const chosen = Number(toolId)
  const ready = Number.isInteger(chosen) && chosen > 0
  const working = upload.isPending || fromUrl.isPending || fromPage.isPending

  const given =
    way === 'file'
      ? file !== null
      : way === 'url'
        ? url.trim().length > 0
        : pageUrl.trim().length > 0

  const submit = () => {
    if (!ready || !given) return

    if (way === 'file' && file) upload.mutate({ file, toolId: chosen })
    if (way === 'url') fromUrl.mutate({ toolId: chosen, url: url.trim() })
    if (way === 'page') fromPage.mutate({ toolId: chosen, url: pageUrl.trim() })
  }

  return (
    <Modal opened={opened} onClose={onClose} title={t('Dodaj instrukcję')} centered>
      <Stack gap="md">
        {/* The model beside the name, because a shelf of cards called "Sekator
            akumulatorowy" is told apart by it and by nothing else. */}
        <Select
          label={t('Narzędzie')}
          description={t('Do którego narzędzia należy ten plik')}
          placeholder={t('Szukaj narzędzia')}
          searchable
          data={(tools.data?.items ?? []).map((tool) => ({
            label: tool.model ? `${tool.name} · ${tool.model}` : tool.name,
            value: String(tool.id),
          }))}
          value={toolId}
          onChange={setToolId}
          searchValue={searchText}
          onSearchChange={(value) => {
            setSearchText(value)
            applySearch(value)
          }}
          nothingFoundMessage={t('Nic nie pasuje.')}
          data-autofocus
        />

        <SegmentedControl
          fullWidth
          value={way}
          onChange={(value) => setWay(value as Way)}
          data={[
            { label: t('Plik z dysku'), value: 'file' },
            { label: t('Adres PDF'), value: 'url' },
            { label: t('Karta produktu'), value: 'page' },
          ]}
        />

        {way === 'file' ? (
          <Group gap="sm" align="center">
            <FileButton accept="application/pdf" onChange={setFile}>
              {(props) => (
                <Button {...props} variant="light" leftSection={<IconUpload size={18} />}>
                  {t('Wybierz plik PDF')}
                </Button>
              )}
            </FileButton>
            {file ? (
              <Group gap={4} wrap="nowrap">
                <IconFileTypePdf size={16} color="var(--mantine-color-red-7)" />
                <Text size="sm" lineClamp={1}>
                  {file.name}
                </Text>
              </Group>
            ) : null}
          </Group>
        ) : null}

        {way === 'url' ? (
          <TextInput
            label={t('Adres pliku PDF')}
            placeholder="https://…/instrukcja.pdf"
            leftSection={<IconLink size={16} />}
            value={url}
            onChange={(event) => setUrl(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit()
            }}
            data-autofocus
          />
        ) : null}

        {way === 'page' ? (
          <Stack gap="xs">
            <TextInput
              label={t('Adres karty produktu')}
              description={t('Pobierze wszystkie instrukcje, które ta strona udostępnia')}
              placeholder={`https://${pages[0]?.host ?? ''}/…`}
              leftSection={<IconLink size={16} />}
              value={pageUrl}
              onChange={(event) => setPageUrl(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit()
              }}
            />
            <Alert color="gray" variant="light">
              <Text size="xs">{t('Obsługiwane źródła:')}</Text>
              <List size="xs" withPadding>
                {pages.map((source) => (
                  <List.Item key={source.host}>{source.label}</List.Item>
                ))}
              </List>
            </Alert>
          </Stack>
        ) : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={working}>
            {t('Anuluj')}
          </Button>
          <Button loading={working} disabled={!ready || !given} onClick={submit}>
            {t('Dodaj')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
