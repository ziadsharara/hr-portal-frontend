// Shared helper for turning a Blob response into an actual file download
// in the browser. Used by both the single-CV export and the bulk-export
// zip download — factored out here instead of duplicated in cv.js so
// there's exactly one place that does this slightly-fiddly DOM dance.
export function triggerBlobDownload(blob, filename) {
  // Object URLs are a browser-memory handle to the Blob's bytes; they
  // MUST be revoked afterward or the memory is never freed for the
  // lifetime of the page (relevant here since this is a long-lived SPA
  // an HR admin might leave open all day).
  const url = window.URL.createObjectURL(blob)

  // There's no user-facing UI for "download a file" — we synthesize a
  // hidden <a download> element, click it programmatically, then remove
  // it. This is the standard vanilla-JS pattern for triggering a save
  // dialog from JS-fetched binary data (as opposed to a plain <a href>
  // pointing straight at a URL, which we can't do here because the
  // request needs no browser navigation / no extra headers).
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
}

// Pulls the filename out of a Content-Disposition header, e.g.
// `attachment; filename="John Doe-CV.pptx"`. Falls back to the caller's
// default if the header is missing or doesn't match the expected shape.
export function filenameFromContentDisposition(header, fallback) {
  if (!header) return fallback
  const match = header.match(/filename="?([^";]+)"?/)
  return match ? match[1] : fallback
}
