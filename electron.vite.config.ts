import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

const CSP_META_TAG = /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*"\s*\/?>/

// unsafe-eval and the ws:/localhost connect-src exist only for the Vite dev server's HMR/React
// Fast Refresh; a production build loads static files with no dev server involved, so it can (and
// should) run under a strictly tighter policy.
const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'"

/** Swaps the dev-mode CSP baked into index/focus/mini.html for a stricter one, production builds only. */
function productionCsp(): Plugin {
  return {
    name: 'production-csp',
    transformIndexHtml: {
      // Runs after @vitejs/plugin-react's own html transform.
      order: 'post',
      handler(html, ctx) {
        if (ctx.server) return html // dev server is running - leave the dev CSP as-is
        return html.replace(CSP_META_TAG, `<meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`)
      }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/preload/index.ts'),
          restricted: resolve('src/preload/restricted.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react(), productionCsp()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
          focus: resolve('src/renderer/focus.html'),
          mini: resolve('src/renderer/mini.html')
        }
      }
    }
  }
})
