import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { jwtRole } from './src/lib/jwtRole.ts'

/** Falla el build si una variable VITE_* parece un secreto: terminaría en el bundle público. */
function forbidSecrets(): Plugin {
  return {
    name: 'forbid-secrets',
    config(_, { mode }) {
      for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), 'VITE_'))) {
        if (/service[_-]?role|secret|private/i.test(key) || jwtRole(value) === 'service_role') {
          throw new Error(`[seguridad] ${key} no puede exponerse al cliente: las variables VITE_* van al bundle público.`)
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    forbidSecrets(),
    process.env.ANALYZE ? visualizer({ filename: 'stats.html', template: 'treemap', gzipSize: true }) : null,
    process.env.ANALYZE ? visualizer({ filename: 'stats.json', template: 'raw-data', gzipSize: true }) : null,
  ],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] },
})
