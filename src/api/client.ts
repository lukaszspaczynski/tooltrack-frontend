// The one place this app talks to the API.
//
// Every call goes through `request`, which means every call sends the session
// cookie, parses errors the same way, and turns a failure into an ApiError
// carrying the status. Screens then react to the status rather than to a
// message: 401 means log in again, 403 means ask an admin, 409 means the row
// conflicts with one that already exists.

// Same-origin by default. In development Vite proxies /api to the Node server
// (see vite.config.ts), so the cookie is first-party and no CORS is involved.
import { t } from '../i18n'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  if (!(error instanceof ApiError)) return false
  return status === undefined || error.status === status
}

// The API hands back paths like /api/tools/7/photos/3/file. Same-origin (the
// dev proxy, or one reverse proxy in front of both) that is already the right
// src for an <img>. When the API lives elsewhere it has to be rebased, and
// this is the one place that knows where it lives.
export function apiFileUrl(path: string): string {
  return path.startsWith('/api/') ? `${BASE_URL}${path.slice('/api'.length)}` : path
}

type RequestOptions = {
  body?: unknown
  method?: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'
  search?: URLSearchParams
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const query = options.search?.toString()
  const url = `${BASE_URL}${path}${query ? `?${query}` : ''}`

  let response: Response
  try {
    response = await fetch(url, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      // Without this the browser sends no cookie and every call is anonymous.
      credentials: 'include',
      headers: options.body === undefined ? undefined : { 'content-type': 'application/json' },
      method: options.method ?? 'GET',
    })
  } catch (cause) {
    // A network failure has no status. On a phone in the field this is the
    // common one, so it says so rather than "Unexpected error".
    throw new ApiError(0, t('Brak połączenia z serwerem'), { cause })
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string' ? payload.error : defaultMessage(response.status)
    throw new ApiError(response.status, message)
  }

  return payload as T
}

async function readJson(response: Response): Promise<null | Record<string, unknown>> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
}

function defaultMessage(status: number): string {
  switch (status) {
    case 401:
      return t('Sesja wygasła. Zaloguj się ponownie.')
    case 403:
      return t('Brak uprawnień do tej operacji.')
    case 404:
      return t('Nie znaleziono.')
    case 503:
      return t('Baza danych jest chwilowo niedostępna. Spróbuj ponownie.')
    default:
      return t('Coś poszło nie tak.')
  }
}
