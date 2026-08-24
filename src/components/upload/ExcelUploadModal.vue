<!--
  Drag-and-drop Excel upload UI, reused for all THREE Phase 1.5 upload
  flows via the `mode` prop:
    - 'employee-import' -> POST /employees/import (dashboard top bar)
    - 'employee'         -> POST /employees/{companyCode}/experiences/upload (profile page)
    - 'global'            -> POST /experiences/bulk-upload (dashboard top bar)
  One reusable component/pattern instead of three near-duplicate modals.
-->
<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Icon from '@/components/common/Icon.vue'
import ExcelUploadResultsPanel from './ExcelUploadResultsPanel.vue'
import EmployeeImportResultsPanel from './EmployeeImportResultsPanel.vue'
import {
  importEmployeesExcel,
  uploadEmployeeProjectsExcel,
  uploadGlobalProjectsExcel,
} from '@/services/uploads'
import { parseApiError } from '@/utils/apiError'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  mode: {
    type: String,
    required: true,
    validator: (value) => ['employee-import', 'employee', 'global'].includes(value),
  },
  // Only required when mode === 'employee'.
  companyCode: { type: [Number, String], default: null },
  employeeName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'uploaded'])

const toast = useToastStore()

const title = computed(() => {
  if (props.mode === 'employee-import') return 'Import Employees'
  if (props.mode === 'employee') return `Upload Projects Excel — ${props.employeeName || `#${props.companyCode}`}`
  return 'Upload Projects Excel — All Employees'
})

// --- File selection --------------------------------
const isDragging = ref(false)
const selectedFile = ref(null)
const fileInputEl = ref(null) // template ref, see below

function onDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file) selectedFile.value = file
}

function onFileInputChange(event) {
  const file = event.target.files?.[0]
  if (file) selectedFile.value = file
}

function openFileBrowser() {
  // fileInputEl.value is the actual <input type="file"> DOM element —
  // see the `ref="fileInputEl"` in the template. Template refs are how
  // you reach into the real DOM node from script when you need to call
  // an imperative browser API (here, .click()) that has no declarative
  // Vue equivalent.
  fileInputEl.value?.click()
}

function removeFile() {
  selectedFile.value = null
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// --- Submit ------------------------------------------------------------
const submitting = ref(false)
const results = ref(null)

async function handleSubmit() {
  if (!selectedFile.value) return
  submitting.value = true
  try {
    let response
    if (props.mode === 'employee-import') {
      response = await importEmployeesExcel(selectedFile.value)
    } else if (props.mode === 'employee') {
      response = await uploadEmployeeProjectsExcel(props.companyCode, selectedFile.value)
    } else {
      response = await uploadGlobalProjectsExcel(selectedFile.value)
    }
    results.value = response
    emit('uploaded', response)
  } catch (err) {
    toast.error(parseApiError(err).message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BaseModal :title="title" max-width-class="max-w-xl" @close="emit('close')">
    <div v-if="results" class="space-y-4">
      <EmployeeImportResultsPanel
        v-if="mode === 'employee-import'"
        :added-count="results.addedCount"
        :added-company-codes="results.addedCompanyCodes"
        :skipped-existing-count="results.skippedExistingCount"
        :skipped-existing-company-codes="results.skippedExistingCompanyCodes"
        :skipped-non-cic-count="results.skippedNonCicCount"
        :skipped-system-row-count="results.skippedSystemRowCount"
        :message="results.message"
      />
      <ExcelUploadResultsPanel
        v-else
        :added-count="results.addedCount"
        :skipped-duplicate-count="results.skippedDuplicateCount"
        :unmatched-rows="results.unmatchedRows"
        :message="results.message"
      />
    </div>

    <div v-else class="space-y-4">
      <!--
        @dragover.prevent is required: browsers block drop events on an
        element by default unless its dragover handler calls
        preventDefault() — the .prevent modifier does that for us
        declaratively instead of needing `event.preventDefault()` in the
        handler body.
      -->
      <div
        class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition-colors"
        :class="isDragging ? 'border-primary bg-primary/5' : 'border-slate-300'"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <template v-if="!selectedFile">
          <Icon name="upload" class="h-6 w-6 text-slate-400" />
          <p class="text-body-md text-slate-600">Drag and drop an .xlsx file here</p>
          <button type="button" class="text-body-md font-medium text-primary hover:underline" @click="openFileBrowser">
            or browse your computer
          </button>
        </template>

        <template v-else>
          <Icon name="briefcase" class="h-6 w-6 text-slate-400" />
          <p class="text-body-md font-medium text-slate-800">{{ selectedFile.name }}</p>
          <p class="text-data-label text-slate-500">{{ formatFileSize(selectedFile.size) }}</p>
          <button type="button" class="text-data-label font-medium text-red-600 hover:underline" @click="removeFile">
            Remove file
          </button>
        </template>
      </div>

      <!-- Hidden native file input — `ref="fileInputEl"` exposes the real
           DOM node to script setup as `fileInputEl.value`, used above in
           openFileBrowser() to trigger the OS file picker. -->
      <input
        ref="fileInputEl"
        type="file"
        accept=".xlsx,.xls"
        class="hidden"
        @change="onFileInputChange"
      />
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">
        {{ results ? 'Close' : 'Cancel' }}
      </BaseButton>
      <BaseButton
        v-if="!results"
        variant="primary"
        :disabled="!selectedFile || submitting"
        @click="handleSubmit"
      >
        {{ submitting ? 'Uploading…' : 'Upload' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
