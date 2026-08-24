<!--
  Experience history table on the employee profile page. Unlike
  EmployeeTable (which reads the shared Pinia store directly), this
  component takes its data via PROPS and reports actions via EMITS —
  because it's a straightforwardly reusable, self-contained piece with no
  state that needs to outlive itself or be shared with a sibling view.
  This is the "normal" Vue component shape; the store-reading pattern in
  EmployeeTable is the exception, not the rule.
-->
<script setup>
import { formatDate, formatOrDash } from '@/utils/format'
import EmptyState from '@/components/common/EmptyState.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import Icon from '@/components/common/Icon.vue'

defineProps({
  experiences: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})

// defineEmits documents the component's OUTPUT contract: this component
// never navigates or mutates data itself — it just tells its parent
// "the user wants to edit/delete THIS ONE" and lets
// EmployeeProfileView.vue decide what that means (open a modal, call
// the API, etc). Keeping side effects out of this component is what
// makes it easy to reuse and easy to reason about in isolation.
const emit = defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200">
    <table class="w-full border-collapse text-left">
      <thead class="bg-slate-50">
        <tr class="border-b border-slate-200">
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500">Project</th>
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500">Type</th>
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500">Role</th>
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500">Industry</th>
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500">Country</th>
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500">Start Date</th>
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500">Duration</th>
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500"></th>
        </tr>
      </thead>

      <TableSkeleton v-if="loading" :rows="3" :columns="8" />

      <tbody v-else-if="experiences.length > 0">
        <tr v-for="exp in experiences" :key="exp.id" class="border-b border-slate-200 last:border-0 hover:bg-slate-50">
          <td class="px-4 py-3 text-data-value text-slate-900">{{ exp.project }}</td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ formatOrDash(exp.projectType) }}</td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ exp.role }}</td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ formatOrDash(exp.industry) }}</td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ formatOrDash(exp.country) }}</td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ formatDate(exp.startDate) }}</td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ formatOrDash(exp.duration) }}</td>
          <td class="px-4 py-3">
            <div class="flex items-center justify-end gap-1">
              <button
                type="button"
                aria-label="Edit experience"
                class="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
                @click="emit('edit', exp)"
              >
                <Icon name="pencil" class="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Delete experience"
                class="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                @click="emit('delete', exp)"
              >
                <Icon name="trash" class="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <EmptyState
      v-if="!loading && experiences.length === 0"
      icon="briefcase"
      title="No experience recorded yet"
      description="Add this employee's first project to start building their CV."
    />
  </div>
</template>
