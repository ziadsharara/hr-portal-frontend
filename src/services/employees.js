// Service layer for everything under /employees (except CV export, which
// has its own services/cv.js, and experiences, which have their own
// services/experiences.js). Views and the Pinia store call these
// functions; they never touch `http`/axios directly.
//
// Every function here returns the already-unwrapped response BODY
// (response.data), not the full Axios response — callers only ever care
// about the data. Errors are NOT caught here; they're left to propagate
// so the caller can decide how to react (e.g. show a toast, set a form
// field error) using utils/apiError.js.
import { http } from './http'

// GET /employees — paged + filtered list for the dashboard table.
// `params` mirrors the query params the real EmployeeController accepts:
// search, status, position, organizationalUnit, page, size, sort.
// Axios drops any key whose value is undefined/null, so callers can pass
// an object with unused filters left as `undefined` without polluting
// the query string with "status=undefined".
export function fetchEmployees(params) {
  return http.get('/employees', { params }).then((res) => res.data)
}

// GET /employees/{companyCode} — full detail for the profile page.
// Note: the backend returns 404 with { timestamp, message } if the
// company code doesn't exist (NoSuchElementException path in
// EmployeeService.getEmployee) — see EmployeeProfileView for how that's
// surfaced as a "not found" state instead of a crash.
export function fetchEmployee(companyCode) {
  return http.get(`/employees/${companyCode}`).then((res) => res.data)
}

// POST /employees — create. `payload` must match EmployeeRequest exactly
// (see EmployeeFormView for the full field list / required fields).
export function createEmployee(payload) {
  return http.post('/employees', payload).then((res) => res.data)
}

// PUT /employees/{companyCode} — CONFIRMED full replace on the backend
// (EmployeeMapper.applyUpsert overwrites every column unconditionally).
// Callers MUST pass the complete EmployeeRequest shape — every field the
// employee currently has, not just the ones the user changed — or the
// omitted fields come back null. See EmployeeProfileView and
// EmployeeFormView for how the full object is always assembled before
// calling this.
export function updateEmployee(companyCode, payload) {
  return http.put(`/employees/${companyCode}`, payload).then((res) => res.data)
}

// PATCH /employees/{companyCode}/status — the ONE genuinely partial
// update the API exposes. Safe to call with just the new status because
// the backend has a dedicated EmployeeStatusUpdateRequest for it, unlike
// the full-replace PUT above.
export function updateEmployeeStatus(companyCode, status) {
  return http
    .patch(`/employees/${companyCode}/status`, { status })
    .then((res) => res.data)
}
