import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { linkSync, lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifySmaranaSource } from './verify-smarana-source.mjs';

/** Pack only admitted source, offline and without lifecycle or credentials. */
export function packageVerifiedSmarana({ sourceRoot, destination, manifest, integrity, env = process.env, run = spawnSync }) {
  const verified = verifySmaranaSource(sourceRoot, manifest);
  if (!/^sha512-[A-Za-z0-9+/]{86}==$/.test(integrity ?? '')) throw new Error('A locked SHA-512 archive integrity is required.');
  const output = path.resolve(destination);
  const parent = path.dirname(output);
  if (realpathSync(parent) !== parent) throw new Error('Archive destination must have a plain parent.');
  const parentIdentity = lstatSync(parent);
  const staging = mkdtempSync(path.join(parent, '.smarana-pack-'));
  const digest = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
  try {
    const clean = { PATH: env.PATH, HOME: staging, TMPDIR: staging,
      npm_config_cache: path.join(staging, 'cache'), npm_config_userconfig: path.join(staging, 'user.npmrc'), npm_config_globalconfig: path.join(staging, 'global.npmrc'),
      npm_config_update_notifier: 'false' };
    const packed = run('npm', ['pack', '--ignore-scripts', '--offline', '--json', '--pack-destination', staging, path.resolve(sourceRoot)], {
      env: clean, cwd: staging, encoding: 'utf8', shell: false, timeout: 30000, maxBuffer: 1024 * 1024,
    });
    if (packed.error || packed.status !== 0) throw new Error('Verified SMARANA archive creation failed.');
    const items = JSON.parse(packed.stdout);
    if (items.length !== 1 || items[0].filename !== 'purama-smarana-0.1.0.tgz') throw new Error('Unexpected SMARANA archive metadata.');
    const archive = path.join(staging, items[0].filename);
    const stat = lstatSync(archive);
    if (!stat.isFile() || stat.size > 4 * 1024 * 1024 || digest(readFileSync(archive)) !== integrity) throw new Error('SMARANA archive integrity mismatch.');
    const currentParent = lstatSync(parent);
    if (realpathSync(parent) !== parent || currentParent.dev !== parentIdentity.dev || currentParent.ino !== parentIdentity.ino) {
      throw new Error('Archive destination parent changed during packaging.');
    }
    let existing;
    try { existing = lstatSync(output); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (existing) {
      if (!existing.isFile() || existing.size !== stat.size || digest(readFileSync(output)) !== integrity) throw new Error('Existing archive differs; it was preserved.');
    } else linkSync(archive, output); // Atomic publication; never replaces a raced target.
    return { ...verified, archiveIntegrity: integrity, archiveBytes: stat.size, offlinePackaging: true };
  } finally {
    rmSync(staging, { recursive: true, force: true });
    try { lstatSync(staging); throw new Error('Packaging temporary directory remains.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/package-verified-smarana.mjs VERIFIED_SOURCE');
    const manifest = JSON.parse(readFileSync(new URL('../tooling/smarana-source.lock.json', import.meta.url), 'utf8'));
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
    const entry = lock.packages['node_modules/@purama/smarana'];
    const expected = `file:../packages/purama-smarana-${manifest.commit.slice(0, 7)}.tgz`;
    if (entry.resolved !== expected || lock.packages[''].dependencies['@purama/smarana'] !== expected) throw new Error('SMARANA archive path differs from its immutable source revision.');
    const result = packageVerifiedSmarana({ sourceRoot: process.argv[2], destination: new URL(`../${entry.resolved.slice(5)}`, import.meta.url).pathname,
      manifest, integrity: entry.integrity });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
