<!--
  Search box + Status/Position/Org Unit filter dropdowns for the
  dashboard. Reads and writes directly from useEmployeesStore() rather
  than receiving filters as props — this component only ever exists
  alongside the dashboard's employee list, so going through the shared
  store avoids pointless prop-drilling (EmployeesDashboardView would
  otherwise have to pass 4 values down and listen for 4 update events for
  no benefit). Contrast this with BaseInput/BaseSelect, which DO need
  props/emits (via defineModel) because they're generic and reused with
  totally different data across the app.
-->
<script setup>
import { useEmployeesStore } from '@/stores/employees'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import Icon from '@/components/common/Icon.vue'

const store = useEmployeesStore()

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
    <div class="relative md:col-span-4">
      <label class="mb-1 block text-data-label text-slate-500">Search</label>
      <span class="pointer-events-none absolute left-3 top-[38px] text-slate-400">
        <Icon name="search" class="h-4 w-4" />
      </span>
      <!--
        v-model.trim isn't used here on purpose: trimming as the user
        types would fight with them typing a trailing space mid-word.
        The store's search filter is sent to the backend as-is; the
        backend's LIKE query already does a case-insensitive partial
        match, so leading/trailing whitespace has no practical effect on
        results.
      -->
      <input
        v-model="store.filters.search"
        type="text"
        placeholder="Search by name or Arabic name…"
        class="w-full rounded border border-slate-200 bg-white py-2 pl-9 pr-3 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>

    <div class="md:col-span-3">
      <BaseSelect
        v-model="store.filters.status"
        label="Status"
        :options="statusOptions"
        allow-empty
        empty-label="All statuses"
      />
    </div>

    <div class="md:col-span-3">
      <BaseSelect
        v-model="store.filters.position"
        label="Position"
        :options="store.positionOptions"
        allow-empty
        empty-label="All positions"
      />
    </div>

    <div class="md:col-span-2">
      <BaseSelect
        v-model="store.filters.organizationalUnit"
        label="Org Unit"
        :options="store.organizationalUnitOptions"
        allow-empty
        empty-label="All units"
      />
    </div>
  </div>
</template>
