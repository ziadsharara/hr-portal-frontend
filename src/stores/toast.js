// Pinia store for app-wide toast notifications (success/error banners
// that pop up in a corner and auto-dismiss).
//
// Why a STORE and not just local component state: toasts need to be
// triggered from almost anywhere — a service call inside a modal, a
// row-level delete button in a table, a form on a completely different
// route — and displayed by ONE <ToastHost /> mounted once in App.vue.
// A Pinia store is exactly Vue's answer to "shared reactive state that
// isn't naturally owned by a single component's parent/child tree".
//
// This uses Pinia's "setup store" syntax: defineStore(id, () => {...})
// instead of the older options-object syntax (defineStore(id, { state,
// actions, getters })). A setup store's function body runs like a
// component's <script setup> — ref()s become reactive state, plain
// functions become actions, computed()s become getters. We use this
// style throughout the app so the mental model for "component" and
// "store" stays the same.
import { ref } from 'vue'
import { defineStore } from 'pinia'

let nextId = 1

export const useToastStore = defineStore('toast', () => {
  // ref() (not reactive()) because `toasts` is a single value — an
  // array — that we reassign/mutate as a whole unit. Vue's reactivity
  // system tracks array mutations (push/splice) through ref just fine
  // because ref wraps the array in a reactive proxy under the hood.
  const toasts = ref([])

  function push(message, { type = 'success', durationMs = 4000 } = {}) {
    const id = nextId++
    toasts.value.push({ id, message, type })

    // Auto-dismiss after durationMs. setTimeout is fine here (no need
    // for onUnmounted cleanup) because this store outlives every
    // component — it's a singleton for the whole app's lifetime.
    setTimeout(() => dismiss(id), durationMs)

    return id
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // Thin convenience wrappers so call sites read as `toast.success(...)`
  // / `toast.error(...)` instead of `toast.push(msg, { type: 'error' })`
  // everywhere.
  function success(message) {
    return push(message, { type: 'success' })
  }

  function error(message) {
    // Errors stay on screen a bit longer than a success confirmation —
    // they're usually longer to read and more important not to miss.
    return push(message, { type: 'error', durationMs: 6000 })
  }

  return { toasts, push, dismiss, success, error }
})
