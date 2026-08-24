<!--
  Fixed sidebar navigation, per the design spec's "fixed sidebar nav +
  fluid workspace" layout rule. This app currently has one real section
  (Employees), but it's still a real <RouterLink> nav (not a static
  label) so adding a second section later is a one-line change here.
-->
<script setup>
import { useRoute } from 'vue-router'
import Icon from '@/components/common/Icon.vue'

// useRoute() gives reactive access to the CURRENT route anywhere in the
// component tree, without it being passed down as a prop. We use it here
// just to highlight the active nav item.
const route = useRoute()
</script>

<template>
  <aside class="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-slate-200 bg-white">
    <div class="flex items-center gap-2 px-6 py-5">
      <div class="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
        <Icon name="briefcase" class="h-4 w-4" />
      </div>
      <div>
        <p class="text-body-md font-semibold leading-tight text-slate-900">HR Portal</p>
        <p class="text-data-label text-slate-500">CIC</p>
      </div>
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
      >
        <Icon name="users" />
        Employees
      </RouterLink>
    </nav>
  </aside>
</template>
