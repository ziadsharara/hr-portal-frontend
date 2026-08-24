// Small, framework-agnostic formatting helpers shared across views/
// components. Plain functions (no Vue APIs) so they're trivially
// reusable and testable — the kind of logic that does NOT belong in a
// composable, because it holds no reactive state of its own.

// The backend sends dates as ISO strings ("2026-01-15") or null. This
// renders them for display; it does NOT attempt timezone conversion
// since LocalDate on the Java side has no time-of-day/timezone component
// at all — treating it as a plain calendar date avoids the classic
// "date shifts by one day" bug you get from parsing it as UTC midnight
// with `new Date(...)` in a non-UTC browser.
export function formatDate(isoDate) {
  if (!isoDate) return '—'
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${day}/${month}/${year}`
}

// The backend sends timestamps as "2026-08-20T14:30:00" (LocalDateTime,
// no timezone). Safe to hand straight to `new Date()` here since we only
// display it, and both browser and server are assumed to run in the same
// local timezone for this internal tool.
export function formatDateTime(isoDateTime) {
  if (!isoDateTime) return '—'
  const date = new Date(isoDateTime)
  if (Number.isNaN(date.getTime())) return isoDateTime
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Renders an empty/blank string the same way a null field would, so the
// UI doesn't show a confusing empty cell where a "—" placeholder would
// read as intentionally-empty.
export function formatOrDash(value) {
  if (value === null || value === undefined || value === '') return '—'
  return value
}
