import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

function serviceWorkerPlugin() {
  return {
    name: 'inject-files-into-sw',
    writeBundle(options, bundle) {
      const swPath = resolve(options.dir, 'service-worker.js')
      try {
        let swContent = readFileSync(swPath, 'utf-8')
        const filesToCache = Object.keys(bundle)
          .filter(f => !f.endsWith('.map') && f !== 'service-worker.js')
          .map(f => `/${f}`)

        swContent = swContent.replace(
          'self.__FILES_TO_CACHE',
          JSON.stringify(filesToCache)
        )
        writeFileSync(swPath, swContent)
      } catch (e) {
        if (e.code !== 'ENOENT') {
          console.error('Error injecting files into service worker:', e)
        }
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte(), serviceWorkerPlugin()],
  build: {
    sourcemap: true,
    minify: true,
    rollupOptions: {
      input: {
        app: 'index.html',
        'service-worker': 'src/service-worker.js'
      },
      output: {
        entryFileNames: chunkInfo => {
          if (chunkInfo.name === 'service-worker') {
            return 'service-worker.js'
          }
          return 'assets/[name]-[hash].js'
        }
      }
    }
  }
})
