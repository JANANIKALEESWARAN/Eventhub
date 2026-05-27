import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',   // Required for Capacitor — loads assets from filesystem, not a server
  server: {
    host: true,   // Expose on LAN so phone can reach dev server for live reload
    port: 5173,
  },
})
