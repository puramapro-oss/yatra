// Isolated UI harness: no production routes, auth, environment files or services.
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const harness = await mkdtemp(path.join(tmpdir(), 'yatra-alertes-ui-'))
const port = process.env.YATRA_ALERTS_UI_PORT ?? '3137'
const source = path.join(repository, 'src')
await mkdir(path.join(harness, 'app'))
await symlink(path.join(repository, 'node_modules'), path.join(harness, 'node_modules'), 'dir')
const files = {
  'package.json': JSON.stringify({ private: true, type: 'module' }),
  'tsconfig.json': JSON.stringify({ compilerOptions: {
    target: 'ES2017', lib: ['dom', 'esnext'], jsx: 'react-jsx', strict: true, skipLibCheck: true,
    module: 'esnext', moduleResolution: 'bundler', esModuleInterop: true, noEmit: true,
    paths: { '@/*': [`${path.relative(harness, source)}/*`], '@fixtures': [path.relative(harness, path.join(repository, 'tests/vacances/alertes-ui-fixtures.ts'))] },
  }, include: ['**/*.ts', '**/*.tsx'] }),
  'next.config.mjs': `export default { experimental: { externalDir: true }, devIndicators: false,
    webpack(config) {
      config.resolve.alias['@'] = ${JSON.stringify(source)}
      config.resolve.alias['@fixtures'] = ${JSON.stringify(path.join(repository, 'tests/vacances/alertes-ui-fixtures.ts'))}
      return config
    }
  }\n`,
  'postcss.config.mjs': 'export default { plugins: { "@tailwindcss/postcss": {} } }\n',
  'app/globals.css': `${await readFile(path.join(source, 'app/globals.css'), 'utf8')}\n@source "${source}/app/dashboard/vacances/alertes";\n@source "${source}/components/multisensoriel/NatureBackground.tsx";\n`,
  'app/layout.tsx': `import './globals.css'
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>
}
`,
  'app/page.tsx': `import { AlertesView } from '@/app/dashboard/vacances/alertes/AlertesView'
import { alertsFixture } from '@fixtures'
export default async function Page({ searchParams }: { searchParams: Promise<{ scenario?: string }> }) {
  const failed = (await searchParams).scenario === 'error'
  return <AlertesView initialConfigs={failed ? [] : alertsFixture.configs}
    initialNotifications={failed ? [] : alertsFixture.notifications}
    initialError={failed ? 'Tes alertes sont momentanément indisponibles. Actualise pour réessayer.' : null} />
}
`,
}
await Promise.all(Object.entries(files).map(([name, contents]) => writeFile(path.join(harness, name), contents)))
const child = spawn(process.execPath, [path.join(repository, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', port], {
  cwd: harness, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
})
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal))
child.once('exit', async (code) => {
  await rm(harness, { recursive: true, force: true })
  process.exitCode = code ?? 0
})
