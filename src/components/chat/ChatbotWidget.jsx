import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { useChatConversation } from '../../hooks/useChatConversation.js'
import { formatDateTime } from '../../lib/formatters.js'

function isUserMessage(message) {
  return String(message.sender).toUpperCase() === 'USER'
}

function ChatMessage({ message }) {
  const fromUser = isUserMessage(message)

  return (
    <div className={`chatbot-message chatbot-message--${fromUser ? 'user' : 'bot'}`}>
      <strong>{fromUser ? 'Bạn' : 'FPT Cinema AI'}</strong>
      <p>{message.content}</p>
      <small>
        {formatDateTime(message.createdAt)}
        {message.failed ? ' · Chưa gửi được' : ''}
      </small>
    </div>
  )
}

function ChatbotWidget() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const logEndRef = useRef(null)
  const { conversation, error, loading, messages, newConversation, reload, sendMessage, sending } = useChatConversation({
    enabled: open && isAuthenticated,
  })

  useEffect(() => {
    if (!open) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  useEffect(() => {
    if (open) logEndRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, loading, open, sending])

  async function handleSubmit(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !conversation?.id || sending) return

    setDraft('')
    try {
      await sendMessage(content)
    } catch {
      // The hook exposes the API error in the chat panel.
    }
  }

  async function sendQuickPrompt(prompt) {
    if (sending || !conversation?.id) return
    try {
      await sendMessage(prompt)
    } catch {
      // The hook keeps the error visible in the panel.
    }
  }

  function handleComposerKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <aside className="chatbot-widget">
      {open ? (
        <section className="chatbot-panel" id="homepage-chatbot" aria-label="Trợ lý FPT Cinema">
          <header className="chatbot-panel__header">
            <div>
              <span className="chatbot-panel__status" aria-hidden="true" />
              <strong>Trợ lý FPT Cinema</strong>
              <small>Hỏi về phim, lịch chiếu và đặt vé</small>
            </div>
            <button
              className="chatbot-panel__close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng trợ lý"
            >
              ×
            </button>
            {isAuthenticated ? (
              <button className="chatbot-panel__new" type="button" onClick={() => newConversation().catch(() => {})} disabled={loading || sending}>
                Cuộc mới
              </button>
            ) : null}
          </header>

          {!isAuthenticated ? (
            <div className="chatbot-login">
              <span className="chatbot-login__icon" aria-hidden="true">🤖</span>
              <h2>Xin chào!</h2>
              <p>Đăng nhập để trò chuyện và tiếp tục đúng lịch sử hỗ trợ của bạn trong những lần ghé sau.</p>
              <Link className="btn btn-danger" to="/login">
                Đăng nhập để trò chuyện
              </Link>
            </div>
          ) : (
            <>
              <div className="chatbot-log" role="log" aria-live="polite" aria-busy={loading || sending}>
                {loading ? <p className="chatbot-system-message">Đang mở lại cuộc hội thoại...</p> : null}

                {!loading && !messages.length && !error ? (
                  <div className="chatbot-welcome">
                    <div className="chatbot-message chatbot-message--bot">
                      <strong>FPT Cinema AI</strong>
                      <p>Xin chào! Tôi có thể giúp bạn tìm phim, lịch chiếu hoặc giải đáp về đặt vé.</p>
                    </div>
                    <div className="chatbot-suggestions" aria-label="Câu hỏi gợi ý">
                      {['Phim đang chiếu hôm nay?', 'Xem lịch chiếu', 'Tôi cần hỗ trợ đặt vé'].map((prompt) => <button key={prompt} type="button" onClick={() => sendQuickPrompt(prompt)}>{prompt}</button>)}
                    </div>
                  </div>
                ) : null}

                {messages.map((message) => <ChatMessage key={message.id} message={message} />)}

                {sending ? (
                  <div className="chatbot-typing" aria-label="Trợ lý đang trả lời">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : null}

                {error ? (
                  <div className="chatbot-error" role="alert">
                    <span>{error.message ?? 'Không thể kết nối với trợ lý lúc này.'}</span>
                    {!conversation?.id ? (
                      <button type="button" onClick={reload} disabled={loading}>
                        Thử lại
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <div ref={logEndRef} />
              </div>

              <form className="chatbot-composer" onSubmit={handleSubmit}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Nhập câu hỏi..."
                  aria-label="Tin nhắn cho trợ lý"
                  rows="1"
                  maxLength="2000"
                  disabled={loading || !conversation?.id}
                />
                <button
                  type="submit"
                  aria-label="Gửi tin nhắn"
                  disabled={loading || sending || !conversation?.id || !draft.trim()}
                >
                  Gửi
                </button>
              </form>
            </>
          )}
        </section>
      ) : null}

      <button
        className="chatbot-launcher"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Thu gọn trợ lý FPT Cinema' : 'Mở trợ lý FPT Cinema'}
        aria-expanded={open}
        aria-controls="homepage-chatbot"
      >
        <span aria-hidden="true">🤖</span>
        <span className="chatbot-launcher__label">Hỗ trợ</span>
      </button>
    </aside>
  )
}

export default ChatbotWidget
