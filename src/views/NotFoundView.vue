<!--
  Catch-all route (path: '/:pathMatch(.*)*' in router/index.js) for any
  URL that doesn't match a real route — as opposed to EmployeeProfileView's
  "not found" state, which is for a well-formed URL pointing at an
  employee that doesn't exist in the database.
-->
<script setup>
import { useRouter } from 'vue-router'
import EmptyState from '@/components/common/EmptyState.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
</script>

<template>
  <div class="p-6">
    <EmptyState
      icon="alertTriangle"
      title="Page not found"
      description="The page you're looking for doesn't exist."
    >
      <template #action>
        <BaseButton variant="primary" @click="router.push({ name: 'employees-dashboard' })">
          Back to Employees
        </BaseButton>
      </template>
    </EmptyState>
  </div>
</template>
