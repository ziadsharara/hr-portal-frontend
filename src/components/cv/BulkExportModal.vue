<!--
  Bulk CV export flow: confirm -> start async job -> poll status ->
  download zip on success / show a clear error on failure.

  This mirrors the REAL backend shape confirmed in CvController.java /
  CvExportJobService.java:
    POST /employees/cv/jobs              { companyCodes } -> { jobId, status, total }
    GET  /employees/cv/jobs/{jobId}      -> { status, completed, total }
    GET  /employees/cv/jobs/{jobId}/download -> the zip

  There is NO percentage/progress field and NO resultUrl — just a
  completed/total counter we turn into a percentage ourselves, and a
  fixed download URL we hit once status is "COMPLETED".
-->
<script setup>
import { ref, computed, onUnmounted } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Icon from '@/components/common/Icon.vue'
import { startCvExportJob, getCvExportJobStatus, downloadCvExportJobResult } from '@/services/cv'
import { parseApiError, parseBlobApiError } from '@/utils/apiError'
import { triggerBlobDownload } from '@/utils/download'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  companyCodes: { type: Array, required: true },
})

const emit = defineEmits(['close', 'exported'])

const toast = useToastStore()

// Poll every 1.75s (within the 1.5-2s range) and give up after 5 minutes
// of PROCESSING with no result — long enough for a large batch of PPTX
// generation, short enough that a genuinely stuck job doesn't poll
// forever and burn the user's battery/bandwidth.
const POLL_INTERVAL_MS = 1750
const MAX_POLL_DURATION_MS = 5 * 60 * 1000

// 'confirm' -> 'processing' -> 'completed' | 'failed'
const stage = ref('confirm')
const jobId = ref(null)
const completed = ref(0)
const total = ref(props.companyCodes.length)
const errorMessage = ref(null)
const downloading = ref(false)

const progressPercent = computed(() =>
  total.value > 0 ? Math.round((completed.value / total.value) * 100) : 0
)

let pollTimeoutHandle = null
let pollStartedAt = null

async function confirmExport() {
  stage.value = 'processing'
  try {
    const job = await startCvExportJob(props.companyCodes)
    jobId.value = job.jobId
    total.value = job.total
    pollStartedAt = Date.now()
    poll()
  } catch (err) {
    stage.value = 'failed'
    errorMessage.value = parseApiError(err).message
  }
}

async function poll() {
  try {
    const status = await getCvExportJobStatus(jobId.value)
    completed.value = status.completed
    total.value = status.total

    if (status.status === 'COMPLETED') {
      stage.value = 'completed'
      emit('exported')
    } else if (status.status === 'FAILED') {
      stage.value = 'failed'
      errorMessage.value = 'CV generation failed on the server for this batch. Please try again.'
    } else if (Date.now() - pollStartedAt > MAX_POLL_DURATION_MS) {
      stage.value = 'failed'
      errorMessage.value = 'This export is taking longer than expected. It may still finish on the server — try again in a few minutes.'
    } else {
      // setTimeout (re-scheduled after each response comes back) rather
      // than setInterval: this guarantees requests never overlap even if
      // one response is slow, since the next poll is only scheduled
      // AFTER the current one finishes.
      pollTimeoutHandle = setTimeout(poll, POLL_INTERVAL_MS)
    }
  } catch (err) {
    stage.value = 'failed'
    errorMessage.value = parseApiError(err).message
  }
}

async function handleDownload() {
  downloading.value = true
  try {
    const { blob, filename } = await downloadCvExportJobResult(jobId.value)
    triggerBlobDownload(blob, filename)
    toast.success('CV export downloaded.')
  } catch (err) {
    const parsed = await parseBlobApiError(err)
    toast.error(parsed.message)
  } finally {
    downloading.value = false
  }
}

// If the modal is closed (or the component is otherwise destroyed) while
// a poll is still scheduled, this MUST be cleared — otherwise the
// setTimeout fires later against a component that's no longer showing
// anything, calling setters on refs nobody is looking at anymore. This
// is the single most common source of memory/network leaks in apps that
// poll: an unmount without matching cleanup.
onUnmounted(() => clearTimeout(pollTimeoutHandle))
</script>

<template>
  <BaseModal title="Export CVs" @close="emit('close')">
    <!-- Confirm stage -->
    <div v-if="stage === 'confirm'" class="space-y-3">
      <p class="text-body-md text-slate-600">
        This will generate a CV PowerPoint for
        <span class="font-semibold text-slate-900">{{ companyCodes.length }}</span>
        selected {{ companyCodes.length === 1 ? 'employee' : 'employees' }} and package them into a
        single ZIP file.
      </p>
    </div>

    <!-- Processing stage -->
    <div v-else-if="stage === 'processing'" class="space-y-3">
      <p class="text-body-md text-slate-600">Generating CVs — this may take a moment…</p>
      <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-full rounded-full bg-primary transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
      <p class="text-data-label text-slate-500">{{ completed }} of {{ total }} complete</p>
    </div>

    <!-- Completed stage -->
    <div v-else-if="stage === 'completed'" class="flex flex-col items-center gap-2 py-4 text-center">
      <div class="rounded-full bg-emerald-100 p-3 text-emerald-700">
        <Icon name="checkCircle" class="h-6 w-6" />
      </div>
      <p class="text-headline-sm text-slate-900">Export complete</p>
      <p class="text-body-md text-slate-500">
        {{ total }} {{ total === 1 ? 'CV is' : 'CVs are' }} ready to download.
      </p>
    </div>

    <!-- Failed stage -->
    <div v-else-if="stage === 'failed'" class="flex flex-col items-center gap-2 py-4 text-center">
      <div class="rounded-full bg-red-100 p-3 text-red-700">
        <Icon name="xCircle" class="h-6 w-6" />
      </div>
      <p class="text-headline-sm text-slate-900">Export failed</p>
      <p class="text-body-md text-slate-500">{{ errorMessage }}</p>
    </div>

    <template #footer>
      <template v-if="stage === 'confirm'">
        <BaseButton variant="secondary" @click="emit('close')">Cancel</BaseButton>
        <BaseButton variant="primary" @click="confirmExport">Start Export</BaseButton>
      </template>

      <template v-else-if="stage === 'processing'">
        <BaseButton variant="secondary" @click="emit('close')">Run in Background</BaseButton>
      </template>

      <template v-else-if="stage === 'completed'">
        <BaseButton variant="secondary" @click="emit('close')">Close</BaseButton>
        <BaseButton variant="primary" :disabled="downloading" @click="handleDownload">
          <Icon name="download" class="h-4 w-4" />
          {{ downloading ? 'Downloading…' : 'Download ZIP' }}
        </BaseButton>
      </template>

      <template v-else-if="stage === 'failed'">
        <BaseButton variant="secondary" @click="emit('close')">Close</BaseButton>
        <BaseButton variant="primary" @click="confirmExport">Try Again</BaseButton>
      </template>
    </template>
  </BaseModal>
</template>
