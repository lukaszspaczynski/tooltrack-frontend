import { isApiError, request } from './client'
import type { Lang } from '../i18n/lang'
import type { Session, User } from './types'

export type Credentials = {
  email: string
  password: string
}

export type RegisterInput = Credentials & {
  displayName?: string
}

// Null rather than a thrown error when nobody is logged in: "no session" is a
// normal answer to this question, and the only one the login screen needs.
export async function fetchSession(): Promise<null | Session> {
  try {
    return await request<Session>('/auth/me')
  } catch (error) {
    if (isApiError(error, 401)) return null
    throw error
  }
}

export function login(credentials: Credentials): Promise<{ user: User }> {
  return request('/auth/login', { body: credentials, method: 'POST' })
}

export function register(input: RegisterInput): Promise<{ user: User }> {
  return request('/auth/register', { body: input, method: 'POST' })
}

// Which language this account reads in, kept on the account rather than in one
// browser. The answer is the whole session again, because the user being shown
// has just changed and asking for it a second time would be a round trip for
// something the server already sent.
export function setAccountLanguage(language: Lang): Promise<Session> {
  return request('/auth/language', { body: { language }, method: 'PATCH' })
}

export function logout(): Promise<{ ok: true }> {
  return request('/auth/logout', { method: 'POST' })
}
