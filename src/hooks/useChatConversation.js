import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './useAuth.js'
import { chatService } from '../services/chat.service.js'

const CHAT_CONVERSATION_KEY_PREFIX = 'fpt_cinema_chat_conversation'
const bootRequests = new Map()

function getUserKey(user) {
  const identifier = user?.userId ?? user?.id ?? user?.email
  return identifier === undefined || identifier === null ? null : String(identifier)
}

function getStorageKey(userKey) {
  return `${CHAT_CONVERSATION_KEY_PREFIX}:${userKey}`
}

function getMessagesStorageKey(storageKey) {
  return `${storageKey}:messages`
}

function readConversationId(storageKey) {
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

function saveConversationId(storageKey, conversationId) {
  try {
    window.localStorage.setItem(storageKey, String(conversationId))
  } catch {
    // The server remains the source of truth when browser storage is unavailable.
  }
}

function removeConversationId(storageKey) {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function readCachedMessages(storageKey) {
  try {
    const raw = window.localStorage.getItem(getMessagesStorageKey(storageKey))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCachedMessages(storageKey, messages) {
  try {
    // Keep ten complete user/assistant turns locally. The backend remains the
    // source of truth and currently sends the same last 20 messages to Gemini.
    window.localStorage.setItem(getMessagesStorageKey(storageKey), JSON.stringify(messages.slice(-20)))
  } catch {
    // Storage may be disabled or full; the live conversation still works.
  }
}

function removeCachedMessages(storageKey) {
  try {
    window.localStorage.removeItem(getMessagesStorageKey(storageKey))
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function isMissingConversation(error) {
  return error?.status === 404 || Number(error?.code) === 3001
}

function isClosedConversation(error) {
  return error?.status === 409 || Number(error?.code) === 3002
}

async function createConversation(storageKey) {
  const conversation = await chatService.createConversation()
  saveConversationId(storageKey, conversation.id)
  removeCachedMessages(storageKey)
  return { conversation, messages: [] }
}

async function restoreOrCreateConversation(storageKey) {
  const savedConversationId = readConversationId(storageKey)
  const cachedMessages = readCachedMessages(storageKey)

  if (savedConversationId) {
    try {
      const messages = await chatService.messages(savedConversationId)
      saveCachedMessages(storageKey, Array.isArray(messages) ? messages : [])
      return {
        conversation: { id: savedConversationId, status: 'OPEN' },
        messages: Array.isArray(messages) ? messages : [],
      }
    } catch (error) {
      if (isMissingConversation(error)) {
        removeConversationId(storageKey)
        removeCachedMessages(storageKey)
        return createConversation(storageKey)
      } else if (cachedMessages.length) {
        // Keep the last cached turns visible during a temporary network/API
        // outage. A later send still goes through the server and can recover.
        return {
          conversation: { id: savedConversationId, status: 'OPEN' },
          messages: cachedMessages,
        }
      } else {
        throw error
      }
    }
  }

  if (cachedMessages.length && savedConversationId) {
    return {
      conversation: { id: savedConversationId, status: 'OPEN' },
      messages: cachedMessages,
    }
  }

  return createConversation(storageKey)
}

function getBootRequest(storageKey) {
  if (!bootRequests.has(storageKey)) {
    const request = restoreOrCreateConversation(storageKey).finally(() => {
      bootRequests.delete(storageKey)
    })
    bootRequests.set(storageKey, request)
  }

  return bootRequests.get(storageKey)
}

function localMessageId(sender) {
  return `local-${sender.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useChatConversation({ enabled = true } = {}) {
  const { isAuthenticated, user } = useAuth()
  const userKey = useMemo(() => getUserKey(user), [user])
  const storageKey = useMemo(() => (userKey ? getStorageKey(userKey) : null), [userKey])
  const requestVersionRef = useRef(0)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const loadConversation = useCallback(async () => {
    if (!enabled || !isAuthenticated || !storageKey) return

    const requestVersion = ++requestVersionRef.current
    setConversation(null)
    setMessages([])
    setLoading(true)
    setError(null)

    try {
      const restored = await getBootRequest(storageKey)
      if (requestVersion !== requestVersionRef.current) return
      setConversation(restored.conversation)
      setMessages(restored.messages)
    } catch (loadError) {
      if (requestVersion !== requestVersionRef.current) return
      setError(loadError)
    } finally {
      if (requestVersion === requestVersionRef.current) setLoading(false)
    }
  }, [enabled, isAuthenticated, storageKey])

  useEffect(() => {
    if (!enabled || !isAuthenticated || !storageKey) {
      requestVersionRef.current += 1
      return undefined
    }

    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) return loadConversation()
      return undefined
    })
    return () => {
      cancelled = true
      requestVersionRef.current += 1
    }
  }, [enabled, isAuthenticated, loadConversation, storageKey])

  const sendMessage = useCallback(
    async (rawMessage) => {
      const content = rawMessage.trim()
      if (!content || !conversation?.id || sending) return null

      const optimisticMessage = {
        id: localMessageId('USER'),
        sender: 'USER',
        content,
        createdAt: new Date().toISOString(),
      }

      setSending(true)
      setError(null)
      setMessages((current) => {
        const next = [...current, optimisticMessage]
        if (storageKey) saveCachedMessages(storageKey, next)
        return next
      })

      try {
        let activeConversation = conversation
        let reply

        try {
          reply = await chatService.sendMessage(activeConversation.id, content)
        } catch (sendError) {
          if (!isClosedConversation(sendError) || !storageKey) throw sendError

          removeConversationId(storageKey)
          const freshChat = await createConversation(storageKey)
          activeConversation = freshChat.conversation
          setConversation(activeConversation)
          setMessages([optimisticMessage])
          saveCachedMessages(storageKey, [optimisticMessage])
          reply = await chatService.sendMessage(activeConversation.id, content)
        }

        const botMessage = {
          id: localMessageId('BOT'),
          sender: 'BOT',
          content: reply.answer,
          intent: reply.intent,
          createdAt: new Date().toISOString(),
        }

        setMessages((current) => {
          const next = [...current, botMessage]
          if (storageKey) saveCachedMessages(storageKey, next)
          return next
        })
        return reply
      } catch (sendError) {
        setError(sendError)
        setMessages((current) => {
          const next = current.map((message) => message.id === optimisticMessage.id ? { ...message, failed: true } : message)
          if (storageKey) saveCachedMessages(storageKey, next)
          return next
        })
        throw sendError
      } finally {
        setSending(false)
      }
    },
    [conversation, sending, storageKey],
  )

  const newConversation = useCallback(async () => {
    if (!storageKey || !isAuthenticated) return null

    setLoading(true)
    setError(null)
    try {
      if (conversation?.id) {
        try {
          await chatService.close(conversation.id)
        } catch (closeError) {
          // A conversation may already have been closed or removed. In both
          // cases creating a fresh one is the correct recovery path.
          if (!isMissingConversation(closeError) && !isClosedConversation(closeError)) throw closeError
        }
      }
      removeConversationId(storageKey)
      removeCachedMessages(storageKey)
      const fresh = await createConversation(storageKey)
      setConversation(fresh.conversation)
      setMessages([])
      return fresh.conversation
    } catch (newConversationError) {
      setError(newConversationError)
      throw newConversationError
    } finally {
      setLoading(false)
    }
  }, [conversation, isAuthenticated, storageKey])

  return {
    conversation,
    error,
    loading,
    messages,
    newConversation,
    reload: loadConversation,
    sendMessage,
    sending,
  }
}
