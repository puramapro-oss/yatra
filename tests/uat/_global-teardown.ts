import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { deleteTestUser } from './_helpers'

export default async function globalTeardown() {
  try {
    const raw = await readFile(join(process.cwd(), 'tests/uat/output/.uat-user.json'), 'utf8')
    const user = JSON.parse(raw)
    if (user?.id) {
      await deleteTestUser(user.id)
      console.log(`[UAT teardown] User supprimé : ${user.email}`)
    }
  } catch {
    // best-effort
  }
}
