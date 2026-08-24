<!--
  Shared <select> dropdown, styled to match BaseInput. `options` accepts
  either an array of strings or an array of { value, label } objects, so
  it works both for simple lists (positions) and value/label pairs
  (status: value "ACTIVE", label "Active").
-->
<script setup>
import { computed } from 'vue'

const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true },
  // When true, prepends a blank "All" / "Any" option with value "" —
  // used for filter dropdowns where "no filter selected" is valid.
  allowEmpty: { type: Boolean, default: false },
  emptyLabel: { type: String, default: 'All' },
  required: { type: Boolean, default: false },
  error: { type: String, default: null },
})

// Normalizes the two accepted shapes (string[] vs {value,label}[]) into
// one shape the template can render uniformly. computed() because this
// is purely derived from the `options` prop.
const normalizedOptions = computed(() =>
  props.options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt))
)

const inputId = `field-${crypto.randomUUID()}`
</script>

<template>
  <div>
    <label :for="inputId" class="mb-1 block text-data-label text-slate-500">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    <select
      :id="inputId"
      v-model="model"
      class="w-full rounded border bg-white px-3 py-2 text-body-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30"
      :class="error ? 'border-red-400' : 'border-slate-200 focus:border-primary'"
    >
      <option v-if="allowEmpty" value="">{{ emptyLabel }}</option>
      <option v-for="opt in normalizedOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1 text-data-label text-red-600">{{ error }}</p>
  </div>
</template>
