<!--
  Default route ("/") — the employees dashboard: filterable/sortable/
  paginated table, bulk selection -> CV export, and entry points into
  Add Employee / Excel upload.
-->
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeesStore } from '@/stores/employees'
import EmployeeFiltersBar from '@/components/employees/EmployeeFiltersBar.vue'
import EmployeeTable from '@/components/employees/EmployeeTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Icon from '@/components/common/Icon.vue'
import ExcelUploadModal from '@/components/upload/ExcelUploadModal.vue'
import BulkExportModal from '@/components/cv/BulkExportModal.vue'

const store = useEmployeesStore()
const router = useRouter()

// onMounted fires once, after this component's initial render is in the
// DOM. We use it here to kick off the FIRST data fetch — the store's own
// `watch` (see stores/employees.js) only reacts to CHANGES to filters/
// page/sort, so without this explicit call the table would stay empty
// until the user touched a filter.
onMounted(() => {
  store.fetchPage()
})

// Local (not store) UI state: whether each modal is currently open. This
// is intentionally NOT in Pinia — it's purely this view's own presentation
// state, nothing else in the app needs to read or react to it, so a
// plain ref() here is the right (simpler) tool.
const showGlobalUploadModal = ref(false)
const showEmployeeImportModal = ref(false)
const showBulkExportModal = ref(false)

function goToAddEmployee() {
  router.push({ name: 'employee-create' })
}

function handleExported() {
  // After a successful export, the selection no longer represents a
  // "pending action" — clear it so the sticky bar disappears and the
  // user doesn't accidentally re-export the same batch by misreading
  // stale UI state.
  store.clearSelection()
}
</script>

<template>
  <div class="p-6 pb-24">
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h1 class="text-headline-lg text-slate-900">Employees</h1>
      <div class="flex flex-wrap items-center gap-2">
        <BaseButton variant="secondary" @click="showEmployeeImportModal = true">
          <Icon name="upload" class="h-4 w-4" />
          Import Employees
        </BaseButton>
        <BaseButton variant="secondary" @click="showGlobalUploadModal = true">
          <Icon name="upload" class="h-4 w-4" />
          Upload Projects Excel
        </BaseButton>
        <BaseButton variant="primary" @click="goToAddEmployee">
          <Icon name="plus" class="h-4 w-4" />
          Add Employee
        </BaseButton>
      </div>
    </div>

    <div class="mb-4 rounded-lg border border-slate-200 bg-white p-4">
      <EmployeeFiltersBar />
    </div>

    <div class="rounded-lg border border-slate-200 bg-white">
      <EmployeeTable />
      <div class="border-t border-slate-200">
        <Pagination
          v-model:page="store.page"
          :total-pages="store.totalPages"
          :total-elements="store.totalElements"
          :size="store.size"
        />
      </div>
    </div>

    <p v-if="store.error" class="mt-3 text-body-md text-red-600">{{ store.error }}</p>
  </div>

  <!--
    Sticky bottom action bar — deliberately `fixed` (not CSS `sticky`)
    positioned relative to the viewport, so it stays pinned to the bottom
    of the screen regardless of how tall the table or how far the page
    has scrolled. md:left-60 offsets it past the sidebar's fixed width
    (15rem, matching AppSidebar's w-60) at md+, where the sidebar is
    always visible; below md the sidebar is off-canvas (see
    AppSidebar.vue), so the bar spans the full width there instead.
  -->
  <Transition name="slide-up">
    <div
      v-if="store.selectedCount > 0"
      class="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-slate-200 bg-slate-900/[0.02] px-6 py-3 backdrop-blur-sm md:left-60"
    >
      <p class="text-body-md font-medium text-slate-700">{{ store.selectedCount }} selected</p>
      <div class="flex items-center gap-2">
        <BaseButton variant="ghost" @click="store.clearSelection()">Clear</BaseButton>
        <BaseButton variant="primary" @click="showBulkExportModal = true">
          <Icon name="download" class="h-4 w-4" />
          Export CVs
        </BaseButton>
      </div>
    </div>
  </Transition>

  <ExcelUploadModal
    v-if="showEmployeeImportModal"
    mode="employee-import"
    @close="showEmployeeImportModal = false"
    @uploaded="store.fetchPage()"
  />

  <ExcelUploadModal
    v-if="showGlobalUploadModal"
    mode="global"
    @close="showGlobalUploadModal = false"
    @uploaded="store.fetchPage()"
  />

  <BulkExportModal
    v-if="showBulkExportModal"
    :company-codes="Array.from(store.selectedCompanyCodes)"
    @close="showBulkExportModal = false"
    @exported="handleExported"
  />
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
