import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const buildId = Date.now().toString()

function emitVersion(): Plugin {
  return {
    name: 'emit-version',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ id: buildId }),
      })
    },
  }
}

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [react(), emitVersion()],
  server: {
    watch: {
      ignored: ['**/scripts/raw/**'],
    },
  },
})
