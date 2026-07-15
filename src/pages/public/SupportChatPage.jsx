import { useEffect, useRef, useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { useChatConversation } from '../../hooks/useChatConversation.js'
import { formatDateTime } from '../../lib/formatters.js'

function SupportChatPage() {
  const [draft, setDraft] = useState('')
  const logEndRef = useRef(null)
  const { conversation, error, loading, messages, newConversation, reload, sendMessage, sending } = useChatConversation()

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, loading, sending])

  async function handleSubmit(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !conversation?.id || sending) return

    setDraft('')
    try {
      await sendMessage(content)
    } catch {
      // The shared hook keeps the failed message visible and exposes the error below.
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="AI support"
        title="Support chat"
        description="Lịch sử cuộc hội thoại được lưu theo tài khoản để bạn có thể tiếp tục sau khi quay lại."
      />

      <ErrorMessage error={error} title="Chat error" />
      {error && !conversation?.id ? (
        <button className="btn btn-outline-danger align-self-start" type="button" onClick={reload} disabled={loading}>
          Thử mở lại cuộc hội thoại
        </button>
      ) : null}

      <article className="panel chat-panel">
        <div className="chat-panel__toolbar d-flex justify-content-end">
          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => newConversation().catch(() => {})} disabled={loading || sending}>
            Cuộc hội thoại mới
          </button>
        </div>
        <div className="chat-log" role="log" aria-live="polite" aria-busy={loading || sending}>
          {loading ? <p className="muted">Đang mở lại cuộc hội thoại...</p> : null}
          {!loading && !messages.length && !error ? (
            <p className="muted">Hãy hỏi tôi về phim, lịch chiếu hoặc đặt vé.</p>
          ) : null}
          {messages.map((message) => {
            const sender = String(message.sender).toUpperCase()
            const isUser = sender === 'USER'
            return (
              <div className={`chat-message chat-message--${isUser ? 'user' : 'assistant'}`} key={message.id}>
                <strong>{isUser ? 'Bạn' : 'FPT Cinema AI'}</strong>
                <p>{message.content}</p>
                <small>
                  {formatDateTime(message.createdAt)}
                  {message.failed ? ' · Chưa gửi được' : ''}
                </small>
              </div>
            )
          })}
          {sending ? <p className="muted">Trợ lý đang trả lời...</p> : null}
          <div ref={logEndRef} />
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <textarea
            className="form-control"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Hỏi về phim hoặc vé..."
            aria-label="Tin nhắn cho trợ lý"
            rows="1"
            maxLength="2000"
            disabled={loading || !conversation?.id}
          />
          <button className="btn btn-danger" type="submit" disabled={loading || sending || !conversation?.id || !draft.trim()}>
            Gửi
          </button>
        </form>
      </article>
    </section>
  )
}

export default SupportChatPage
