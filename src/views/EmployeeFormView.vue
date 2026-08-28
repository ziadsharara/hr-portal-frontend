<!--
  Add/Edit Employee — a dedicated page (not a modal) because EmployeeRequest
  has ~25 fields, grouped here into Basic Info / Contact / Employment
  Status / Professional Background per the brief.

  Handles BOTH routes:
    /employees/new              -> create mode (companyCode is prop-less)
    /employees/:companyCode/edit -> edit mode

  EDIT MODE FULL-REPLACE SAFETY: PUT overwrites every field
  unconditionally (see EmployeeProfileView.vue's header comment for the
  full explanation — same backend behavior applies here). So on entering
  edit mode we ALWAYS fetch the complete EmployeeDetailDto first and
  populate every field of `form` from it, INCLUDING fields with no
  dedicated UI grouping here, before allowing any submit. We never build
  the PUT body from "just the fields on this page" — `form` already
  covers the entire EmployeeRequest shape, so submitting it is always a
  full, safe replace.
-->
<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchEmployee, createEmployee, updateEmployee } from '@/services/employees'
import { parseApiError } from '@/utils/apiError'
import { useToastStore } from '@/stores/toast'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import Icon from '@/components/common/Icon.vue'

// `companyCode` is only present when the route was
// /employees/:companyCode/edit — undefined on /employees/new. This one
// value is what decides the entire component's mode.
const props = defineProps({
  companyCode: { type: String, default: null },
})

const isEditMode = computed(() => props.companyCode !== null)

const router = useRouter()
const toast = useToastStore()

// Field groups drive the template with a single v-for instead of
// hand-writing ~25 near-identical <BaseInput>/<BaseSelect> blocks. Each
// entry's `key` matches an EmployeeRequest property name exactly, which
// is also what the backend's fieldErrors keys use — see `fieldErrors`
// below for why that matters.
const FIELD_GROUPS = [
  {
    title: 'Basic Info',
    fields: [
      { key: 'companyCode', label: 'Company Code', type: 'number', required: true, disabledInEdit: true },
      { key: 'name', label: 'Full Name', required: true },
      { key: 'nameAr', label: 'Arabic Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      { key: 'nationality', label: 'Nationality' },
      { key: 'socialStatus', label: 'Social Status' },
      { key: 'idNumber', label: 'ID Number' },
    ],
  },
  {
    title: 'Contact',
    fields: [
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel' },
      { key: 'address', label: 'Address' },
    ],
  },
  {
    title: 'Employment Status',
    fields: [
      { key: 'position', label: 'Position', required: true },
      { key: 'organizationalUnit', label: 'Organizational Unit' },
      { key: 'supervisor', label: 'Supervisor' },
      { key: 'company', label: 'Company', required: true },
      {
        key: 'status', label: 'Status', type: 'select', required: true,
        options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }],
      },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'insured', label: 'Insured' },
      { key: 'medicalInsurance', label: 'Medical Insurance' },
      { key: 'numberOfInsurance', label: 'Insurance Number' },
      { key: 'laptops', label: 'Laptop(s)' },
    ],
  },
  {
    title: 'Professional Background',
    fields: [
      { key: 'cvTitle', label: 'CV Title' },
      { key: 'experienceYears', label: 'Years of Experience' },
      { key: 'languages', label: 'Languages' },
      { key: 'education', label: 'Education', type: 'textarea' },
      { key: 'certificates', label: 'Certificates', type: 'textarea' },
    ],
  },
]

// One flat reactive object covering every EmployeeRequest field —
// exactly what gets sent on submit, whichever group a field visually
// belongs to.
const form = reactive({
  companyCode: '', name: '', nameAr: '', email: '', phone: '', position: '',
  organizationalUnit: '', supervisor: '', status: '', company: '', startDate: '',
  endDate: '', address: '', idNumber: '', dateOfBirth: '', socialStatus: '',
  gender: '', nationality: '', insured: '', medicalInsurance: '', numberOfInsurance: '',
  laptops: '', certificates: '', experienceYears: '', education: '', cvTitle: '', languages: '',
})

const loading = ref(isEditMode.value) // only need to load anything in edit mode
const notFound = ref(false)
const fieldErrors = reactive({})
const formError = ref(null)
const saving = ref(false)

onMounted(async () => {
  if (!isEditMode.value) return
  try {
    const employee = await fetchEmployee(props.companyCode)
    Object.assign(form, employee) // populate EVERY field, per the full-replace safety note above
  } catch (err) {
    if (parseApiError(err).status === 404) notFound.value = true
    else formError.value = parseApiError(err).message
  } finally {
    loading.value = false
  }
})

