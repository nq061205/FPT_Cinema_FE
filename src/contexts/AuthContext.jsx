import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth.js'
import { authService } from '../services/auth.service.js'
import { clearSession, getAccessToken, getStoredUser, setAccessToken, setStoredUser } from '../lib/storage.js'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAccessToken())
  const [user, setUser] = useState(() => getStoredUser())
  const [bootstrapping, setBootstrapping] = useState(Boolean(getAccessToken()))

  useEffect(() => {
    let mounted = true

    async function loadCurrentUser() {
      if (!token) {
        setBootstrapping(false)
        return
      }

      try {
        const currentUser = await authService.me()
        if (!mounted) return
        setUser(currentUser)
        setStoredUser(currentUser)
      } catch {
        if (!mounted) return
        clearSession()
        setToken(null)
        setUser(null)
      } finally {
        if (mounted) setBootstrapping(false)
      }
    }

    loadCurrentUser()

    return () => {
      mounted = false
    }
  }, [token])

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials)
    setAccessToken(response.accessToken)
    setStoredUser(response)
    setToken(response.accessToken)
    setUser(response)
    return response
  }, [])

  const register = useCallback((payload) => authService.register(payload), [])

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await authService.logout()
      }
    } finally {
      clearSession()
      setToken(null)
      setUser(null)
    }
  }, [])

  const hasRole = useCallback(
    (roles = []) => {
      if (!roles.length) return true
      return roles.some((role) => role.toUpperCase() === user?.role?.toUpperCase())
    },
    [user],
  )

  const hasPermission = useCallback(
    (permissions = []) => {
      if (!permissions.length) return true
      const userPermissions = user?.permissions ?? []
      return permissions.some((permission) => userPermissions.includes(permission))
    },
    [user],
  )

  const value = useMemo(
    () => ({
      bootstrapping,
      hasPermission,
      hasRole,
      isAuthenticated: Boolean(token),
      login,
      logout,
      register,
      token,
      user,
    }),
    [bootstrapping, hasPermission, hasRole, login, logout, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
