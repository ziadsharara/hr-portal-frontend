<!--
  Shared button styled per the design system's primary/secondary/danger
  variants. Every button in the app should render through this component
  instead of a raw <button class="..."> so a visual tweak (e.g. changing
  the primary color) happens in exactly one file.
-->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    // Vue dev-mode will warn if a consumer passes anything outside this
    // list — cheap protection against typos like variant="Primary".
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost'].includes(value),
  },
  type: {
    type: String,
    default: 'button', // default to 'button' so it never accidentally submits a <form>
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary text-white hover:bg-primary-hover'
    case 'secondary':
      return 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
    case 'danger':
      return 'bg-white text-red-600 border border-slate-200 hover:bg-red-50'
    case 'ghost':
      return 'bg-transparent text-slate-600 hover:bg-slate-100'
    default:
      return ''
  }
})
</script>

<template>
  <!--
    :type="type" (not just `type`) because we're binding it to the PROP
    variable, not setting a literal HTML attribute named "type" — Vue
    templates share scope with the component's <script setup> bindings,
    so `type` here refers to the prop.
  -->
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-1.5 rounded px-3.5 py-2 text-body-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    :class="variantClasses"
  >
    <!-- The default slot lets callers put arbitrary content (text, an
         <Icon>, both) inside the button, e.g.
         <BaseButton><Icon name="plus" />Add Employee</BaseButton> -->
    <slot />
  </button>
</template>
