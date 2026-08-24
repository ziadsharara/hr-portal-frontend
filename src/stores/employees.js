// Pinia store owning the EMPLOYEE LIST + FILTER state shown on the
// dashboard. Pulled out of the view (rather than living in
// EmployeesDashboardView's own refs) because:
//   1. The brief calls for state "shared between the dashboard and other
//      views" — the Add/Edit Employee form reuses `knownPositions` /
//      `knownOrgUnits` below to suggest values while typing.
//   2. Row selection for bulk CV export needs to survive independently
//      of whatever the table component's internal render state is.
//
// This is a Pinia "setup store" (see stores/toast.js for why we use this
// style everywhere): the function body below runs once, like a
// component's <script setup>, and whatever it returns becomes the
// store's public state/getters/actions.
import { ref, reactive, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { fetchEmployees } from '@/services/employees'
import { parseApiError } from '@/utils/apiError'

// How long to wait after the user stops typing in the search box before
// firing a request. Without this, every keystroke would hit the API.
const SEARCH_DEBOUNCE_MS = 350

export const useEmployeesStore = defineStore('employees', () => {
  // --- Filter state -------------------------------------------------
  // reactive() (not several separate refs) because these four fields are
  // conceptually ONE object — "the current filter set" — and we want to
  // pass/reset them as a group. reactive() gives us that without the
  // `.value` unwrapping refs would need on every property access.
  const filters = reactive({
    search: '',
    status: '', // '' = no filter; otherwise 'ACTIVE' | 'INACTIVE'
    position: '',
    organizationalUnit: '',
  })

  // --- Pagination + sort ---------------------------------------------
  const page = ref(0) // 0-indexed, matches Spring's Pageable
  const size = ref(10)
  const sortField = ref('name')
  const sortDirection = ref('asc') // 'asc' | 'desc'

  // computed() here because `sortParam` is fully DERIVED from
  // sortField/sortDirection — it should never be set directly, only
  // recomputed when its inputs change. Using a plain ref for this would
  // let something accidentally set it out of sync with the two fields it
  // depends on.
  const sortParam = computed(() => `${sortField.value},${sortDirection.value}`)

  // --- Request state ---------------------------------------------------
  const items = ref([])
  const totalElements = ref(0)
  const totalPages = ref(0)
  const loading = ref(false)
  const error = ref(null)

  // --- Row selection (for bulk CV export) -----------------------------
  // A Set is the natural fit for "which company codes are checked" —
  // O(1) add/remove/has, and it's exactly the "selected IDs" pattern
  // most admin tables use. Vue's reactivity DOES track Set
  // mutations (add/delete/clear) through ref, same as it does arrays.
  const selectedCompanyCodes = ref(new Set())

  const selectedCount = computed(() => selectedCompanyCodes.value.size)

  // "Select all" checkbox is a computed getter/setter pair: reading it
  // reports whether every row on the CURRENT PAGE is selected; writing
  // to it (v-model in the table header) selects/deselects that whole
  // page in one go. This is a good example of why computed() sometimes
  // needs a `set` — plain refs can't express "derived from other state
  // AND writable" in one declaration.
  const allOnPageSelected = computed({
    get() {
      return items.value.length > 0 && items.value.every((e) => selectedCompanyCodes.value.has(e.companyCode))
    },
    set(checked) {
      const next = new Set(selectedCompanyCodes.value)
      for (const employee of items.value) {
        if (checked) next.add(employee.companyCode)
        else next.delete(employee.companyCode)
      }
      selectedCompanyCodes.value = next
    },
  })

  function toggleSelection(companyCode) {
    const next = new Set(selectedCompanyCodes.value)
    if (next.has(companyCode)) next.delete(companyCode)
    else next.add(companyCode)
    selectedCompanyCodes.value = next
  }

  function clearSelection() {
    selectedCompanyCodes.value = new Set()
  }

  // --- Known filter values (client-derived, see note below) -----------
  // There is NO backend endpoint that returns the distinct set of
  // Position / Organizational Unit values in use — confirmed by reading
  // every EmployeeController method. Rather than inventing an endpoint
  // that doesn't exist or hardcoding a fake list, we build these sets
  // from REAL employee records as pages load. Limitation: this only
  // reflects values seen in pages fetched so far this session, not the
  // full universe of values in the database. Good enough for an internal
  // filter dropdown; a dedicated `/employees/positions` endpoint would be
  // the correct long-term fix if this becomes a problem.
  const knownPositions = ref(new Set())
  const knownOrganizationalUnits = ref(new Set())

  const positionOptions = computed(() => Array.from(knownPositions.value).sort())
  const organizationalUnitOptions = computed(() => Array.from(knownOrganizationalUnits.value).sort())

  function recordKnownValues(employeeList) {
    for (const employee of employeeList) {
      if (employee.position) knownPositions.value.add(employee.position)
      if (employee.organizationalUnit) knownOrganizationalUnits.value.add(employee.organizationalUnit)
    }
  }

  // --- The actual fetch -------------------------------------------------
  async function fetchPage() {
    loading.value = true
    error.value = null
    try {
      const response = await fetchEmployees({
        search: filters.search || undefined,
        status: filters.status || undefined,
        position: filters.position || undefined,
        organizationalUnit: filters.organizationalUnit || undefined,
        page: page.value,
        size: size.value,
        sort: sortParam.value,
      })
      items.value = response.content
      totalElements.value = response.totalElements
      totalPages.value = response.totalPages
      recordKnownValues(response.content)
    } catch (err) {
      error.value = parseApiError(err).message
      items.value = []
    } finally {
      loading.value = false
    }
  }

  // Any filter/sort change should reset back to page 0 — staying on
  // page 3 of a NEW filter result (which might only have 1 page) would
  // silently show an empty table for a confusing reason.
  function resetToFirstPage() {
    page.value = 0
  }

  // --- Reactive wiring ---------------------------------------------------
  // watch() (rather than just calling fetchPage() manually from the view
  // every time a filter changes) centralizes "what triggers a refetch"
  // in ONE place. Any future filter added to `filters` is automatically
  // covered because the whole reactive object is the watch source.
  let debounceHandle = null
  watch(
    () => ({ ...filters }),
    () => {
      resetToFirstPage()
      clearTimeout(debounceHandle)
      // Debounced: typing "ahmed" shouldn't fire 5 requests, one per
      // keystroke. Status/position/organizationalUnit changes ALSO go
      // through this debounce for simplicity — a 350ms delay on a
      // dropdown selection is imperceptible to a user, so one code path
      // for all filters is worth the tiny delay on non-text filters.
      debounceHandle = setTimeout(fetchPage, SEARCH_DEBOUNCE_MS)
    },
    { deep: true }
  )

  // Page/size/sort changes should refetch IMMEDIATELY — these are
  // deliberate discrete clicks (a pagination button, a column header),
  // not something a user "types into", so no debounce is needed here.
  watch([page, size, sortField, sortDirection], fetchPage)

  function setSort(field) {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortDirection.value = 'asc'
    }
  }

  return {
    filters,
    page,
    size,
    sortField,
    sortDirection,
    items,
    totalElements,
    totalPages,
    loading,
    error,
    selectedCompanyCodes,
    selectedCount,
    allOnPageSelected,
    toggleSelection,
    clearSelection,
    positionOptions,
    organizationalUnitOptions,
    fetchPage,
    setSort,
  }
})
