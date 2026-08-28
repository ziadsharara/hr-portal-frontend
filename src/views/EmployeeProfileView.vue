<!--
  Employee profile page (/employees/:companyCode). The most stateful view
  in the app: it owns the employee record, its experience history, and
  three modals (add/edit experience, delete-confirm, per-employee Excel
  upload).

  FULL-REPLACE SAFETY (read this before touching `employeeForm` below):
  PUT /employees/{companyCode} overwrites EVERY column with whatever is
  in the request body — confirmed in EmployeeMapper.applyUpsert, which
  sets every field unconditionally with no null-coalescing. That means
  "inline-editable" here can NOT mean "PATCH just the one field the user
  touched" (the API offers no such endpoint for general fields — only
  `status` has one). Instead, this view keeps ONE reactive `employeeForm`
  object that always mirrors the COMPLETE EmployeeRequest shape. Both the
  Personal Information panel and the CV Info panel edit DIFFERENT SLICES
  of the SAME object, and saving either one PUTs the entire thing. This
  guarantees a save from one panel can never wipe data that belongs to
  the other panel, because both panels' data lives in the one object that
  gets sent, whether or not that panel is the one currently in "edit"
  mode.
-->
<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchEmployee,
  updateEmployee,
  updateEmployeeStatus,
} from '@/services/employees'
import {
  fetchExperiences,
  deleteExperience as deleteExperienceRequest,
} from '@/services/experiences'
import { exportEmployeeCv } from '@/services/cv'
import { parseApiError, parseBlobApiError } from '@/utils/apiError'
import { triggerBlobDownload } from '@/utils/download'
import { formatDate, formatOrDash, formatDateTime } from '@/utils/format'
import { useToastStore } from '@/stores/toast'

import StatusPill from '@/components/common/StatusPill.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import Icon from '@/components/common/Icon.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ExperienceTable from '@/components/experiences/ExperienceTable.vue'
import ExperienceFormModal from '@/components/experiences/ExperienceFormModal.vue'
import ExcelUploadModal from '@/components/upload/ExcelUploadModal.vue'

// This component is rendered by the router with `props: true` (see
// router/index.js), so `companyCode` arrives as a normal component prop
// — no need to reach into useRoute() ourselves.
const props = defineProps({
  companyCode: { type: String, required: true },
})

const router = useRouter()
const toast = useToastStore()

// --- Load state ---------------------------------------------------------
const employee = ref(null)
const loadingEmployee = ref(true)
const notFound = ref(false)
const loadErrorMessage = ref(null)

const experiences = ref([])
const loadingExperiences = ref(true)

async function loadEmployee() {
  loadingEmployee.value = true
  notFound.value = false
  loadErrorMessage.value = null
  try {
    employee.value = await fetchEmployee(props.companyCode)
    syncFormFromEmployee()
  } catch (err) {
    const parsed = parseApiError(err)
    if (parsed.status === 404) {
      notFound.value = true
    } else {
      loadErrorMessage.value = parsed.message
    }
  } finally {
    loadingEmployee.value = false
  }
}

async function loadExperiences() {
  loadingExperiences.value = true
  try {
    experiences.value = await fetchExperiences(props.companyCode)
  } catch (err) {
    toast.error(`Could not load experience history: ${parseApiError(err).message}`)
  } finally {
    loadingExperiences.value = false
  }
}

// onMounted runs once this component is actually in the DOM. Both loads
// are independent (one 404ing shouldn't block the other), so they're
// fired together rather than chained with await.
onMounted(() => {
  loadEmployee()
  loadExperiences()
})

// --- The shared, full-entity edit form -----------------------------------
// Mirrors EmployeeRequest exactly (the shape the backend's PUT expects) —
// NOT EmployeeDetailDto, which also has read-only server fields
// (createdAt/updatedAt) that don't belong in a request body.
const employeeForm = reactive({
  companyCode: null,
  name: '', nameAr: '', email: '', phone: '', position: '', organizationalUnit: '',
  supervisor: '', status: '', company: '', startDate: '', endDate: '', address: '',
  idNumber: '', dateOfBirth: '', socialStatus: '', gender: '', nationality: '',
  insured: '', medicalInsurance: '', numberOfInsurance: '', laptops: '',
  certificates: '', experienceYears: '', education: '', cvTitle: '', languages: '',
})

function syncFormFromEmployee() {
  Object.assign(employeeForm, employee.value)
}

