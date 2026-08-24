// Turns the backend's error response bodies into one predictable shape
// that every component can rely on, regardless of which of the TWO
// different error shapes GlobalExceptionHandler actually returned:
//
//   1. Business-logic errors (duplicate company code, not found, etc.)
//      -> ApiErrorResponse: { timestamp, message }
//
//   2. Bean Validation (@Valid) failures
//      -> { timestamp, status, error, message, fieldErrors: { field: msg } }
//
// Without this, every view would need its own if/else to figure out
// which shape it got back. This is a plain function (not a composable —
// it doesn't use any Vue reactivity), so it can be unit tested trivially
// and reused from anywhere, including outside components.
export function parseApiError(error) {
  // Network failure, CORS issue, or the backend didn't respond at all —
  // axios sets error.response only when the SERVER actually replied.
  if (!error?.response) {
    return {
      message: 'Could not reach the server. Check your connection and that the API is running.',
      fieldErrors: null,
      status: null,
    }
  }

  const { status, data } = error.response

  // Some endpoints (e.g. GET .../jobs/{id}) return 404 with an EMPTY body
  // via ResponseEntity.notFound().build() rather than an ApiErrorResponse.
  if (!data || typeof data !== 'object') {
    return {
      message: `Request failed with status ${status}.`,
      fieldErrors: null,
      status,
    }
  }

  return {
    message: data.message || 'An unexpected error occurred.',
    // fieldErrors is only present on validation failures; everything else
    // gets null so callers can do `if (err.fieldErrors) { ... }` safely.
    fieldErrors: data.fieldErrors ?? null,
    status,
  }
}

// Downloads (CV export, bulk zip) are requested with axios's
// `responseType: 'blob'` so the binary file data doesn't get mangled by
// JSON parsing. But when the SAME request fails, the server still sends
// back a JSON error body — and axios hands it to us as a Blob too,
// because it doesn't know in advance that an error response is JSON
// while a success response is binary. This reads that error Blob back
// into text and parses it as JSON, falling back gracefully if it isn't.
export async function parseBlobApiError(error) {
  if (!error?.response) {
    return {
      message: 'Could not reach the server. Check your connection and that the API is running.',
      fieldErrors: null,
      status: null,
    }
  }

  const { status, data } = error.response

  if (!(data instanceof Blob)) {
    return parseApiError(error)
  }

  try {
    const text = await data.text()
    const parsed = JSON.parse(text)
    return {
      message: parsed.message || 'An unexpected error occurred.',
      fieldErrors: parsed.fieldErrors ?? null,
      status,
    }
  } catch {
    // Body wasn't JSON (e.g. a plain 404 with no body) — fall back to a
    // generic message rather than showing the user a parse error.
    return {
      message: `Request failed with status ${status}.`,
      fieldErrors: null,
      status,
    }
  }
}
