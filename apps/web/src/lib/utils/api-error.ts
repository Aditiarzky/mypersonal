import type { ApiError } from '../types/api';

export class ApiException extends Error {
  constructor(
    public readonly error: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(details?.message as string || error);
    this.name = 'ApiException';
  }

  static fromResponse(status: number, body: ApiError): ApiException {
    return new ApiException(body.error, status, body);
  }
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    value.success === false &&
    'error' in value
  );
}
