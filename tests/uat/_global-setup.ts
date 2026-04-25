import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { createTestUser } from './_helpers'

/**
 * Crée un user UAT unique partagé par tous les tests, écrit ses infos dans .uat-user.json.
 */
export default async function globalSetup() {
  const user = await createTestUser()
  const dir = join(process.cwd(), 'tests/uat/output')
  await mkdir(dir, { recursive: true })
  await writeFile(
    join(dir, '.uat-user.json'),
    JSON.stringify(user, null, 2),
    'utf8',
  )
  console.log(`[UAT setup] User créé : ${user.email}`)
}
