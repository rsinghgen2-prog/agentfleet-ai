const isDev = import.meta.env.DEV
const absoluteUrl = (value: unknown) => {
	const url = String(value || '').trim().replace(/\/$/, '')
	return /^https?:\/\//i.test(url) ? url : ''
}

/** Same-origin in Vite so /api/v1/auth and /api/v1/patients go through the dev proxy. */
export const AUTH_API_URL = isDev ? '' : absoluteUrl(import.meta.env.VITE_AUTH_API_URL)
export const API_BASE_URL = isDev ? '' : absoluteUrl(import.meta.env.VITE_API_URL)
