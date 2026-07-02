export function asArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.promotions)) return payload.promotions
  return []
}

export function pageSummary(payload) {
  if (!payload || Array.isArray(payload)) return null

  return {
    page: payload.number ?? 0,
    size: payload.size ?? asArray(payload).length,
    totalElements: payload.totalElements ?? asArray(payload).length,
    totalPages: payload.totalPages ?? 1,
  }
}
