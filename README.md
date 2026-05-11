# url-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/url-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/url-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

MCP server: parse and build URLs. Two tools — `parse` and `build`. Backed by
Node's WHATWG `URL`, so percent-encoding and IDN are handled correctly.

## Tools

### `parse`

```json
{ "url": "https://example.com:8080/a/b?x=1&y=two#frag" }
```

→

```json
{
  "protocol": "https", "hostname": "example.com", "port": "8080",
  "pathname": "/a/b", "query": { "x": "1", "y": "two" }, "hash": "#frag"
}
```

Repeated query keys collect into arrays: `?tag=a&tag=b` → `{ "tag": ["a","b"] }`.

### `build`

```json
{
  "protocol": "https",
  "hostname": "api.example.com",
  "pathname": "/v1/things",
  "query": { "id": 42, "q": "hello world" }
}
```

→ `"https://api.example.com/v1/things?id=42&q=hello+world"`

## Configure

```json
{ "mcpServers": { "url": { "command": "npx", "args": ["-y", "@mukundakatta/url-mcp"] } } }
```

## License

MIT.
