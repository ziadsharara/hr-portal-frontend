<!--
  Shared <textarea>, used for genuinely long free-text fields — the
  Experience "scope" field the brief calls out specifically, plus
  education/certificates on the employee CV-info panel.
-->
<script setup>
const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  error: { type: String, default: null },
  rows: { type: Number, default: 4 },
})

const inputId = `field-${crypto.randomUUID()}`
</script>

<template>
  <div>
    <label :for="inputId" class="mb-1 block text-data-label text-slate-500">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    <textarea
      :id="inputId"
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      class="w-full resize-y rounded border bg-white px-3 py-2 text-body-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
      :class="error ? 'border-red-400' : 'border-slate-200 focus:border-primary'"
    />
    <p v-if="error" class="mt-1 text-data-label text-red-600">{{ error }}</p>
  </div>
</template>
