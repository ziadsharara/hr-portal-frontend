<!--
  Fixed sidebar navigation, per the design spec's "fixed sidebar nav +
  fluid workspace" layout rule. This app currently has one real section
  (Employees), but it's still a real <RouterLink> nav (not a static
  label) so adding a second section later is a one-line change here.

  Below the md breakpoint this becomes an off-canvas drawer instead of a
  permanently-visible column — there's no room for a permanent 15rem
  sidebar on a phone. `open` (driven by App.vue's hamburger button) only
  has any visual effect below md; at md and up the translate-x classes
  are always overridden back to 0, so desktop is pixel-identical to
  before this existed.
-->
<script setup>
import { useRoute } from 'vue-router'
import Icon from '@/components/common/Icon.vue'

defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

// useRoute() gives reactive access to the CURRENT route anywhere in the
// component tree, without it being passed down as a prop. We use it here
// just to highlight the active nav item.
const route = useRoute()
</script>

<template>
  <!-- Backdrop: mobile-only (md:hidden), only rendered while the drawer
       is open, tap-to-close. Sits below the sidebar itself (z-30 vs the
       sidebar's z-40) but above ordinary page content. -->
  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-slate-900/30 md:hidden"
    @click="emit('close')"
  />

  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out md:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center gap-2 px-6 py-5">
      <div class="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
        <Icon name="briefcase" class="h-4 w-4" />
      </div>
      <div class="flex-1">
        <p class="text-body-md font-semibold leading-tight text-slate-900">HR Portal</p>
        <p class="text-data-label text-slate-500">CIC</p>
      </div>
      <!-- Close button: mobile-only, since md+ never has this drawer
           open/closeable in the first place. -->
      <button
        type="button"
        aria-label="Close menu"
        class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
        @click="emit('close')"
      >
        <Icon name="close" class="h-4 w-4" />
      </button>
    </div>

    <nav class="flex flex-col gap-0.5 px-3">
      <RouterLink
        to="/employees"
        class="flex items-center gap-2.5 rounded px-3 py-2 text-body-md font-medium transition-colors"
        :class="
          route.path.startsWith('/employees')
            ? 'bg-primary/10 text-primary'
            : 'text-slate-600 hover:bg-slate-50'
        "
        @click="emit('close')"
      >
        <Icon name="users" />
        Employees
      </RouterLink>
    </nav>
  </aside>
</template>
