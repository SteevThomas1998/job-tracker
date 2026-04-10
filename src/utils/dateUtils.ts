export function formatDate(iso: string, includeYear = true): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (includeYear) options.year = 'numeric'
  return date.toLocaleDateString('en-US', options)
}