// --- Personal Information panel ------------------------------------------
const PERSONAL_FIELDS = [
  { key: 'name', label: 'Full Name', required: true },
  { key: 'nameAr', label: 'Arabic Name' },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'position', label: 'Position', required: true },
  { key: 'organizationalUnit', label: 'Organizational Unit' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'company', label: 'Company', required: true },
  { key: 'startDate', label: 'Start Date', type: 'date', required: true },
  { key: 'endDate', label: 'End Date', type: 'date' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  { key: 'address', label: 'Address' },
  { key: 'idNumber', label: 'ID Number' },
  { key: 'socialStatus', label: 'Social Status' },
  { key: 'gender', label: 'Gender' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'insured', label: 'Insured' },
  { key: 'medicalInsurance', label: 'Medical Insurance' },
  { key: 'numberOfInsurance', label: 'Insurance Number' },
  { key: 'laptops', label: 'Laptop(s)' },
]

const editingPersonalInfo = ref(false)
const savingPersonalInfo = ref(false)
const personalInfoFieldErrors = reactive({})
const personalInfoFormError = ref(null)

function startEditingPersonalInfo() {
  syncFormFromEmployee() // discard any stale local edits, start from server truth
  personalInfoFormError.value = null
  Object.keys(personalInfoFieldErrors).forEach((k) => delete personalInfoFieldErrors[k])
  editingPersonalInfo.value = true
}

function cancelEditingPersonalInfo() {
  syncFormFromEmployee()
  editingPersonalInfo.value = false
}

async function savePersonalInfo() {
  await saveEmployee({
    onFieldErrors: (errors) => Object.assign(personalInfoFieldErrors, errors),
    onFormError: (msg) => (personalInfoFormError.value = msg),
    setSaving: (v) => (savingPersonalInfo.value = v),
    onSuccess: () => (editingPersonalInfo.value = false),
  })
}

function isPersonalFieldValid(key) {
  const value = employeeForm[key]
  return typeof value === 'string' ? value.trim() !== '' : !!value
}

// Same reasoning as EmployeeFormView.vue: clear a field's error the
// instant the user fixes it, instead of leaving a stale message next to
// an already-valid value until the next Save click.
watch(
  employeeForm,
  () => {
    for (const key of Object.keys(personalInfoFieldErrors)) {
      const field = PERSONAL_FIELDS.find((f) => f.key === key)
      if (field?.required && isPersonalFieldValid(key)) delete personalInfoFieldErrors[key]
    }
  },
  { deep: true }
)

// --- CV Info panel (portal-managed, no source spreadsheet) ---------------
const CV_INFO_FIELDS = [
  { key: 'cvTitle', label: 'CV Title' },
  { key: 'experienceYears', label: 'Years of Experience' },
  { key: 'languages', label: 'Languages' },
  { key: 'education', label: 'Education', textarea: true },
  { key: 'certificates', label: 'Certificates', textarea: true },
]

const editingCvInfo = ref(false)
const savingCvInfo = ref(false)
const cvInfoFormError = ref(null)

function startEditingCvInfo() {
  syncFormFromEmployee()
  cvInfoFormError.value = null
  editingCvInfo.value = true
}

function cancelEditingCvInfo() {
  syncFormFromEmployee()
  editingCvInfo.value = false
}

async function saveCvInfo() {
  await saveEmployee({
    onFieldErrors: () => {}, // CV Info fields have no @Valid constraints server-side
    onFormError: (msg) => (cvInfoFormError.value = msg),
    setSaving: (v) => (savingCvInfo.value = v),
    onSuccess: () => (editingCvInfo.value = false),
  })
}

// The ONE function that actually calls PUT — always sends the complete
// `employeeForm`, regardless of which panel triggered the save. Both
// `savePersonalInfo` and `saveCvInfo` above delegate to this instead of
// duplicating the request/error-handling logic themselves.
async function saveEmployee({ onFieldErrors, onFormError, setSaving, onSuccess }) {
  setSaving(true)
  try {
    const updated = await updateEmployee(props.companyCode, employeeForm)
    employee.value = updated
    syncFormFromEmployee()
    toast.success('Employee updated.')
    onSuccess()
  } catch (err) {
    const parsed = parseApiError(err)
    if (parsed.fieldErrors) onFieldErrors(parsed.fieldErrors)
    else onFormError(parsed.message)
  } finally {
    setSaving(false)
  }
}

// --- Status quick-toggle (uses the SAFE partial PATCH endpoint) ---------
const togglingStatus = ref(false)

async function toggleStatus() {
  const nextStatus = employee.value.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  togglingStatus.value = true
  try {
    const updated = await updateEmployeeStatus(props.companyCode, nextStatus)
    employee.value = updated
    syncFormFromEmployee()
    toast.success(`Status changed to ${nextStatus === 'ACTIVE' ? 'Active' : 'Inactive'}.`)
  } catch (err) {
    toast.error(parseApiError(err).message)
  } finally {
    togglingStatus.value = false
  }
}

