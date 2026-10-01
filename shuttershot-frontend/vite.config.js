import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Bind every interface, not just loopback, so a phone on the same LAN
    // (e.g. scanning a booking QR code) can reach the dev server too.
    host: true,
  },
})
