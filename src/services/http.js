// The ONE Axios instance for the whole app. Every service file
// (employees.js, experiences.js, cv.js) imports this instead of importing
// axios directly and calling axios.get(...) itself — that's what the
// brief means by "components should never call axios directly": it's not
// just about components, it's about having a single configured client so
// base URL / headers / future auth tokens live in exactly one place.
import axios from 'axios'

// import.meta.env is Vite's replacement for process.env in the browser.
// Only vars prefixed VITE_ are exposed to client code (see .env).
const baseURL = import.meta.env.VITE_API_BASE_URL

if (!baseURL) {
  // Fail loudly at startup rather than silently sending requests to a
  // relative path that happens to 404 — this is much faster to debug.
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and restart the dev server.'
  )
}

export const http = axios.create({
  baseURL,
  // No default timeout override needed yet — bulk CV export is an async
  // job precisely so a slow PPTX-generation batch never has to sit on an
  // open HTTP request.
})
