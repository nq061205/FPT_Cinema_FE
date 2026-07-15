import { useEffect } from 'react'
import { toEmbedUrl } from '../../lib/video.js'

function TrailerModal({ movie, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const embedUrl = toEmbedUrl(movie.trailerUrl)

  return (
    <div className="trailer-modal" onClick={onClose}>
      <div className="trailer-modal__dialog" onClick={(event) => event.stopPropagation()}>
        <button className="trailer-modal__close" type="button" onClick={onClose} aria-label="Close trailer">
          ×
        </button>
        <div className="trailer-modal__player">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`Trailer ${movie.title}`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={movie.trailerUrl} controls autoPlay />
          )}
        </div>
        <h2>{movie.title}</h2>
      </div>
    </div>
  )
}

export default TrailerModal
