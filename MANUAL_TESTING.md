# Manual MCP Server Testing Guide

This guide shows how to manually interact with the MCP server for testing and debugging.

## Prerequisites

- Built MCP server (`npm run build`)
- Node.js 18+

## Method 1: Using MCP Inspector (Recommended)

The MCP Inspector provides a web UI for testing:

```bash
# Install and run the inspector
npx @modelcontextprotocol/inspector dist/index.js

# This will start:
# - Proxy server on port 6277
# - Web UI at http://127.0.0.1:6274
```

Then open http://127.0.0.1:6274 in your browser to:
- View available tools
- Test tool calls with a form interface
- See request/response JSON
- Debug issues

## Method 2: Direct stdio Communication

MCP servers communicate via JSON-RPC over stdio. You can test manually:

### 1. Start the server

```bash
node dist/index.js
```

### 2. Send JSON-RPC messages

The server expects newline-delimited JSON. Send these messages to stdin:

#### Initialize Connection

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0.0","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}
```

#### List Available Tools

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

#### Call a Tool

Search for images:
```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_images","arguments":{"query":"nature","page_size":5}}}
```

Get image details:
```json
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_image_details","arguments":{"image_id":"24c22c7e-7329-4e96-aee9-87caf9c3e4f4"}}}
```

Search for essay images:
```json
{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"search_images_for_essay","arguments":{"essay_topic":"Climate Change","concepts":["renewable energy","solar panels"],"max_images":10}}}
```

## Method 3: Using a Test Script

Create a test script `manual-test.js`:

```javascript
import { spawn } from 'child_process';
import readline from 'readline';

const server = spawn('node', ['dist/index.js']);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Forward server output
server.stdout.on('data', (data) => {
  console.log('Server:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

// Send initialize
const init = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '1.0.0',
    capabilities: {},
    clientInfo: { name: 'manual-test', version: '1.0.0' }
  }
};

server.stdin.write(JSON.stringify(init) + '\n');

// Interactive prompt
console.log('MCP Test Client Ready. Type JSON-RPC requests:');
console.log('Example: {"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}');
console.log('Type "exit" to quit\n');

rl.on('line', (input) => {
  if (input.toLowerCase() === 'exit') {
    server.kill();
    process.exit(0);
  }
  
  try {
    // Validate JSON
    JSON.parse(input);
    server.stdin.write(input + '\n');
  } catch (err) {
    console.error('Invalid JSON:', err.message);
  }
});

server.on('close', () => {
  console.log('Server closed');
  process.exit(0);
});
```

Run with: `node manual-test.js`

## Method 4: Using curl with a Proxy

Some MCP tools provide HTTP proxy modes. For our server, you'd need to:

1. Create a simple HTTP-to-stdio proxy
2. Send requests via curl

Example proxy (save as `http-proxy.js`):

```javascript
import { spawn } from 'child_process';
import express from 'express';

const app = express();
app.use(express.json());

let server;
let requestId = 1;
const pendingRequests = new Map();

// Start MCP server
function startServer() {
  server = spawn('node', ['dist/index.js']);
  
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.id && pendingRequests.has(response.id)) {
          pendingRequests.get(response.id)(response);
          pendingRequests.delete(response.id);
        }
      } catch (err) {
        // Ignore non-JSON output
      }
    }
  });
  
  // Initialize
  const init = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'initialize',
    params: {
      protocolVersion: '1.0.0',
      capabilities: {},
      clientInfo: { name: 'http-proxy', version: '1.0.0' }
    }
  };
  
  server.stdin.write(JSON.stringify(init) + '\n');
}

// Proxy endpoint
app.post('/mcp', (req, res) => {
  const { method, params } = req.body;
  const id = requestId++;
  
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
  
  pendingRequests.set(id, (response) => {
    res.json(response);
  });
  
  server.stdin.write(JSON.stringify(request) + '\n');
  
  // Timeout after 30 seconds
  setTimeout(() => {
    if (pendingRequests.has(id)) {
      pendingRequests.delete(id);
      res.status(504).json({ error: 'Request timeout' });
    }
  }, 30000);
});

startServer();
app.listen(3000, () => {
  console.log('HTTP proxy running on http://localhost:3000');
});
```

Then use curl:

```bash
# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list","params":{}}'

# Search images
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"search_images","arguments":{"query":"sunset","page_size":3}}}'
```

## Common Test Scenarios

### 1. Test Basic Search
```json
{"jsonrpc":"2.0","id":100,"method":"tools/call","params":{"name":"search_images","arguments":{"query":"ocean"}}}
```

### 2. Test with Filters
```json
{"jsonrpc":"2.0","id":101,"method":"tools/call","params":{"name":"search_images","arguments":{"query":"mountain","license":"cc0","extension":"jpg","aspect_ratio":"wide"}}}
```

### 3. Test Essay Search
```json
{"jsonrpc":"2.0","id":102,"method":"tools/call","params":{"name":"search_images_for_essay","arguments":{"essay_topic":"Artificial Intelligence","concepts":["neural networks","machine learning","robots"],"style":"illustration"}}}
```

### 4. Test Error Handling
```json
{"jsonrpc":"2.0","id":103,"method":"tools/call","params":{"name":"get_image_details","arguments":{"image_id":"invalid-uuid"}}}
```

## Debugging Tips

1. **Enable Debug Output**
   ```bash
   DEBUG=* node dist/index.js
   ```

2. **Log All Messages**
   Add logging to your server:
   ```typescript
   server.on('message', (msg) => {
     console.error('Received:', JSON.stringify(msg));
   });
   ```

3. **Test Individual Tools**
   Test each tool separately before integration

4. **Check Rate Limits**
   Openverse has rate limits (100/day anonymous)

## Expected Responses

### Successful Search
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"result_count\": 10000,\n  \"results\": [...]\n}"
      }
    ]
  }
}
```

### Error Response
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": "Missing required parameter: query"
  }
}
```

## Troubleshooting

- **No response**: Check if server initialized properly
- **JSON parse errors**: Ensure newline-delimited JSON
- **Tool not found**: Verify tool name matches exactly
- **API errors**: Check Openverse API status and rate limits