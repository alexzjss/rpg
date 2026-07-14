import type { LoginInput, LoginResult, OnlineSession } from './contracts';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a solicitação.');
  return body as T;
}

export const OnlineAuth = {
  login: (input: LoginInput) => request<LoginResult>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  session: () => request<{ session: OnlineSession | null }>('/api/auth/session'),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST', body: '{}' }),
};
