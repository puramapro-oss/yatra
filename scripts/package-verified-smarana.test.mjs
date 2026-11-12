import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { packageVerifiedSmarana } from './package-verified-smarana.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'smarana-archive-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceRoot = path.join(root, 'source');
  mkdirSync(path.join(sourceRoot, 'src'), { recursive: true });
  const script = 'node -e "require(\'node:fs\').writeFileSync(\'lifecycle-witness\',\'ran\')"';
  const files = [
    ['package.json', JSON.stringify({ name: '@purama/smarana', version: '0.1.0', main: 'src/index.ts' })],
    ['package-lock.json', '{"lockfileVersion":3}'],
    ['src/index.ts', 'export const fixture = true;\n'],
  ].map(([name, content]) => {
    const bytes = Buffer.from(content);
    writeFileSync(path.join(sourceRoot, name), bytes);
    return { path: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
      gitBlob: createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex') };
  });
  const manifest = { schemaVersion: 1, repository: 'puramapro-oss/purama-smarana', commit: 'a'.repeat(40), files };
  const env = { PATH: process.env.PATH, HOME: root, npm_config_cache: path.join(root, 'cache'), npm_config_offline: 'true', npm_config_update_notifier: 'false' };
  const packed = spawnSync('npm', ['pack', '--ignore-scripts', '--offline', '--json', '--pack-destination', root, sourceRoot], { env, cwd: root, encoding: 'utf8', timeout: 30000 });
  assert.equal(packed.status, 0, packed.stderr);
  const bytes = readFileSync(path.join(root, 'purama-smarana-0.1.0.tgz'));
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
  assert.equal(existsSync(path.join(sourceRoot, 'lifecycle-witness')), false);
  return { root, sourceRoot, manifest, integrity, env, script, destination: path.join(root, 'verified.tgz') };
}

const assertClean = root => assert.equal(readdirSync(root).some(name => name.startsWith('.smarana-pack-')), false);

test('verified source packs reproducibly, installs offline from its lock, and delays lifecycle without credentials', t => {
  const f = fixture(t);
  const result = packageVerifiedSmarana({ ...f, env: { ...f.env, SMARANA_READ_SSH_KEY: 'synthetic-secret', GH_TOKEN: 'synthetic-token' },
    run: (program, args, options) => {
      assert.equal(options.env.SMARANA_READ_SSH_KEY, undefined);
      assert.equal(options.env.GH_TOKEN, undefined);
      assert.equal(args.includes('--ignore-scripts'), true);
      assert.equal(args.includes('--offline'), true);
      return spawnSync(program, args, options);
    } });
  assert.equal(result.archiveIntegrity, f.integrity);
  assert.equal(result.verifiedFiles, 3);
  assert.deepEqual(packageVerifiedSmarana(f), result);
  const dependency = 'file:verified.tgz';
  writeFileSync(path.join(f.root, 'package.json'), JSON.stringify({ name: 'fixture-app', version: '0.0.0', dependencies: { '@purama/smarana': dependency }, scripts: { postinstall: f.script } }));
  const lock = { name: 'fixture-app', version: '0.0.0', lockfileVersion: 3, packages: {
    '': { name: 'fixture-app', version: '0.0.0', dependencies: { '@purama/smarana': dependency } },
    'node_modules/@purama/smarana': { version: '0.1.0', resolved: dependency, integrity: f.integrity },
  } };
  const serialized = JSON.stringify(lock);
  writeFileSync(path.join(f.root, 'package-lock.json'), serialized);
  const installed = spawnSync('npm', ['ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: f.root, env: f.env, encoding: 'utf8', timeout: 30000 });
  assert.equal(installed.status, 0, installed.stderr);
  assert.equal(readFileSync(path.join(f.root, 'package-lock.json'), 'utf8'), serialized);
  const packageRoot = path.join(f.root, 'node_modules/@purama/smarana');
  assert.equal(readFileSync(path.join(packageRoot, 'src/index.ts'), 'utf8'), 'export const fixture = true;\n');
  assert.equal(existsSync(path.join(f.root, 'lifecycle-witness')), false);
  const rebuilt = spawnSync('npm', ['rebuild', '--offline', '--no-audit', '--no-fund'], { cwd: f.root, env: f.env, encoding: 'utf8', timeout: 30000 });
  assert.equal(rebuilt.status, 0, rebuilt.stderr);
  assert.equal(readFileSync(path.join(f.root, 'lifecycle-witness'), 'utf8'), 'ran');
  assertClean(f.root);
});

test('changed source cannot start packaging or reach dependency scripts', t => {
  const f = fixture(t);
  writeFileSync(path.join(f.sourceRoot, 'src/index.ts'), 'changed');
  let called = false;
  assert.throws(() => packageVerifiedSmarana({ ...f, run: () => { called = true; } }), /inconsistent|digest mismatch/);
  assert.equal(called, false);
  assert.equal(existsSync(f.destination), false);
  assertClean(f.root);
});

test('wrong archive integrity is rejected and all packaging temporary files are removed', t => {
  const f = fixture(t);
  const integrity = `sha512-${Buffer.alloc(64).toString('base64')}`;
  assert.throws(() => packageVerifiedSmarana({ ...f, integrity }), /integrity mismatch/);
  assert.equal(existsSync(f.destination), false);
  assertClean(f.root);
});

test('an unrelated existing archive is preserved', t => {
  const f = fixture(t);
  writeFileSync(f.destination, 'unrelated');
  assert.throws(() => packageVerifiedSmarana(f), /differs; it was preserved/);
  assert.equal(readFileSync(f.destination, 'utf8'), 'unrelated');
  assertClean(f.root);
});

test('packaging failure is fail closed and removes its owned temporary directory', t => {
  const f = fixture(t);
  assert.throws(() => packageVerifiedSmarana({ ...f, run: () => ({ status: 1 }) }), /archive creation failed/);
  assert.equal(existsSync(f.destination), false);
  assertClean(f.root);
});

function addVerifiedFile(f, name, content) {
  const bytes = Buffer.from(content);
  writeFileSync(path.join(f.sourceRoot, name), bytes);
  f.manifest.files = f.manifest.files.filter(file => file.path !== name);
  f.manifest.files.push({ path: name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    gitBlob: createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex') });
}

test('verified lifecycle declarations are rejected before spawning npm or executing prepare', t => {
  const f = fixture(t);
  for (const name of ['prepare', 'prepack', 'postpack', 'preinstall', 'install', 'postinstall']) {
    const pkg = { name: '@purama/smarana', version: '0.1.0', scripts: { [name]: f.script } };
    addVerifiedFile(f, 'package.json', JSON.stringify(pkg));
    let calls = 0;
    assert.throws(() => packageVerifiedSmarana({ ...f, run: () => { calls++; return { status: 0 }; } }), /lifecycle scripts are not admitted/);
    assert.equal(calls, 0);
    assert.equal(existsSync(path.join(f.sourceRoot, 'lifecycle-witness')), false);
    assert.equal(existsSync(f.destination), false);
  }
  assertClean(f.root);
});

for (const name of ['.npmrc', 'binding.gyp']) {
  test(`verified ${name} is rejected before any npm process`, t => {
    const f = fixture(t);
    addVerifiedFile(f, name, 'synthetic configuration');
    let calls = 0;
    assert.throws(() => packageVerifiedSmarana({ ...f, run: () => { calls++; return { status: 0 }; } }), /configuration is not admitted/);
    assert.equal(calls, 0);
    assert.equal(existsSync(f.destination), false);
    assertClean(f.root);
  });
}
