<!--
  Loading-state placeholder rows for a table — shown while the initial
  request is in flight so the layout doesn't jump from blank -> populated,
  and so the user gets immediate feedback that something is happening.
-->
<script setup>
defineProps({
  rows: { type: Number, default: 8 },
  columns: { type: Number, default: 5 },
})
</script>

<template>
  <tbody>
    <tr v-for="row in rows" :key="row" class="border-b border-slate-200">
      <td v-for="col in columns" :key="col" class="px-4 py-3">
        <!-- animate-pulse is a built-in Tailwind utility (opacity 1 -> .5
             loop) — no custom keyframes needed for a basic skeleton. -->
        <div class="h-4 animate-pulse rounded bg-slate-200" :style="{ width: col === 1 ? '1.5rem' : '70%' }" />
      </td>
    </tr>
  </tbody>
</template>
