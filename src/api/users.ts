import { request } from './client'
import type { AccountStatus, ManagedUser, Role } from './types'

export function fetchUsers(): Promise<{ users: ManagedUser[] }> {
  return request('/users')
}

export function updateUser(
  id: number,
  patch: { displayName?: string; role?: Role; status?: AccountStatus },
): Promise<{ user: ManagedUser }> {
  return request(`/users/${id}`, { body: patch, method: 'PATCH' })
}

export function deleteUser(id: number): Promise<{ ok: true }> {
  return request(`/users/${id}`, { method: 'DELETE' })
}
