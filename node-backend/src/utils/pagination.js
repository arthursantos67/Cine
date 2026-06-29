const DEFAULT_PAGE_SIZE = 20

export async function paginate(query, queryParams = {}, req = null) {
  const page = Math.max(1, parseInt(queryParams.page) || 1)
  const pageSize = Math.min(100, parseInt(queryParams.page_size) || DEFAULT_PAGE_SIZE)
  const skip = (page - 1) * pageSize

  const [count, results] = await Promise.all([
    query.model.countDocuments(query.getFilter()),
    query.clone().skip(skip).limit(pageSize),
  ])

  const totalPages = Math.ceil(count / pageSize)

  function buildPageUrl(p) {
    if (!req) return null
    const searchParams = new URLSearchParams(queryParams)
    searchParams.set('page', String(p))
    const fullPath = (req.baseUrl || '') + req.path
    return `${fullPath}?${searchParams.toString()}`
  }

  return {
    count,
    next: page < totalPages ? buildPageUrl(page + 1) : null,
    previous: page > 1 ? buildPageUrl(page - 1) : null,
    results,
  }
}
