<!--
  Mounted exactly ONCE, in App.vue. Reads the shared toast store and
  renders whatever's currently in it — this is the "consumer" half of
  stores/toast.js; any component anywhere can call
  `useToastStore().success(...)` and it will appear here, wherever "here"
  is in the DOM tree, because Pinia state isn't tied to component
  position the way props/emits are.
-->
<script setup>
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'
import Icon from './Icon.vue'

const toastStore = useToastStore()
// storeToRefs() is needed here (instead of destructuring the store
// directly) to keep REACTIVITY when pulling `toasts` out of the store.
// Destructuring `const { toasts } = toastStore` would copy out the
// current array value once and lose its connection to future store
// updates, because Pinia stores are reactive objects, not plain refs, at
// the top level. storeToRefs wraps each state property in a proper ref
// that stays linked to the store. (We don't need storeToRefs for
// `dismiss` below, because it's a function/action, not reactive state —
// actions can be destructured directly.)
const { toasts } = storeToRefs(toastStore)
const { dismiss } = toastStore
</script>

<template>
  <!--
    Teleported to <body> for the same reason BaseModal is: ToastHost is
    mounted once, at the top of the tree, in App.vue — without a Teleport
    it stays there in DOM order, while every open modal teleports ITS
    content to the end of <body> and so always ends up as a later sibling.
    With equal z-index, later DOM order wins, which is exactly how a toast
    used to end up rendered underneath (and visually blurred by) a modal's
    backdrop. Teleporting here removes the DOM-order dependency entirely —
    z-toast (see tailwind.config.js) is the actual, order-independent
    guarantee that a toast always outranks a modal.
  -->
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-4 bottom-4 z-toast flex flex-col items-end gap-2 md:inset-x-auto md:right-4">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex w-full items-start gap-2 rounded border bg-white px-4 py-3 shadow-modal md:w-80"
          :class="toast.type === 'error' ? 'border-red-200' : 'border-emerald-200'"
        >
          <Icon
            :name="toast.type === 'error' ? 'xCircle' : 'checkCircle'"
            class="mt-0.5 shrink-0"
            :class="toast.type === 'error' ? 'text-red-500' : 'text-emerald-600'"
          />
          <p class="flex-1 text-body-md text-slate-700">{{ toast.message }}</p>
          <button
            type="button"
            aria-label="Dismiss"
            class="text-slate-400 hover:text-slate-600"
            @click="dismiss(toast.id)"
          >
            <Icon name="close" class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* TransitionGroup applies these classes automatically as items enter/
   leave the `toasts` array — no JS animation code needed. */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
