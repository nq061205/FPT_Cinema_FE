export function toEmbedUrl(url) {
  if (!url) return null

  const youtubeMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/)
  return youtubeMatch ? `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1` : null
}