// --- CV export (single) ---------------------------------------------------
const exportingCv = ref(false)

async function handleExportCv() {
  exportingCv.value = true
  try {
    const { blob, filename } = await exportEmployeeCv(props.companyCode)
    triggerBlobDownload(blob, filename)
  } catch (err) {
    const parsed = await parseBlobApiError(err)
    toast.error(`Could not export CV: ${parsed.message}`)
  } finally {
    exportingCv.value = false
  }
}

// --- Experience: add / edit modal -----------------------------------------
const showExperienceModal = ref(false)
const editingExperience = ref(null) // null = add mode; an ExperienceDto = edit mode

function openAddExperience() {
  editingExperience.value = null
  showExperienceModal.value = true
}

function openEditExperience(experience) {
  editingExperience.value = experience
  showExperienceModal.value = true
}

function handleExperienceSaved() {
  showExperienceModal.value = false
  toast.success(editingExperience.value ? 'Experience updated.' : 'Experience added.')
  loadExperiences() // simplest way to guarantee the table matches server truth
}

// --- Experience: delete confirm --------------------------------------------
const deleteTarget = ref(null)
const deleting = ref(false)

function requestDeleteExperience(experience) {
  deleteTarget.value = experience
}

async function confirmDeleteExperience() {
  deleting.value = true
  try {
    await deleteExperienceRequest(props.companyCode, deleteTarget.value.id)
    toast.success('Experience deleted.')
    deleteTarget.value = null
    loadExperiences()
  } catch (err) {
    toast.error(parseApiError(err).message)
  } finally {
    deleting.value = false
  }
}

// --- Per-employee Excel upload ---
const showEmployeeUploadModal = ref(false)

// Experience table sorted year desc — the backend ALREADY returns it
// this way (findByEmployee_CompanyCodeOrderByStartDateDesc), so no
// client-side sort is needed; this computed exists purely to make that
// guarantee explicit and defend against it ever silently changing.
const sortedExperiences = computed(() =>
  [...experiences.value].sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
)
</script>

