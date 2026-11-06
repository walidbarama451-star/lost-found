/**
 * Single shared HTTP client for the Lost & Found API.
 *
 * Auth strategy: HttpOnly cookie — every request sends `credentials: 'include'`
 * and no token ever exists in JavaScript. A registered 401 handler clears the
 * current user and redirects to /login (spec 11).
 */

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export interface ApiFieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fields: ApiFieldError[];

  constructor(status: number, message: string, fields: ApiFieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }

  /** Field errors keyed by field name (first message wins). */
  fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const entry of this.fields) {
      if (result[entry.field] === undefined) {
        result[entry.field] = entry.message;
      }
    }
    return result;
  }
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorEnvelope {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}

/** Registered by the auth layer: clears the user and routes to /login. */
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** JSON body — serialized automatically. Do not combine with `formData`. */
  body?: unknown;
  /** Multipart body (image uploads). Server sets the boundary. */
  formData?: FormData;
  /** Query parameters; `undefined`, `null` and `''` entries are dropped. */
  query?: Record<string, string | number | undefined | null>;
  /**
   * Skip the global 401 → /login redirect. Used by the session bootstrap
   * (`GET /auth/me`) and by the login/register endpoints themselves, where a
   * 401/400 is an expected, locally-handled outcome.
   */
  skipAuthRedirect?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function isApiFieldError(value: unknown): value is ApiFieldError {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { field?: unknown; message?: unknown };
  return typeof candidate.field === 'string' && typeof candidate.message === 'string';
}

/** Performs an API request and unwraps the `{ success, data }` envelope. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, query, skipAuthRedirect = false } = options;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (formData) {
    payload = formData; // browser sets multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Check your connection and try again.');
  }

  let envelope: unknown = null;
  try {
    envelope = await response.json();
  } catch {
    envelope = null;
  }

  if (!response.ok) {
    const errorEnvelope = (envelope ?? {}) as Partial<ErrorEnvelope>;
    const message =
      typeof errorEnvelope.message === 'string' && errorEnvelope.message.length > 0
        ? errorEnvelope.message
        : `Request failed (${response.status})`;
    const fields = Array.isArray(errorEnvelope.errors)
      ? errorEnvelope.errors.filter(isApiFieldError)
      : [];

    if (response.status === 401 && !skipAuthRedirect) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, message, fields);
  }

  const successEnvelope = (envelope ?? null) as SuccessEnvelope<T> | null;
  if (successEnvelope && successEnvelope.success === true) {
    return successEnvelope.data;
  }
  throw new ApiError(response.status, 'The server returned an unexpected response.');
}

/** Prefixes API-relative image paths (`/uploads/…`) with the API origin. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith('/')) return url;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}${url}`;
}
