<!--
  Shared modal shell: backdrop blur, centered panel, Escape-to-close,
  click-outside-to-close. Used by ExperienceFormModal, ExcelUploadModal,
  BulkExportModal, and ConfirmDialog so none of them re-implement the
  positioning/backdrop/keyboard-handling logic themselves.
-->
<script setup>
import { onMounted, onUnmounted } from 'vue'
import Icon from './Icon.vue'

defineProps({
  title: { type: String, required: true },
  // Caps the panel width — most modals want a fixed width, but the Excel
  // upload results table benefits from being wider.
  maxWidthClass: { type: String, default: 'max-w-lg' },
})

// A modal only ever needs to tell its parent ONE thing: "I was asked to
// close." We don't need a v-model here (no value flows back in) — a
// single `close` event is the simpler, more honest API for this case.
const emit = defineEmits(['close'])

function handleKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

// onMounted/onUnmounted are Vue's equivalent of "componentDidMount /
// componentWillUnmount" — code here runs once when this component is
// inserted into the DOM, and the returned-nothing cleanup pairs with
// onUnmounted running once when it's removed. We attach the keydown
// listener to `window` (not this component's own element) because a
// modal should close on Escape no matter what has focus, so it can't be
// a template @keydown handler on an element inside the modal — it MUST
// be a global listener, which means it MUST be manually cleaned up or
// it would leak and keep firing after the modal is gone.
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <!--
    Teleport moves this template block to a different place in the actual
    DOM (here, the end of <body>) while keeping it logically part of THIS
    component in Vue's component tree (props/events/slots all still work
    normally). Without it, a modal opened from deep inside e.g. a table
    row would be constrained by that row's CSS (overflow:hidden,
    stacking context, etc.) — teleporting it to <body> guarantees it
    renders on top of everything else in the page.
  -->
  <Teleport to="body">
    <div class="fixed inset-0 z-modal flex items-center justify-center p-4">
      <!-- Backdrop: 5px blur + click-to-close, per the design spec's
           "5px backdrop blur" elevation rule for modals. -->
      <div
        class="absolute inset-0 bg-slate-900/30 backdrop-blur-modal"
        @click="emit('close')"
      />

      <div
        class="relative w-full rounded-lg bg-white shadow-modal"
        :class="maxWidthClass"
      >
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 class="text-headline-sm text-slate-900">{{ title }}</h2>
          <button
            type="button"
            aria-label="Close"
            class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            @click="emit('close')"
          >
            <Icon name="close" />
          </button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto px-6 py-5">
          <!-- Default slot: the modal's body content, supplied by whoever
               uses <BaseModal> — this component has no idea what goes here. -->
          <slot />
        </div>

        <!-- Named slot "footer": only rendered if the parent provides
             content for it (v-if works naturally here because an empty
             slot still renders its wrapping <div>, so we gate on
             $slots.footer to avoid an empty border-topped bar). -->
        <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
