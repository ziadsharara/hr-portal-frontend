// Service layer for CV export: one synchronous single-employee download,
// plus the async bulk-export JOB workflow (start -> poll -> download).
//
// Every function that downloads a file uses `responseType: 'blob'` so
// axios hands back the raw binary instead of trying to JSON-parse a
// PPTX/ZIP file. See utils/apiError.js `parseBlobApiError` for why error
// handling on these specific calls needs special treatment.
import { http } from './http'
import { filenameFromContentDisposition } from '@/utils/download'

// GET /employees/{companyCode}/cv — single-employee CV as a .pptx.
// Returns { blob, filename } rather than just the blob so the caller
// doesn't have to know about parsing Content-Disposition itself.
export function exportEmployeeCv(companyCode) {
  return http
    .get(`/employees/${companyCode}/cv`, { responseType: 'blob' })
    .then((res) => ({
      blob: res.data,
      filename: filenameFromContentDisposition(
        res.headers['content-disposition'],
        `employee-${companyCode}-CV.pptx`
      ),
    }))
}

// POST /employees/cv/jobs — starts an async bulk export job and returns
// immediately with { jobId, status, total } (status is always
// "PROCESSING" at this point; the backend kicks off @Async work).
export function startCvExportJob(companyCodes) {
  return http
    .post('/employees/cv/jobs', { companyCodes })
    .then((res) => res.data)
}

// GET /employees/cv/jobs/{jobId} — poll target. Returns
// { status, completed, total } where status is one of
// "PROCESSING" | "COMPLETED" | "FAILED" (confirmed from
// CvExportJobService.JobState — there is no "progress percentage" or
// "resultUrl" field, just a completed/total counter to build one from).
// The backend returns a bare 404 (no body) if the jobId is unknown, which
// axios turns into a rejected promise — left to the caller/poller to
// handle rather than swallowed here.
export function getCvExportJobStatus(jobId) {
  return http.get(`/employees/cv/jobs/${jobId}`).then((res) => res.data)
}

// GET /employees/cv/jobs/{jobId}/download — the finished zip. Only
// meaningful once job status is "COMPLETED"; the backend returns a bare
// 404 otherwise.
export function downloadCvExportJobResult(jobId) {
  return http
    .get(`/employees/cv/jobs/${jobId}/download`, { responseType: 'blob' })
    .then((res) => ({
      blob: res.data,
      filename: filenameFromContentDisposition(
        res.headers['content-disposition'],
        `cv-export-${jobId}.zip`
      ),
    }))
}
