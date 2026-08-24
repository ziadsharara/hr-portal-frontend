<!--
  Page-number controls wired directly to the API's page/size params
  (0-indexed, matching Spring's Pageable — see stores/employees.js).
-->
<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

// A NAMED model: defineModel('page') lets the parent write
// `v-model:page="store.page"` instead of the generic unnamed
// `v-model`. Useful here because this component's only job is to control
// ONE piece of parent state (the current page number).
const page = defineModel('page', { type: Number, required: true })

const props = defineProps({
  totalPages: { type: Number, required: true },
  totalElements: { type: Number, required: true },
  size: { type: Number, required: true },
})

const isFirstPage = computed(() => page.value <= 0)
const isLastPage = computed(() => page.value >= props.totalPages - 1)

// Human-readable "Showing 21–40 of 137" range. All derived from props/
// model, so computed() again rather than tracked as separate state that
// could drift out of sync.
const rangeLabel = computed(() => {
  if (props.totalElements === 0) return 'No results'
  const start = page.value * props.size + 1
  const end = Math.min(start + props.size - 1, props.totalElements)
  return `Showing ${start}–${end} of ${props.totalElements}`
})

function goToPrevious() {
  if (!isFirstPage.value) page.value -= 1
}

function goToNext() {
  if (!isLastPage.value) page.value += 1
}
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3">
    <p class="text-data-label text-slate-500">{{ rangeLabel }}</p>
    <div class="flex items-center gap-1">
      <button
        type="button"
        :disabled="isFirstPage"
        class="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous page"
        @click="goToPrevious"
      >
        <Icon name="chevronLeft" />
      </button>
      <span class="px-2 text-data-value text-slate-700">
        Page {{ totalPages === 0 ? 0 : page + 1 }} of {{ totalPages }}
      </span>
      <button
        type="button"
        :disabled="isLastPage"
        class="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Next page"
        @click="goToNext"
      >
        <Icon name="chevronRight" />
      </button>
    </div>
  </div>
</template>
