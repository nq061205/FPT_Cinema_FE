import axios from 'axios'
import { env } from '../config/env.js'
import { clearSession, getAccessToken } from './storage.js'

export class ApiError extends Error {
  constructor(message, meta = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = meta.status
    this.code = meta.code
    this.details = meta.details
  }
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl.replace(/\/$/, ''),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data

    if (payload && Object.prototype.hasOwnProperty.call(payload, 'result')) {
      return payload.result
    }

    return payload
  },
  (error) => {
    const payload = error.response?.data
    const status = error.response?.status
    const message = payload?.message ?? error.message ?? 'Request failed'

    if (status === 401) {
      clearSession()
    }

    return Promise.reject(
      new ApiError(message, {
        status,
        code: payload?.code,
        details: payload,
      }),
    )
  },
)
