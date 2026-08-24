<!--
  Shared text/date/email/etc input with a label, required marker, and
  inline validation message. Used by every form in the app (Add/Edit
  Employee, Add/Edit Experience) so labels/spacing/error styling stay
  consistent without every form re-implementing it.
-->
<script setup>
// defineModel() is the modern (Vue 3.4+) way to make a component support
// `v-model`. Before this existed, you had to manually declare a `modelValue`
// prop AND an `update:modelValue` emit and wire them together yourself.
// defineModel() does both in one line and returns a ref: reading
// `model.value` gives the parent's bound value, and ASSIGNING to
// `model.value` automatically emits the update back to the parent —
// exactly like a local ref, but synced outward instead of staying local.
const model = defineModel({ type: [String, Number], default: '' })

defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' }, // 'text' | 'email' | 'date' | 'number' | 'tel'
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  // Passed in by the parent form when this specific field failed
  // backend validation (see utils/apiError.js `fieldErrors`) or a local
  // client-side check. null/undefined means "no error".
  error: { type: String, default: null },
  disabled: { type: Boolean, default: false },
})

// Every BaseInput needs a unique `id` to associate its <label for="...">
// correctly, but callers shouldn't have to invent one manually for every
// field. crypto.randomUUID() (available in all modern browsers) gives us
// a collision-free id generated once per component instance.
const inputId = `field-${crypto.randomUUID()}`
</script>

<template>
  <div>
    <label :for="inputId" class="mb-1 block text-data-label text-slate-500">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    <input
      :id="inputId"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="!!error"
      class="w-full rounded border bg-white px-3 py-2 text-body-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-slate-50 disabled:text-slate-400"
      :class="error ? 'border-red-400' : 'border-slate-200 focus:border-primary'"
    />
    <p v-if="error" class="mt-1 text-data-label text-red-600">{{ error }}</p>
  </div>
</template>