// Flattened once from FIELD_GROUPS so the required-field list used for
// validation is the SAME data driving the template — no separate list
// to keep in sync by hand.
const ALL_FIELDS = FIELD_GROUPS.flatMap((group) => group.fields)

function isFieldValid(field) {
  // companyCode is only required on CREATE — the backend ignores it
  // entirely on update (path variable is authoritative there).
  if (field.key === 'companyCode') return isEditMode.value || !!form.companyCode
  const value = form[field.key]
  return typeof value === 'string' ? value.trim() !== '' : !!value
}

function validateLocally() {
  const errors = {}
  for (const field of ALL_FIELDS) {
    if (field.required && !isFieldValid(field)) {
      errors[field.key] = `${field.label} is required.`
    }
  }
  return errors
}

// Clears a field's error THE MOMENT it becomes valid, rather than
// leaving a stale "X is required" message sitting under a field the
// user already fixed until they hit submit again. watch()'s `deep: true`
// is needed here because `form` is a reactive OBJECT — by default watch
// only reacts to the object being replaced wholesale, not to individual
// property mutations inside it (which is what typing into a field does).
watch(
  form,
  () => {
    for (const key of Object.keys(fieldErrors)) {
      const field = ALL_FIELDS.find((f) => f.key === key)
      if (field && isFieldValid(field)) delete fieldErrors[key]
    }
  },
  { deep: true }
)

async function handleSubmit() {
  formError.value = null
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])

  const localErrors = validateLocally()
  if (Object.keys(localErrors).length > 0) {
    Object.assign(fieldErrors, localErrors)
    return
  }

  // companyCode must be a real number in the JSON body (EmployeeRequest.companyCode
  // is an Integer) — the form input gives us a string even with type="number".
  const payload = { ...form, companyCode: Number(form.companyCode) }

  saving.value = true
  try {
    const saved = isEditMode.value
      ? await updateEmployee(props.companyCode, payload)
      : await createEmployee(payload)
    toast.success(isEditMode.value ? 'Employee updated.' : 'Employee created.')
    router.push({ name: 'employee-profile', params: { companyCode: saved.companyCode } })
  } catch (err) {
    const parsed = parseApiError(err)
    if (parsed.fieldErrors) Object.assign(fieldErrors, parsed.fieldErrors)
    else formError.value = parsed.message
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  if (isEditMode.value) router.push({ name: 'employee-profile', params: { companyCode: props.companyCode } })
  else router.push({ name: 'employees-dashboard' })
}
</script>

<template>
  <div class="mx-auto max-w-4xl p-6 pb-16">
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-1 text-body-md text-slate-500 hover:text-slate-700"
      @click="handleCancel"
    >
      <Icon name="chevronLeft" class="h-4 w-4" />
      {{ isEditMode ? 'Back to Profile' : 'Back to Employees' }}
    </button>

    <h1 class="mb-6 text-headline-lg text-slate-900">
      {{ isEditMode ? 'Edit Employee' : 'Add Employee' }}
    </h1>

    <div v-if="loading" class="py-16 text-center text-body-md text-slate-500">Loading employee…</div>

    <div v-else-if="notFound" class="rounded border border-red-200 bg-red-50 p-4 text-body-md text-red-700">
      No employee exists with company code {{ companyCode }}.
    </div>

    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <p v-if="formError" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-body-md text-red-700">
        {{ formError }}
      </p>

      <section v-for="group in FIELD_GROUPS" :key="group.title" class="rounded-lg border border-slate-200 bg-white">
        <div class="border-b border-slate-200 px-6 py-3">
          <h2 class="text-headline-sm text-slate-900">{{ group.title }}</h2>
        </div>
        <div class="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 md:gap-x-6 md:gap-y-4">
          <template v-for="field in group.fields" :key="field.key">
            <div :class="field.type === 'textarea' && 'md:col-span-2'">
              <BaseSelect
                v-if="field.type === 'select'"
                v-model="form[field.key]"
                :label="field.label"
                :options="field.options"
                :required="field.required"
                :error="fieldErrors[field.key]"
              />
              <BaseTextarea
                v-else-if="field.type === 'textarea'"
                v-model="form[field.key]"
                :label="field.label"
                :rows="3"
                :error="fieldErrors[field.key]"
              />
              <BaseInput
                v-else
                v-model="form[field.key]"
                :label="field.label"
                :type="field.type || 'text'"
                :required="field.required"
                :disabled="field.disabledInEdit && isEditMode"
                :error="fieldErrors[field.key]"
              />
            </div>
          </template>
        </div>
      </section>

      <div class="flex justify-end gap-2">
        <BaseButton variant="secondary" :disabled="saving" @click="handleCancel">Cancel</BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="saving">
          {{ saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Create Employee' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
