import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages is served under /accountingasistentagent/
  base: '/accountingasistentagent/',
  plugins: [react()],
})
