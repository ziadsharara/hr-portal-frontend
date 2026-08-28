<!--
  Results screen for POST /employees/import (EmployeeImportResponse). This
  import is create-only: an existing company_code is always skipped, never
  updated. `message` is always shown as the headline — in particular
  "No new employees found in this file." when addedCount is 0 — so a
  no-op re-upload reads as an obvious, friendly empty state rather than a
  buried "Added: 0" next to other numbers.
-->
<script setup>
defineProps({
  addedCount: { type: Number, required: true },
  addedCompanyCodes: { type: Array, required: true },
  skippedExistingCount: { type: Number, required: true },
  skippedExistingCompanyCodes: { type: Array, required: true },
  skippedNonCicCount: { type: Number, required: true },
  skippedSystemRowCount: { type: Number, required: true },
  message: { type: String, required: true },
})
</script>

<template>
  <div class="space-y-4">
    <!-- Zero-new-employees is the one state that gets its own callout
         rather than just being a "0" among other numbers. -->
    <div
      v-if="addedCount === 0"
      class="flex items-start gap-2 rounded border border-slate-200 bg-slate-50 p-3"
    >
      <p class="text-body-md font-medium text-slate-700">{{ message }}</p>
    </div>
    <p v-else class="text-body-md font-medium text-slate-800">{{ message }}</p>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div class="rounded border border-slate-200 bg-slate-50 p-4">
        <p class="text-data-label text-slate-500">New employees added</p>
        <p class="text-headline-md text-emerald-700">{{ addedCount }}</p>
      </div>
      <div class="rounded border border-slate-200 bg-slate-50 p-4">
        <p class="text-data-label text-slate-500">Already existed (skipped)</p>
        <p class="text-headline-md text-slate-700">{{ skippedExistingCount }}</p>
      </div>
    </div>

    <p class="text-data-label text-slate-500">
      {{ skippedNonCicCount }} row(s) skipped — not company CIC ·
      {{ skippedSystemRowCount }} row(s) skipped — System/placeholder rows
    </p>

    <div v-if="addedCompanyCodes.length > 0">
      <p class="mb-2 text-data-label text-slate-500">New employee company codes:</p>
      <p class="text-data-value text-slate-800">{{ addedCompanyCodes.join(', ') }}</p>
    </div>

    <div v-if="skippedExistingCompanyCodes.length > 0">
      <p class="mb-2 text-data-label text-slate-500">Already-present company codes (skipped):</p>
      <p class="text-data-value text-slate-800">{{ skippedExistingCompanyCodes.join(', ') }}</p>
    </div>
    <p v-else-if="skippedExistingCount > 0" class="text-data-label text-slate-500">
      Too many to list individually ({{ skippedExistingCount }} skipped).
    </p>
  </div>
</template>
