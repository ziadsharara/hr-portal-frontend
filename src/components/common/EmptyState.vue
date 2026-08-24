<!--
  Generic "there's nothing here" panel — used for the employees table
  with no filter matches, and the experience table for an employee with
  zero recorded experience. A real empty state (not just a blank table)
  because a bare empty table reads as "is this broken?" to a user.
-->
<script setup>
import Icon from './Icon.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'briefcase' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <div class="mb-1 rounded-full bg-slate-100 p-3 text-slate-400">
      <Icon :name="icon" class="h-6 w-6" />
    </div>
    <p class="text-headline-sm text-slate-700">{{ title }}</p>
    <p v-if="description" class="max-w-sm text-body-md text-slate-500">{{ description }}</p>
    <!-- Optional slot for an action button, e.g. "Add Employee" — only
         rendered when the parent actually provides one. -->
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
