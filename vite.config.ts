import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` matches the GitHub Pages project path (https://<user>.github.io/backwords/).
// In dev the server still serves from '/', so this only affects production asset URLs.
export default defineConfig({
  base: '/backwords/',
  plugins: [react()],
})
