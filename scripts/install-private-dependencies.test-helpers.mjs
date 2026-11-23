import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function effectiveSshSettings(env) {
  // -G only evaluates local SSH configuration. No connection or key generation.
  const result = spawnSync('/bin/sh', ['-c', `${env.GIT_SSH_COMMAND} -G git@github.com`], { env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return new Map(result.stdout.trim().split('\n').map(line => {
    const split = line.indexOf(' ');
    return [line.slice(0, split), line.slice(split + 1)];
  }));
}

export async function sharedSourceFixture(t, { symbolicLink = false, extraFile = false, smarana = false } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'midas-shared-git-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const repository = path.join(root, 'origin');
  await mkdir(repository);
  const env = { PATH: process.env.PATH, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
  const git = args => {
    const result = spawnSync('git', args, { cwd: repository, env, encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(['init', '-q']);
  git(['config', 'uploadpack.allowFilter', 'true']);
  git(['config', 'uploadpack.allowAnySHA1InWant', 'true']);
  const files = [];
  for (const name of ['eslint-config-purama']) {
    await mkdir(path.join(repository, 'packages', name), { recursive: true });
    for (let index = 0; index < 6; index++) {
      const relative = `packages/${name}/${index === 0 ? 'package.json' : `fixture-${index}.txt`}`;
      const bytes = Buffer.from(index === 0 ? JSON.stringify({ name, private: true }) : `synthetic ${name} ${index}\n`);
      writeFileSync(path.join(repository, relative), bytes);
      files.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
  }
  if (smarana) {
    await rm(path.join(repository, 'packages'), { recursive: true });
    files.length = 0;
    await mkdir(path.join(repository, 'src'));
    for (const relative of ['package.json', 'package-lock.json', 'src/index.ts']) {
      const bytes = Buffer.from(relative.endsWith('.json') ? '{"syntheticFixture":true}' : 'export const syntheticFixture = true;\n');
      writeFileSync(path.join(repository, relative), bytes);
      files.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
        gitBlob: createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex') });
    }
  }
  if (symbolicLink) {
    const target = path.join(repository, files[1].path);
    await rm(target);
    await symlink('/unrelated/source', target);
  }
  if (extraFile) writeFileSync(path.join(repository, smarana ? 'unlisted.txt' : 'packages/eslint-config-purama/unlisted.txt'), 'synthetic unlisted content');
  git(['add', smarana ? '.' : 'packages']);
  // The pinned private repository has this structural defect at its root.
  // This fixture contains no private source and never initializes a submodule.
  if (!smarana) git(['update-index', '--add', '--cacheinfo', `160000,${'a'.repeat(40)},adya`]);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Synthetic shared source']);
  const fullName = smarana ? 'puramapro-oss/purama-smarana' : 'puramapro-oss/purama-master';
  const manifest = { schemaVersion: 1, repository: fullName, commit: git(['rev-parse', 'HEAD']), files };
  const observed = { commands: [], identities: new Set() };
  const run = (command, args, options) => {
    assert.equal(command, 'git');
    assert.equal(options.shell, false);
    assert.equal(options.env.PURAMA_PACKAGES_READ_SSH_KEY, undefined);
    assert.equal(options.env.SMARANA_READ_SSH_KEY, undefined);
    observed.commands.push(args);
    observed.identities.add(path.dirname(effectiveSshSettings(options.env).get('identityfile')));
    // Exercise real Git fetching, partial-clone blob reads and tree parsing,
    // replacing only network transport with this local upload-pack fixture.
    const localEnv = { ...options.env, GIT_ALLOW_PROTOCOL: 'file', GIT_CONFIG_COUNT: '2',
      GIT_CONFIG_KEY_1: `url.${pathToFileURL(repository).href}.insteadOf`,
      GIT_CONFIG_VALUE_1: `ssh://git@github.com/${fullName}.git` };
    return spawnSync(command, args, { ...options, env: localEnv });
  };
  return { root, repository, env, manifest, run, observed, sourceRoot: path.join(root, 'source') };
}

export function assertSharedCleanup(fixture) {
  for (const directory of fixture.observed.identities) assert.equal(existsSync(directory), false);
  assert.equal(readdirSync(fixture.root).some(name => name.startsWith('.midas-source-')), false);
}
