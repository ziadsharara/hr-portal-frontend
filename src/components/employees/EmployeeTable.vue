<!--
  The main employees table: checkboxes for bulk selection, sortable
  columns, status pill, click-row-to-open-profile. Reads list/selection/
  sort state straight from useEmployeesStore() — see the comment in
  EmployeeFiltersBar.vue for why that's the right call for this
  particular component (it's the dashboard's table, not a generic
  reusable one).
-->
<script setup>
import { useRouter } from 'vue-router'
import { useEmployeesStore } from '@/stores/employees'
import StatusPill from '@/components/common/StatusPill.vue'
import TableSkeleton from '@/components/common/TableSkeleton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/common/Icon.vue'

const store = useEmployeesStore()
const router = useRouter()

// Columns that can be sorted map directly to real Employee entity field
// names (companyCode, name, position, organizationalUnit) — Spring Data
// sorts by JPA entity property name, so these strings have to match
// exactly what's declared in model/Employee.java, not the display label.
const columns = [
  { field: 'companyCode', label: 'Company Code' },
  { field: 'name', label: 'Name' },
  { field: 'position', label: 'Position' },
  { field: 'organizationalUnit', label: 'Org Unit' },
]

function openProfile(companyCode) {
  router.push({ name: 'employee-profile', params: { companyCode } })
}
</script>

<template>
  <div class="overflow-x-auto rounded-lg border border-slate-200">
    <table class="w-full border-collapse text-left">
      <thead class="bg-slate-50">
        <tr class="border-b border-slate-200">
          <th class="w-10 px-4 py-3">
            <input
              type="checkbox"
              aria-label="Select all employees on this page"
              :checked="store.allOnPageSelected"
              class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
              @change="store.allOnPageSelected = $event.target.checked"
            />
          </th>
          <th
            v-for="col in columns"
            :key="col.field"
            class="cursor-pointer select-none px-4 py-3 text-label-caps uppercase text-slate-500"
            @click="store.setSort(col.field)"
          >
            <span class="inline-flex items-center gap-1">
              {{ col.label }}
              <Icon
                v-if="store.sortField === col.field"
                :name="store.sortDirection === 'asc' ? 'chevronDown' : 'chevronDown'"
                class="h-3.5 w-3.5"
                :class="store.sortDirection === 'desc' && 'rotate-180'"
              />
            </span>
          </th>
          <th class="px-4 py-3 text-label-caps uppercase text-slate-500">Status</th>
        </tr>
      </thead>

      <!-- Loading state: skeleton rows instead of a spinner, so the table
           shape doesn't jump once real rows arrive. -->
      <TableSkeleton v-if="store.loading" :rows="store.size" :columns="5" />

      <tbody v-else-if="store.items.length > 0">
        <tr
          v-for="employee in store.items"
          :key="employee.companyCode"
          class="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-slate-50"
          @click="openProfile(employee.companyCode)"
        >
          <td class="px-4 py-3">
            <!--
              @click.stop (a Vue event modifier) stops this click from
              bubbling up to the <tr>'s own @click="openProfile(...)" —
              without it, checking the box would ALSO navigate to that
              employee's profile page, which is not what the user meant.
            -->
            <input
              type="checkbox"
              :aria-label="`Select ${employee.name}`"
              :checked="store.selectedCompanyCodes.has(employee.companyCode)"
              class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
              @click.stop
              @change="store.toggleSelection(employee.companyCode)"
            />
          </td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ employee.companyCode }}</td>
          <td class="px-4 py-3 text-data-value text-slate-900">{{ employee.name }}</td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ employee.position || '—' }}</td>
          <td class="px-4 py-3 text-data-value text-slate-700">{{ employee.organizationalUnit || '—' }}</td>
          <td class="px-4 py-3"><StatusPill :status="employee.status" /></td>
        </tr>
      </tbody>
    </table>

    <EmptyState
      v-if="!store.loading && store.items.length === 0"
      icon="users"
      title="No employees match your filters"
      description="Try widening your search or clearing a filter."
    />
  </div>
</template>
