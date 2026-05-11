#!/usr/bin/env node
/**
 * url MCP server. Two tools: `parse` and `build`.
 *
 * Parse breaks a URL into protocol, host, port, path, query (as a map),
 * and fragment. Build does the reverse — assemble a URL from parts.
 * Backed by Node's WHATWG URL implementation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';

export interface ParsedUrl {
  href: string;
  protocol: string;
  username: string;
  password: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  query: Record<string, string | string[]>;
}

export function parseUrl(input: string): ParsedUrl {
  const u = new URL(input);
  const q: Record<string, string | string[]> = {};
  for (const [k, v] of u.searchParams.entries()) {
    const prev = q[k];
    if (prev === undefined) q[k] = v;
    else if (Array.isArray(prev)) prev.push(v);
    else q[k] = [prev, v];
  }
  return {
    href: u.href,
    protocol: u.protocol.replace(/:$/, ''),
    username: u.username,
    password: u.password,
    host: u.host,
    hostname: u.hostname,
    port: u.port,
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
    query: q,
  };
}

export interface BuildInput {
  protocol: string;
  hostname: string;
  port?: string | number;
  pathname?: string;
  query?: Record<string, string | string[] | number | boolean>;
  hash?: string;
  username?: string;
  password?: string;
}

export function buildUrl(p: BuildInput): string {
  const proto = p.protocol.endsWith(':') ? p.protocol : `${p.protocol}:`;
  const u = new URL(`${proto}//${p.hostname}`);
  if (p.port !== undefined && p.port !== '') u.port = String(p.port);
  if (p.pathname) u.pathname = p.pathname;
  if (p.username) u.username = p.username;
  if (p.password) u.password = p.password;
  if (p.query) {
    for (const [k, v] of Object.entries(p.query)) {
      if (Array.isArray(v)) for (const vv of v) u.searchParams.append(k, String(vv));
      else u.searchParams.append(k, String(v));
    }
  }
  if (p.hash) u.hash = p.hash.startsWith('#') ? p.hash : '#' + p.hash;
  return u.toString();
}

const server = new Server({ name: 'url', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'parse',
    description:
      'Parse a URL string into protocol, host, port, path, query map, fragment, and credentials.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'URL to parse.' } },
      required: ['url'],
    },
  },
  {
    name: 'build',
    description:
      'Build a URL string from protocol, hostname, optional port/path/query/hash/credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        protocol: { type: 'string' },
        hostname: { type: 'string' },
        port: { type: ['string', 'integer'] },
        pathname: { type: 'string' },
        query: { type: 'object', description: 'Map of key to string/number/bool or array of those.' },
        hash: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['protocol', 'hostname'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name === 'parse') {
      const a = args as unknown as { url: string };
      return jsonResult(parseUrl(a.url));
    }
    if (name === 'build') {
      const a = args as unknown as BuildInput;
      return jsonResult({ url: buildUrl(a) });
    }
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('url tool failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

// Only start the stdio server when run as a script — not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`url MCP server v${VERSION} ready on stdio\n`);
}
