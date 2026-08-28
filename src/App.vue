<!--
  Root component. Renders the fixed sidebar once, then <RouterView>
  swaps in whichever view matches the current URL (see router/index.js).
  ToastHost is mounted once here too, at the top of the tree, so it's
  always present no matter which route is active.

  Below md, the sidebar is an off-canvas drawer (see AppSidebar.vue)
  rather than a permanently-visible column, so this component also owns
  a small mobile-only top bar with the hamburger button that opens it —
  there'd otherwise be no way to reach the nav at all on a phone.
-->
<script setup>
import { ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import Icon from '@/components/common/Icon.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-white">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Mobile-only top bar (md:hidden): the only way to open the
         off-canvas sidebar on a phone, since it isn't visible by
         default there. Doesn't exist at md+, where the sidebar is
         always visible and this would be redundant. -->
    <header class="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        class="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        @click="sidebarOpen = true"
      >
        <Icon name="menu" class="h-5 w-5" />
      </button>
      <p class="text-body-md font-semibold text-slate-900">HR Portal</p>
    </header>

    <!-- md:pl-60 matches the sidebar's fixed width (w-60) so the
         workspace content starts right after it instead of being
         covered by it — a `position: fixed` sidebar is taken out of
         normal document flow, so this offset has to be applied
         manually. No offset below md: the sidebar is off-canvas there
         (see AppSidebar.vue), so the workspace can use the full width. -->
    <main class="min-h-screen bg-white md:pl-60">
      <RouterView />
    </main>

    <ToastHost />
  </div>
</template>
