<!--
  Root component. Renders the fixed sidebar once, then <RouterView>
  swaps in whichever view matches the current URL (see router/index.js).
  ToastHost is mounted once here too, at the top of the tree, so it's
  always present no matter which route is active.
-->
<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ToastHost from '@/components/common/ToastHost.vue'
</script>

<template>
  <div class="min-h-screen bg-white">
    <AppSidebar />

    <!-- pl-60 matches the sidebar's fixed width (w-60) so the workspace
         content starts right after it instead of being covered by it —
         a `position: fixed` sidebar is taken out of normal document
         flow, so this offset has to be applied manually. -->
    <main class="min-h-screen bg-white pl-60">
      <RouterView />
    </main>

    <ToastHost />
  </div>
</template>
