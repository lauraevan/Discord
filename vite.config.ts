import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Built as a single self-contained index.html so it can be served straight
// from raw.githack.com without any asset path juggling.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 1024 * 1024,
    cssCodeSplit: false,
  },
})
