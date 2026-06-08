import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { parseUrl, buildUrl } from '../src/server.js';

test('parses a full URL', () => {
  const r = parseUrl('https://user:pw@example.com:8080/a/b?x=1&y=two#frag');
  assert.equal(r.protocol, 'https');
  assert.equal(r.username, 'user');
  assert.equal(r.password, 'pw');
  assert.equal(r.hostname, 'example.com');
  assert.equal(r.port, '8080');
  assert.equal(r.pathname, '/a/b');
  assert.deepEqual(r.query, { x: '1', y: 'two' });
  assert.equal(r.hash, '#frag');
});

test('collects repeated query keys as arrays', () => {
  const r = parseUrl('https://x.com/?tag=a&tag=b&tag=c');
  assert.deepEqual(r.query, { tag: ['a', 'b', 'c'] });
});

test('builds a URL with query', () => {
  const u = buildUrl({
    protocol: 'https',
    hostname: 'api.example.com',
    pathname: '/v1/things',
    query: { id: 42, q: 'hello world' },
  });
  assert.match(u, /^https:\/\/api\.example\.com\/v1\/things\?/);
  assert.match(u, /id=42/);
  assert.match(u, /q=hello\+world|q=hello%20world/);
});

test('build accepts array query values', () => {
  const u = buildUrl({
    protocol: 'https',
    hostname: 'x.com',
    query: { tag: ['a', 'b'] },
  });
  assert.match(u, /tag=a/);
  assert.match(u, /tag=b/);
});

test('rejects malformed input', () => {
  assert.throws(() => parseUrl('not a url'));
});

test('round-trip parse → build is stable', () => {
  const orig = 'https://example.com:8443/path?a=1';
  const p = parseUrl(orig);
  const built = buildUrl({
    protocol: p.protocol,
    hostname: p.hostname,
    port: p.port,
    pathname: p.pathname,
    query: p.query as Record<string, string>,
  });
  assert.equal(built, orig);
});

test('build embeds credentials, hash, and normalizes the fragment', () => {
  const u = buildUrl({
    protocol: 'https',
    hostname: 'x.com',
    pathname: '/a',
    username: 'u',
    password: 'p',
    hash: 'frag',
  });
  assert.equal(u, 'https://u:p@x.com/a#frag');
  // A leading '#' is accepted and not doubled.
  assert.equal(buildUrl({ protocol: 'https', hostname: 'x.com', hash: '#frag' }), 'https://x.com/#frag');
});

test('round-trip with credentials, query, and fragment is stable', () => {
  const orig = 'https://u:p@x.com/a?b=1#c';
  const p = parseUrl(orig);
  const built = buildUrl({
    protocol: p.protocol,
    hostname: p.hostname,
    username: p.username,
    password: p.password,
    pathname: p.pathname,
    query: p.query as Record<string, string>,
    hash: p.hash,
  });
  assert.equal(built, orig);
});
