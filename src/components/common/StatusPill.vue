<!--
  Small, rounded-full status badge. Design spec:
  Active = emerald/green, Inactive = slate/gray,
  10% opacity background + 100% opacity text.
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Matches the EmployeeStatus enum values the API actually sends:
  // "ACTIVE" | "INACTIVE" (confirmed in model/EmployeeStatus.java —
  // these are the JSON values, NOT the DB's "Active"/"Resign" strings).
  status: {
    type: String,
    required: true,
  },
})

// computed() because the CSS classes are entirely DERIVED from the
// `status` prop — there's nothing here to hold as its own state, it's a
// pure function of a prop. This is the textbook "computed vs ref"
// distinction: reach for computed() whenever a value can be calculated
// from something else instead of tracked independently.
const isActive = computed(() => props.status === 'ACTIVE')

const classes = computed(() =>
  isActive.value
    ? 'bg-emerald-600/10 text-emerald-700'
    : 'bg-slate-500/10 text-slate-600'
)

const label = computed(() => (isActive.value ? 'Active' : 'Inactive'))
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-data-label font-medium"
    :class="classes"
  >
    {{ label }}
  </span>
</template>
