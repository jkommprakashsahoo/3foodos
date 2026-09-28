export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ApiPayload = {
  success?: boolean;
  error?: string;
  message?: string;
  code?: string;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = localStorage.getItem('foodwise_auth_token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError('Unable to reach FoodWise. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }

  let payload: ApiPayload;
  try {
    payload = await response.json() as ApiPayload;
  } catch {
    throw new ApiError('The server returned an unreadable response. Please try again.', response.status, 'INVALID_RESPONSE');
  }

  if (!response.ok || payload.success === false) {
    const message = payload.error || payload.message || `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, payload.code);
  }

  return payload as T;
}

export function get<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}
