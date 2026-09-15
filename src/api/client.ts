// The one place this app talks to the API.
//
// Every call goes through `request`, which means every call sends the session
// cookie, parses errors the same way, and turns a failure into an ApiError
// carrying the status and the code. Screens react to those and never to the
// message, which is prose in whatever language the request asked for.
//
// The status is the coarse decision — log in again, ask an admin, give up — and
// the code is which failure it actually was. They are not interchangeable: four
// different conflicts answer 409, and telling "this serial number is taken"
// from "this is the last active admin" by reading Polish is how a screen breaks
// the first time somebody rewords a sentence.

// Same-origin by default. In development Vite proxies /api to the Node server
// (see vite.config.ts), so the cookie is first-party and no CORS is involved.
import { getLang, t } from '../i18n'
import type { components } from './schema'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// Every failure the API can name, straight out of the contract: the enum in
// docs/openapi.json, which is itself read from the server's own catalogue. A
// code this app checks for and the server cannot send is a type error here.
export type ApiErrorCode = NonNullable<components['schemas']['Error']>['code']

export class ApiError extends Error {
  // Absent only when the failure had no body to read — a network error, or a
  // proxy answering with something that is not this API.
  readonly code: null | ApiErrorCode
  readonly status: number

  constructor(
    status: number,
    message: string,
    code: null | ApiErrorCode = null,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.code = code
    this.name = 'ApiError'
    this.status = status
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  if (!(error instanceof ApiError)) return false
  return status === undefined || error.status === status
}

// Which failure this was, when it is one the screen has something to say about.
// Narrowing on the code rather than the status is what lets two conflicts on
// one page mean two different things.
export function hasCode(error: unknown, ...codes: ApiErrorCode[]): error is ApiError {
  return error instanceof ApiError && error.code !== null && codes.includes(error.code)
}

// The API hands back paths like /api/items/7/photos/3/file. Same-origin (the
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
      headers: {
        // What language the answer should be written in. The API's messages
        // are shown as they come, so this is what keeps an error on an English
        // screen from arriving in Polish.
        'accept-language': getLang(),
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      method: options.method ?? 'GET',
    })
  } catch (cause) {
    // A network failure has no status. On a phone in the field this is the
    // common one, so it says so rather than "Unexpected error".
    throw new ApiError(0, t('Brak połączenia z serwerem'), null, { cause })
  }

  const payload = await readJson(response)

  if (!response.ok) {
    const message =
      typeof payload?.error === 'string' ? payload.error : defaultMessage(response.status)
    // Not validated against the enum: a server newer than this build may name a
    // failure this one has never heard of, and the right answer to that is the
    // default message rather than a crash.
    const code = (typeof payload?.code === 'string' ? payload.code : null) as null | ApiErrorCode

    throw new ApiError(response.status, message, code)
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
