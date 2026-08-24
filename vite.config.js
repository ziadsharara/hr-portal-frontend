import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Lets every file import with '@/...' instead of long relative paths
      // like '../../../services/employees.js'. Purely a DX convenience —
      // has no runtime effect once bundled.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
