<!--
  Generic yes/no confirmation modal — used for destructive actions like
  deleting an experience row, where a raw click-and-it's-gone button
  would be too easy to trigger by accident.
-->
<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
  confirmLabel: { type: String, default: 'Confirm' },
  danger: { type: Boolean, default: false },
  // Disables the confirm button and shows a busy label while the actual
  // delete/PUT/etc request this dialog guards is in flight — prevents a
  // double-submit from a second click.
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <BaseModal :title="title" max-width-class="max-w-sm" @close="emit('cancel')">
    <p class="text-body-md text-slate-600">{{ message }}</p>

    <template #footer>
      <BaseButton variant="secondary" :disabled="loading" @click="emit('cancel')">
        Cancel
      </BaseButton>
      <BaseButton :variant="danger ? 'danger' : 'primary'" :disabled="loading" @click="emit('confirm')">
        {{ loading ? 'Please wait…' : confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
