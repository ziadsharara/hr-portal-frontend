// Service layer for /employees/{companyCode}/experiences — the nested
// experience-history resource. Same conventions as services/employees.js:
// thin wrappers around `http`, return unwrapped data, let errors bubble.
import { http } from './http'

// GET /employees/{companyCode}/experiences — full list, NOT paged
// (confirmed from ExperienceController — no Pageable param). Backend
// already returns it ordered by startDate desc.
export function fetchExperiences(companyCode) {
  return http
    .get(`/employees/${companyCode}/experiences`)
    .then((res) => res.data)
}

// POST /employees/{companyCode}/experiences — create. `payload` matches
// ExperienceUpsertRequest (project, projectType, module, role, scope,
// industry, country, startDate, duration). The backend rejects an exact
// duplicate of (project, role, startDate) for this employee with a 400.
export function createExperience(companyCode, payload) {
  return http
    .post(`/employees/${companyCode}/experiences`, payload)
    .then((res) => res.data)
}

// PUT /employees/{companyCode}/experiences/{id} — CONFIRMED full replace,
// same as employee PUT (ExperienceMapper.applyUpsert sets every field
// unconditionally, including `module`, which the edit form doesn't
// expose as a visible field — see ExperienceFormModal.vue for how it's
// carried forward from the original record so it isn't silently wiped).
export function updateExperience(companyCode, experienceId, payload) {
  return http
    .put(`/employees/${companyCode}/experiences/${experienceId}`, payload)
    .then((res) => res.data)
}

// DELETE /employees/{companyCode}/experiences/{id}.
// The real handler returns 200 with a JSON body { message: "..." } (a
// Map, not a bare string — confirmed from ExperienceController source,
// which differs slightly from what API_CONTRACT.md's example shows).
export function deleteExperience(companyCode, experienceId) {
  return http
    .delete(`/employees/${companyCode}/experiences/${experienceId}`)
    .then((res) => res.data)
}
