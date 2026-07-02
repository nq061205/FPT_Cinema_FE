const TOKEN_KEY = 'fpt_cinema_access_token'
const USER_KEY = 'fpt_cinema_user'

export function getAccessToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token) {
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY)
    return
  }

  window.localStorage.setItem(TOKEN_KEY, token)
}

export function getStoredUser() {
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    window.localStorage.removeItem(USER_KEY)
    return null
  }
}

export function setStoredUser(user) {
  if (!user) {
    window.localStorage.removeItem(USER_KEY)
    return
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}
