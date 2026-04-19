import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEnvSpecs } from '../src/services/env-check.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Run a short inline module with a custom env. Strip parent env vars matching
// an ENV_SPECS name so the child starts from a known-clean slate.
function runNode(env, script) {
  const REQUIRED_KEYS = [
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PUBLISHABLE_KEY',
    'ANTHROPIC_API_KEY', 'ADMIN_TOKEN', 'CITIZEN_EMAIL_SALT',
    'CITIZEN_EMAIL_ENC_KEY', 'RESEND_API_KEY', 'FROM_EMAIL',
    'PORT', 'SITE_URL'
  ];
  const cleanEnv = { ...process.env };
  for (const k of REQUIRED_KEYS) delete cleanEnv[k];
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: ROOT,
    env: { ...cleanEnv, LOG_LEVEL: 'silent', ...env },
    encoding: 'utf8'
  });
  return { stdout: res.stdout, stderr: res.stderr, status: res.status };
}

const IMPORT = `import { validateEnv } from './src/services/env-check.mjs';`;

describe('env-check — getEnvSpecs', () => {
  it('returns array with name/category/required_in_prod/hint/present', () => {
    const specs = getEnvSpecs();
    assert.ok(Array.isArray(specs) && specs.length > 0);
    for (const s of specs) {
      assert.ok(typeof s.name === 'string');
      assert.ok(typeof s.category === 'string');
      assert.ok(typeof s.required_in_prod === 'boolean');
      assert.ok(typeof s.hint === 'string');
      assert.ok(typeof s.present === 'boolean');
    }
  });
});

describe('env-check — non-production', () => {
  it('does not throw even when all required missing', () => {
    const { stdout, status } = runNode(
      { NODE_ENV: 'development' },
      `${IMPORT} const r = validateEnv();
       process.stdout.write(JSON.stringify({ ok: true, env: r.env, missing: r.missing_required.length, recommended: r.missing_recommended.length }));`
    );
    assert.equal(status, 0);
    const r = JSON.parse(stdout);
    assert.equal(r.ok, true);
    assert.equal(r.env, 'development');
    assert.ok(r.recommended > 0, 'some required_in_prod vars should be missing_recommended in dev');
  });

  it('returns report with env/set/missing_required/missing_recommended arrays', () => {
    const { stdout } = runNode(
      { NODE_ENV: 'development', PORT: '3000' },
      `${IMPORT} const r = validateEnv();
       process.stdout.write(JSON.stringify({
         env: r.env,
         set_is_array: Array.isArray(r.set),
         missing_required_is_array: Array.isArray(r.missing_required),
         missing_recommended_is_array: Array.isArray(r.missing_recommended),
         port_present: r.set.some(s => s.name === 'PORT')
       }));`
    );
    const r = JSON.parse(stdout);
    assert.equal(r.env, 'development');
    assert.equal(r.set_is_array, true);
    assert.equal(r.missing_required_is_array, true);
    assert.equal(r.missing_recommended_is_array, true);
    assert.equal(r.port_present, true);
  });
});

describe('env-check — production', () => {
  it('throws when any required_in_prod env var missing', () => {
    const { status, stderr } = runNode(
      { NODE_ENV: 'production' },
      `${IMPORT} try { validateEnv(); process.exit(0); } catch (e) {
         process.stderr.write('THROWN:' + e.message); process.exit(2);
       }`
    );
    assert.equal(status, 2, 'process should have exited non-zero after throw');
    assert.match(stderr, /THROWN:/);
    assert.match(stderr, /required env var/);
  });

  it('thrown error lists all missing names', () => {
    const { stderr } = runNode(
      { NODE_ENV: 'production' },
      `${IMPORT} try { validateEnv(); } catch (e) { process.stderr.write('THROWN:' + e.message); process.exit(2); }`
    );
    for (const name of ['STRIPE_SECRET_KEY', 'ANTHROPIC_API_KEY', 'ADMIN_TOKEN', 'RESEND_API_KEY']) {
      assert.match(stderr, new RegExp(name), `should mention ${name}`);
    }
  });

  it('does not throw when all required prod vars present', () => {
    const { status, stdout } = runNode(
      {
        NODE_ENV: 'production',
        STRIPE_SECRET_KEY: 'sk_test_x',
        STRIPE_WEBHOOK_SECRET: 'whsec_x',
        ANTHROPIC_API_KEY: 'sk-ant-x',
        ADMIN_TOKEN: 'tok',
        CITIZEN_EMAIL_SALT: 'salt',
        RESEND_API_KEY: 're_x'
      },
      `${IMPORT} const r = validateEnv();
       process.stdout.write(JSON.stringify({ missing: r.missing_required.length }));`
    );
    assert.equal(status, 0);
    assert.equal(JSON.parse(stdout).missing, 0);
  });
});
