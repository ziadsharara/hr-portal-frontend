<!--
  Add/Edit Experience modal. Handles BOTH create and edit — which mode
  it's in is decided entirely by whether the `experience` prop is null
  (create) or an existing ExperienceDto (edit).

  FULL-REPLACE SAFETY: PUT /employees/{code}/experiences/{id} overwrites
  every column unconditionally (confirmed in ExperienceMapper.applyUpsert
  — see services/experiences.js for the full explanation). This form's
  visible fields match the brief exactly: project, projectType, role,
  scope, industry, country, startDate, duration — `module` is NOT a
  visible field here. To avoid silently wiping out an existing `module`
  value on every edit, we carry its original value forward into the
  submitted payload untouched (see `originalModule` below) instead of
  just omitting it.
-->
<script setup>
import { reactive, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import { createExperience, updateExperience } from '@/services/experiences'
import { parseApiError } from '@/utils/apiError'

const props = defineProps({
  companyCode: { type: [Number, String], required: true },
  // null => creating a new experience. An ExperienceDto => editing it.
  experience: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const isEditing = !!props.experience

// The parent always renders this modal with v-if (not v-show) — see
// EmployeeProfileView.vue — so a NEW component instance is created every
// time it opens, and destroyed when it closes. That means it's safe to
// read `props.experience` ONCE here at setup time to seed local form
// state, with no watcher needed to keep them in sync: there's no
// "existing instance whose props change" scenario to handle, because the
// instance itself never survives a props change here.
const form = reactive({
  project: props.experience?.project ?? '',
  projectType: props.experience?.projectType ?? '',
  role: props.experience?.role ?? '',
  scope: props.experience?.scope ?? '',
  industry: props.experience?.industry ?? '',
  country: props.experience?.country ?? '',
  startDate: props.experience?.startDate ?? '',
  duration: props.experience?.duration ?? '',
})

// Preserved exactly as-is and re-sent on update — see file header.
const originalModule = props.experience?.module ?? null

const saving = ref(false)
const formError = ref(null) // non-field-specific error (e.g. duplicate detection)
const fieldErrors = reactive({})

// Same {key -> isValid} shape as EmployeeFormView.vue, sized down for
// this form's three required fields (project, role, startDate — matching
// ExperienceUpsertRequest's @NotBlank/@NotNull fields exactly).
const REQUIRED_FIELDS = {
  project: { label: 'Project', isValid: () => form.project.trim() !== '' },
  role: { label: 'Role', isValid: () => form.role.trim() !== '' },
  startDate: { label: 'Start date', isValid: () => !!form.startDate },
}

function validateLocally() {
  const errors = {}
  for (const [key, field] of Object.entries(REQUIRED_FIELDS)) {
    if (!field.isValid()) errors[key] = `${field.label} is required.`
  }
  return errors
}

// See EmployeeFormView.vue for why this needs to exist: without it, a
// field's error message stays stuck on screen after the user has already
// fixed it, until they hit Save again.
watch(
  form,
  () => {
    for (const key of Object.keys(fieldErrors)) {
      const field = REQUIRED_FIELDS[key]
      if (field && field.isValid()) delete fieldErrors[key]
    }
  },
  { deep: true }
)

async function handleSubmit() {
  formError.value = null
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])

  const localErrors = validateLocally()
  if (Object.keys(localErrors).length > 0) {
    Object.assign(fieldErrors, localErrors)
    return
  }

  const payload = {
    project: form.project.trim(),
    projectType: form.projectType.trim() || null,
    module: originalModule,
    role: form.role.trim(),
    scope: form.scope.trim() || null,
    industry: form.industry.trim() || null,
    country: form.country.trim() || null,
    startDate: form.startDate,
    duration: form.duration.trim() || null,
  }

  saving.value = true
  try {
    const saved = isEditing
      ? await updateExperience(props.companyCode, props.experience.id, payload)
      : await createExperience(props.companyCode, payload)
    emit('saved', saved)
  } catch (err) {
    const parsed = parseApiError(err)
    if (parsed.fieldErrors) {
      Object.assign(fieldErrors, parsed.fieldErrors)
    } else {
      // Duplicate-experience and "doesn't belong to employee" errors
      // both come back as a plain ApiErrorResponse (message only, no
      // fieldErrors) — shown as one banner rather than guessed at a
      // specific field.
      formError.value = parsed.message
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :title="isEditing ? 'Edit Experience' : 'Add Experience'" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <p v-if="formError" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-body-md text-red-700">
        {{ formError }}
      </p>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.project" label="Project" required :error="fieldErrors.project" />
        <BaseInput v-model="form.projectType" label="Project Type" placeholder="Implementation, Support, Rollout…" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.role" label="Role" required :error="fieldErrors.role" />
        <BaseInput v-model="form.industry" label="Industry" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="form.country" label="Country" />
        <BaseInput v-model="form.duration" label="Duration" placeholder="e.g. 12 Months" />
      </div>

      <BaseInput v-model="form.startDate" type="date" label="Start Date" required :error="fieldErrors.startDate" />

      <BaseTextarea v-model="form.scope" label="Scope" :rows="5" placeholder="Describe the scope of work…" />
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="saving" @click="emit('close')">Cancel</BaseButton>
      <BaseButton variant="primary" :disabled="saving" @click="handleSubmit">
        {{ saving ? 'Saving…' : 'Save' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
