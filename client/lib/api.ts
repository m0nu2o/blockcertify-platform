export const API_URL =
  typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
    ? 'https://blockcertify-api.onrender.com/api'
    : (process.env.NEXT_PUBLIC_API_URL || 'https://blockcertify-api.onrender.com/api');

export class ApiHttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit & { token?: string; timeoutMs?: number }) {
  const headers = new Headers(options?.headers || {});
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  if (options?.token) headers.set('Authorization', `Bearer ${options.token}`);

  const timeoutMs = options?.timeoutMs || 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const cleanPath = path.startsWith('/api/') ? path.slice(4) : path.startsWith('api/') ? path.slice(3) : path;
    const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const response = await fetch(`${API_URL}${finalPath}`, {
      ...options,
      headers,
      signal: options?.signal || controller.signal,
      cache: 'no-store',
    });

    const rawText = await response.text();
    let data: any = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { message: rawText || 'Unexpected server response' };
    }

    if (!response.ok) {
      throw new ApiHttpError(data?.message || `Request failed (${response.status})`, response.status);
    }
    return data as T;
  } catch (err: unknown) {
    if (err instanceof ApiHttpError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
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
