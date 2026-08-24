// Service layer for the Excel upload/import features (Phase 1.5).
//
//   POST /employees/import                          (global employee import)
//   POST /employees/{companyCode}/experiences/upload (per-employee project upload)
//   POST /experiences/bulk-upload                    (global project upload)
//
// All three take a single .xlsx file as multipart/form-data under the
// "file" field (confirmed from the real controllers — @RequestParam("file")).
// Response shapes come straight from the backend DTOs:
//   - importEmployeesExcel      -> EmployeeImportResponse
//   - uploadEmployeeProjectsExcel / uploadGlobalProjectsExcel -> ExperienceUploadResponse
import { http } from './http'

function toFormData(file) {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export function importEmployeesExcel(file) {
  return http
    .post('/employees/import', toFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}

export function uploadEmployeeProjectsExcel(companyCode, file) {
  return http
    .post(`/employees/${companyCode}/experiences/upload`, toFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}

export function uploadGlobalProjectsExcel(file) {
  return http
    .post('/experiences/bulk-upload', toFormData(file), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}
