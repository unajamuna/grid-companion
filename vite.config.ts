import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import eia from './netlify/functions/eia.ts'

// Runs the Netlify EIA function inside the dev server, with EIA_API_KEY from .env
// (gitignored). Responses are cached for 15 minutes to spare the key's hourly limit.
function eiaDev(): Plugin {
  const cache = new Map<string, { at: number; status: number; body: string }>()
  return {
    name: 'eia-dev',
    configureServer(server) {
      server.middlewares.use('/api/eia', async (req, res) => {
        const url = `http://localhost${req.originalUrl}`
        let hit = cache.get(url)
        if (!hit || Date.now() - hit.at > 15 * 60_000) {
          try {
            const r = await eia(new Request(url))
            hit = { at: Date.now(), status: r.status, body: await r.text() }
            if (r.ok) cache.set(url, hit)
          } catch (e) {
            hit = { at: Date.now(), status: 500, body: JSON.stringify({ error: String(e) }) }
          }
        }
        res.statusCode = hit.status
        res.setHeader('Content-Type', 'application/json')
        res.end(hit.body)
      })
      // The widget summary shares the app's code, so load it through Vite on demand.
      server.middlewares.use('/api/summary', async (req, res) => {
        try {
          const mod = await server.ssrLoadModule('/netlify/functions/summary.ts')
          const r: Response = await mod.default(new Request(`http://${req.headers.host}${req.originalUrl}`))
          res.statusCode = r.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await r.text())
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(e) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  process.env.EIA_API_KEY ??= loadEnv(mode, process.cwd(), '').EIA_API_KEY
  return {
    plugins: [react(), tailwindcss(), eiaDev()],
    // Lets the Übersicht widget preview (widgets/uebersicht/dev) import its 'uebersicht' module.
    resolve: { alias: { uebersicht: '/widgets/uebersicht/dev/uebersicht-stub.js' } },
    server: {
      // CAISO's CSVs don't allow cross-origin browser requests, so we proxy them.
      // netlify.toml does the same in production.
      proxy: {
        '/caiso': {
          target: 'https://www.caiso.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/caiso/, '/outlook/current'),
        },
      },
    },
  }
})
