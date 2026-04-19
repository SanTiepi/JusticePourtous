import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Runs an inline ESM script with a clean env and returns { stdout, stderr }.
function runWithEnv(env, script) {
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8'
  });
  return { stdout: res.stdout, stderr: res.stderr, status: res.status };
}

const IMPORT = `import { createLogger, getLoggerConfig } from './src/services/logger.mjs';`;

describe('logger — API surface', () => {
  it('createLogger returns object with debug/info/warn/error/child', async () => {
    const { createLogger } = await import('../src/services/logger.mjs');
    const log = createLogger('test');
    for (const k of ['debug', 'info', 'warn', 'error', 'child']) {
      assert.equal(typeof log[k], 'function', `missing ${k}`);
    }
  });

  it('child("sub") returns logger whose events are tagged parent.sub', () => {
    const { stdout } = runWithEnv(
      { NODE_ENV: 'development', LOG_LEVEL: 'debug', LOG_FORMAT: 'json' },
      `${IMPORT} createLogger('parent').child('sub').info('hello', {});`
    );
    const line = JSON.parse(stdout.trim().split('\n').pop());
    assert.equal(line.module, 'parent.sub');
    assert.equal(line.event, 'hello');
  });

  it('getLoggerConfig returns {level, format, env}', async () => {
    const { getLoggerConfig } = await import('../src/services/logger.mjs');
    const cfg = getLoggerConfig();
    assert.ok('level' in cfg && 'format' in cfg && 'env' in cfg);
  });
});

describe('logger — level filtering', () => {
  it('LOG_LEVEL=silent suppresses all output', () => {
    const { stdout, stderr } = runWithEnv(
      { NODE_ENV: 'development', LOG_LEVEL: 'silent', LOG_FORMAT: 'json' },
      `${IMPORT} const l = createLogger('t');
       l.debug('d'); l.info('i'); l.warn('w'); l.error('e');`
    );
    assert.equal(stdout, '');
    assert.equal(stderr, '');
  });

  it('LOG_LEVEL=debug emits all four levels', () => {
    const { stdout, stderr } = runWithEnv(
      { NODE_ENV: 'development', LOG_LEVEL: 'debug', LOG_FORMAT: 'json' },
      `${IMPORT} const l = createLogger('t');
       l.debug('d'); l.info('i'); l.warn('w'); l.error('e');`
    );
    const events = [...stdout.trim().split('\n'), ...stderr.trim().split('\n')]
      .filter(Boolean).map(s => JSON.parse(s).event);
    assert.deepEqual(events.sort(), ['d', 'e', 'i', 'w']);
  });

  it('NODE_ENV=test defaults to silent (no LOG_LEVEL override)', () => {
    const { stdout, stderr } = runWithEnv(
      { NODE_ENV: 'test', LOG_LEVEL: '', LOG_FORMAT: '' },
      `${IMPORT} createLogger('t').info('should_not_appear');`
    );
    assert.equal(stdout, '');
    assert.equal(stderr, '');
  });
});

describe('logger — formats and serialization', () => {
  it('JSON format produces parseable lines with ts/level/module/event/context', () => {
    const { stdout } = runWithEnv(
      { NODE_ENV: 'development', LOG_LEVEL: 'debug', LOG_FORMAT: 'json' },
      `${IMPORT} createLogger('mod').info('evt', { foo: 'bar' });`
    );
    const line = JSON.parse(stdout.trim());
    assert.ok(line.ts && line.ts.includes('T'));
    assert.equal(line.level, 'info');
    assert.equal(line.module, 'mod');
    assert.equal(line.event, 'evt');
    assert.equal(line.foo, 'bar');
  });

  it('pretty format is non-JSON human-readable', () => {
    const { stdout } = runWithEnv(
      { NODE_ENV: 'development', LOG_LEVEL: 'debug', LOG_FORMAT: 'pretty' },
      `${IMPORT} createLogger('mod').info('evt');`
    );
    assert.throws(() => JSON.parse(stdout.trim()));
    assert.match(stdout, /INFO/);
    assert.match(stdout, /mod:evt/);
  });

  it('Error objects in context serialize with message/stack/name', () => {
    const { stderr } = runWithEnv(
      { NODE_ENV: 'development', LOG_LEVEL: 'debug', LOG_FORMAT: 'json' },
      `${IMPORT} createLogger('t').error('boom', { err: new Error('kaboom') });`
    );
    const line = JSON.parse(stderr.trim());
    assert.equal(line.err.message, 'kaboom');
    assert.equal(line.err.name, 'Error');
    assert.ok(line.err.stack);
  });

  it('circular references do not crash (safeStringify)', () => {
    const { stdout, status } = runWithEnv(
      { NODE_ENV: 'development', LOG_LEVEL: 'debug', LOG_FORMAT: 'json' },
      `${IMPORT} const o = {}; o.self = o;
       createLogger('t').info('cyc', { o });
       console.error('DONE');`
    );
    assert.equal(status, 0);
    assert.match(stdout, /\[Circular\]|"self"/);
  });
});
