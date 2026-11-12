import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE ? visualizer({ filename: 'stats.html', template: 'treemap', gzipSize: true }) : null,
    process.env.ANALYZE ? visualizer({ filename: 'stats.json', template: 'raw-data', gzipSize: true }) : null,
  ],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
})
