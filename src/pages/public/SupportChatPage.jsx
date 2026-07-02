import { useEffect, useRef, useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { formatDateTime } from '../../lib/formatters.js'
import { chatService } from '../../services/chat.service.js'

function SupportChatPage() {
  const startedRef = useRef(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function bootChat() {
      try {
        const created = await chatService.createConversation()
        setConversation(created)
        const history = await chatService.messages(created.id)
        setMessages(history ?? [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    bootChat()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!draft.trim() || !conversation?.id) return

    setSending(true)
    setError(null)

    try {
      const reply = await chatService.sendMessage(conversation.id, draft.trim())
      setMessages((current) => [
        ...current,
        { id: `local-${Date.now()}`, sender: 'USER', content: draft.trim(), createdAt: new Date().toISOString() },
        { id: `bot-${Date.now()}`, sender: 'ASSISTANT', content: reply.answer, intent: reply.intent, createdAt: new Date().toISOString() },
      ])
      setDraft('')
    } catch (err) {
      setError(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="AI support" title="Support chat" description="Conversation API for authenticated cinema users." />

      <ErrorMessage error={error} title="Chat error" />

      <article className="panel chat-panel">
        <div className="chat-log">
          {loading ? <p className="muted">Starting conversation...</p> : null}
          {messages.map((message) => (
            <div className={`chat-message chat-message--${String(message.sender).toLowerCase()}`} key={message.id}>
              <strong>{message.sender}</strong>
              <p>{message.content}</p>
              <small>{formatDateTime(message.createdAt)}</small>
            </div>
          ))}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <input
            className="form-control"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about movies or tickets"
          />
          <button className="btn btn-danger" type="submit" disabled={sending || !conversation?.id}>
            Send
          </button>
        </form>
      </article>
    </section>
  )
}

export default SupportChatPage
