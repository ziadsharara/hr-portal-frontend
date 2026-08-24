<!--
  Results screen for the two experience-upload endpoints (per-employee and
  global projects sheet) — same response shape from the backend
  (ExperienceUploadResponse): added / skippedDuplicate counts plus a list of
  unmatched rows with a human-readable reason each (bad/missing employee
  code, wrong employee, missing required field, or no such employee).
-->
<script setup>
defineProps({
  addedCount: { type: Number, required: true },
  skippedDuplicateCount: { type: Number, required: true },
  unmatchedRows: {
    type: Array,
    required: true,
    // Shape per row (ExperienceUploadResponse.UnmatchedRow):
    // { rowNumber: Number, employeeCode: String, resourceName: String, reason: String }
  },
  message: { type: String, required: true },
})
</script>

<template>
  <div class="space-y-4">
    <p class="text-body-md font-medium text-slate-800">{{ message }}</p>

    <div class="grid grid-cols-3 gap-3">
      <div class="rounded border border-slate-200 bg-slate-50 p-4">
        <p class="text-data-label text-slate-500">Added</p>
        <p class="text-headline-md text-emerald-700">{{ addedCount }}</p>
      </div>
      <div class="rounded border border-slate-200 bg-slate-50 p-4">
        <p class="text-data-label text-slate-500">Duplicates skipped</p>
        <p class="text-headline-md text-slate-700">{{ skippedDuplicateCount }}</p>
      </div>
      <div class="rounded border border-slate-200 bg-slate-50 p-4">
        <p class="text-data-label text-slate-500">Unmatched rows</p>
        <p class="text-headline-md" :class="unmatchedRows.length > 0 ? 'text-red-600' : 'text-slate-700'">
          {{ unmatchedRows.length }}
        </p>
      </div>
    </div>

    <div v-if="unmatchedRows.length > 0">
      <p class="mb-2 text-data-label text-slate-500">
        These rows couldn't be imported. Fix them in the sheet and re-upload:
      </p>
      <div class="max-h-80 overflow-y-auto rounded border border-slate-200">
        <table class="w-full border-collapse text-left">
          <thead class="sticky top-0 bg-slate-50">
            <tr class="border-b border-slate-200">
              <th class="px-4 py-2 text-label-caps uppercase text-slate-500">Row</th>
              <th class="px-4 py-2 text-label-caps uppercase text-slate-500">Employee Code</th>
              <th class="px-4 py-2 text-label-caps uppercase text-slate-500">Name in File</th>
              <th class="px-4 py-2 text-label-caps uppercase text-slate-500">Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in unmatchedRows" :key="row.rowNumber" class="border-b border-slate-200 last:border-0">
              <td class="px-4 py-2 text-data-value text-slate-700">{{ row.rowNumber }}</td>
              <td class="px-4 py-2 text-data-value text-slate-900">{{ row.employeeCode || '—' }}</td>
              <td class="px-4 py-2 text-data-value text-slate-900">{{ row.resourceName || '—' }}</td>
              <td class="px-4 py-2 text-data-value text-slate-700">{{ row.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
