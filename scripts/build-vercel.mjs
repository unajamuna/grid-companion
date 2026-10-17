// Packages the built site and the two server functions for Vercel (Build Output API v3).
// Runs after `npm run build` on Vercel (see vercel.json). Netlify keeps using netlify.toml.
//
// The functions are bundled with Rolldown because the shared app code imports files
// without extensions, which Vercel's per-file compile can't load as ES modules.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'rolldown'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, '.vercel', 'output')
const tmp = path.join(root, '.vercel', 'tmp')
fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(tmp, { recursive: true })

// Static files
fs.cpSync(path.join(root, 'dist'), path.join(out, 'static'), { recursive: true })

// Functions: the same handlers Netlify runs, wrapped for Node's request/response.
for (const name of ['eia', 'summary']) {
  const entry = path.join(tmp, `${name}.mjs`)
  fs.writeFileSync(entry, `import handler from ${JSON.stringify(path.join(root, 'netlify', 'functions', `${name}.ts`))}
export default async function (req, res) {
  const headers = Object.fromEntries(Object.entries(req.headers).filter(([, v]) => typeof v === 'string'))
  const r = await handler(new Request(\`https://\${req.headers.host}\${req.url}\`, { method: req.method, headers }))
  res.statusCode = r.status
  r.headers.forEach((v, k) => res.setHeader(k, v))
  res.end(Buffer.from(await r.arrayBuffer()))
}
`)
  const dir = path.join(out, 'functions', 'api', `${name}.func`)
  await build({ input: entry, platform: 'node', logLevel: 'warn', output: { file: path.join(dir, 'index.mjs'), format: 'esm' } })
  fs.writeFileSync(path.join(dir, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', maxDuration: 30 }, null, 2))
}

// Routes: CAISO's CSVs don't allow cross-origin browser requests, so proxy them (as netlify.toml does).
fs.writeFileSync(path.join(out, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '^/caiso/(.*)$', dest: 'https://www.caiso.com/outlook/current/$1' },
    { handle: 'filesystem' },
  ],
}, null, 2))
fs.rmSync(tmp, { recursive: true, force: true })
console.log('Vercel output ready in .vercel/output')
