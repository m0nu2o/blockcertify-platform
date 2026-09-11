
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch<T>(path: string, options?: RequestInit & { token?: string; timeoutMs?: number }) {
  const headers = new Headers(options?.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (options?.token) headers.set('Authorization', `Bearer ${options.token}`);

  const timeoutMs = options?.timeoutMs || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options?.signal || controller.signal,
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data as T;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check backend connection.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const buildUploadHeaders = (token?: string) => {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
};
