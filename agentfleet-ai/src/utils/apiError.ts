export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function describeApiError(error: unknown, fallback = 'Unable to load clinic data from the backend.') {
  const status = error instanceof ApiError ? error.status : undefined
  const message = error instanceof Error ? error.message : ''
  if (status === 401 || /invalid or expired|authentication required|session expired/i.test(message)) {
    return 'Your session expired or is missing. Sign in again to load clinic data.'
  }
  if (status === 403 || /insufficient permissions/i.test(message)) {
    return 'You do not have permission to view this clinic data.'
  }
  if (status === 404) return 'The requested clinic record was not found.'
  if (status && status >= 500) return 'The clinic API returned an error. Retry in a moment.'
  if (/failed to fetch|networkerror|load failed|unreachable/i.test(message)) {
    return 'The clinic API is unreachable. Confirm the patient service is running and VITE_API_URL is set.'
  }
  if (/invalid response/i.test(message)) {
    return 'The clinic API returned an unexpected response. Check the patient service and try again.'
  }
  return message || fallback
}