<template>
  <div class="p-6 pb-16">
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-1 text-body-md text-slate-500 hover:text-slate-700"
      @click="router.push({ name: 'employees-dashboard' })"
    >
      <Icon name="chevronLeft" class="h-4 w-4" />
      Back to Employees
    </button>

    <!-- Loading state -->
    <div v-if="loadingEmployee" class="py-16 text-center text-body-md text-slate-500">
      Loading employee…
    </div>

    <!-- Not found state -->
    <EmptyState
      v-else-if="notFound"
      icon="alertTriangle"
      title="Employee not found"
      :description="`No employee exists with company code ${companyCode}.`"
    >
      <template #action>
        <BaseButton variant="primary" @click="router.push({ name: 'employees-dashboard' })">
          Back to Employees
        </BaseButton>
      </template>
    </EmptyState>

    <!-- Generic load error -->
    <div v-else-if="loadErrorMessage" class="rounded border border-red-200 bg-red-50 p-4 text-body-md text-red-700">
      {{ loadErrorMessage }}
    </div>

    <template v-else-if="employee">
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-headline-lg text-slate-900">{{ employee.name }}</h1>
            <button type="button" :disabled="togglingStatus" @click="toggleStatus" title="Click to toggle status">
              <StatusPill :status="employee.status" />
            </button>
          </div>
          <p class="mt-1 text-body-md text-slate-500">
            #{{ employee.companyCode }} · {{ employee.company }} · {{ employee.position || 'No position set' }}
          </p>
        </div>

        <BaseButton variant="primary" :disabled="exportingCv" @click="handleExportCv">
          <Icon name="download" class="h-4 w-4" />
          {{ exportingCv ? 'Exporting…' : 'Export CV' }}
        </BaseButton>
      </div>

      <!-- Personal Information panel -->
      <section class="mb-6 rounded-lg border border-slate-200 bg-white">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 class="text-headline-sm text-slate-900">Personal Information</h2>
          <BaseButton v-if="!editingPersonalInfo" variant="secondary" @click="startEditingPersonalInfo">
            <Icon name="pencil" class="h-4 w-4" />
            Edit
          </BaseButton>
          <div v-else class="flex gap-2">
            <BaseButton variant="secondary" :disabled="savingPersonalInfo" @click="cancelEditingPersonalInfo">
              Cancel
            </BaseButton>
            <BaseButton variant="primary" :disabled="savingPersonalInfo" @click="savePersonalInfo">
              {{ savingPersonalInfo ? 'Saving…' : 'Save' }}
            </BaseButton>
          </div>
        </div>

        <div class="p-6">
          <p v-if="personalInfoFormError" class="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-body-md text-red-700">
            {{ personalInfoFormError }}
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-x-6 md:gap-y-4">
            <template v-for="field in PERSONAL_FIELDS" :key="field.key">
              <!-- Edit mode: a real input bound to the shared employeeForm. -->
              <BaseInput
                v-if="editingPersonalInfo"
                v-model="employeeForm[field.key]"
                :label="field.label"
                :type="field.type || 'text'"
                :required="field.required"
                :error="personalInfoFieldErrors[field.key]"
              />
              <!-- Read mode: plain label/value pair, using the data-label/
                   data-value type scale designed exactly for this. -->
              <div v-else>
                <p class="text-data-label text-slate-500">{{ field.label }}</p>
                <p class="text-data-value text-slate-800">
                  {{ field.type === 'date' ? formatDate(employee[field.key]) : formatOrDash(employee[field.key]) }}
                </p>
              </div>
            </template>
          </div>

          <p class="mt-6 text-data-label text-slate-400">
            Last updated {{ formatDateTime(employee.updatedAt) }}
          </p>
        </div>
      </section>

      <!-- CV Info panel — visually separate, portal-managed fields with no
           source spreadsheet (per the brief). Its own bordered card, not
           just a second section of the panel above, to make clear these
           fields come from a different place than the HR data import. -->
      <section class="mb-6 rounded-lg border border-slate-200 bg-white">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 class="text-headline-sm text-slate-900">CV Info</h2>
            <p class="text-data-label text-slate-500">Portal-managed — not sourced from HR records.</p>
          </div>
          <BaseButton v-if="!editingCvInfo" variant="secondary" @click="startEditingCvInfo">
            <Icon name="pencil" class="h-4 w-4" />
            Edit
          </BaseButton>
          <div v-else class="flex gap-2">
            <BaseButton variant="secondary" :disabled="savingCvInfo" @click="cancelEditingCvInfo">
              Cancel
            </BaseButton>
            <BaseButton variant="primary" :disabled="savingCvInfo" @click="saveCvInfo">
              {{ savingCvInfo ? 'Saving…' : 'Save' }}
            </BaseButton>
          </div>
        </div>

        <div class="p-6">
          <p v-if="cvInfoFormError" class="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-body-md text-red-700">
            {{ cvInfoFormError }}
          </p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-4">
            <template v-for="field in CV_INFO_FIELDS" :key="field.key">
              <div :class="field.textarea && 'md:col-span-2'">
                <template v-if="editingCvInfo">
                  <BaseTextarea v-if="field.textarea" v-model="employeeForm[field.key]" :label="field.label" :rows="3" />
                  <BaseInput v-else v-model="employeeForm[field.key]" :label="field.label" />
                </template>
                <template v-else>
                  <p class="text-data-label text-slate-500">{{ field.label }}</p>
                  <p class="whitespace-pre-line text-data-value text-slate-800">{{ formatOrDash(employee[field.key]) }}</p>
                </template>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- Experience -->
      <section>
        <div class="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 class="text-headline-sm text-slate-900">Experience</h2>
          <div class="flex flex-wrap gap-2">
            <BaseButton variant="secondary" @click="showEmployeeUploadModal = true">
              <Icon name="upload" class="h-4 w-4" />
              Upload Excel for this Employee
            </BaseButton>
            <BaseButton variant="primary" @click="openAddExperience">
              <Icon name="plus" class="h-4 w-4" />
              Add Experience
            </BaseButton>
          </div>
        </div>

        <ExperienceTable
          :experiences="sortedExperiences"
          :loading="loadingExperiences"
          @edit="openEditExperience"
          @delete="requestDeleteExperience"
        />
      </section>
    </template>
  </div>

  <ExperienceFormModal
    v-if="showExperienceModal"
    :company-code="companyCode"
    :experience="editingExperience"
    @close="showExperienceModal = false"
    @saved="handleExperienceSaved"
  />

  <ConfirmDialog
    v-if="deleteTarget"
    title="Delete Experience"
    :message="`Delete the '${deleteTarget.project}' experience entry? This cannot be undone.`"
    confirm-label="Delete"
    danger
    :loading="deleting"
    @cancel="deleteTarget = null"
    @confirm="confirmDeleteExperience"
  />

  <ExcelUploadModal
    v-if="showEmployeeUploadModal"
    mode="employee"
    :company-code="companyCode"
    :employee-name="employee?.name"
    @close="showEmployeeUploadModal = false"
    @uploaded="loadExperiences"
  />
</template>
