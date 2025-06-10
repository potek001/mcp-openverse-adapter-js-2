# Claude Desktop Setup Guide

This guide explains how to integrate the Openverse MCP server with Claude Desktop.

## Prerequisites

- Claude Desktop installed
- Node.js 18+ installed
- npm or yarn installed

## Installation

### Option 1: Install from npm (when published)

```bash
npm install -g @mcp/openverse
```

### Option 2: Install from source

```bash
git clone https://github.com/yourusername/mcp-openverse.git
cd mcp-openverse
npm install
npm run build
npm link
```

## Configuration

1. Open Claude Desktop settings
2. Navigate to Developer → Edit Config
3. Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openverse": {
      "command": "node",
      "args": ["/Users/euge/Documents/GitHub/abstraction/mcp-openverse-ts/dist/index.js"]
    }
  }
}
```

If installed globally via npm:

```json
{
  "mcpServers": {
    "openverse": {
      "command": "npx",
      "args": ["@mcp/openverse"]
    }
  }
}
```

## Verify Installation

1. Restart Claude Desktop
2. In a new conversation, you should see the Openverse tools available
3. Try asking: "Search for nature images with a commercial license"

## Available Commands in Claude

Once configured, you can use these commands:

### Basic Image Search
"Search for images of mountains"
"Find photos of cats with CC0 license"
"Look for wide landscape images"

### Essay Image Search
"Find images to illustrate an essay about climate change"
"Get photos for an article about renewable energy with concepts like solar panels and wind turbines"

### Detailed Searches
"Search for SVG illustrations from Wikimedia"
"Find large, square photos with commercial licenses"
"Get images by creator John Doe"

## Troubleshooting

### Server not appearing in Claude
1. Check that the path in config.json is correct
2. Ensure the server is built (`npm run build`)
3. Restart Claude Desktop

### Connection errors
1. Check Node.js version (18+)
2. Verify the server runs standalone: `node dist/index.js`
3. Check Claude Desktop logs

### No results
1. Try broader search terms
2. Remove restrictive filters
3. Check rate limits (100 requests/day for anonymous access)

## Example Usage

```
User: Find images for a blog post about sustainable architecture

Claude: I'll search for images related to sustainable architecture using the Openverse MCP server.

[Uses search_images_for_essay tool with:
- essay_topic: "Sustainable Architecture"
- concepts: ["green building", "solar panels", "eco-friendly design"]
- style: "photo"
- max_images: 10]

I found 10 relevant images for your blog post:

Featured Images:
1. "Modern Green Building with Solar Panels" - CC BY-SA
2. "Eco-Friendly Architecture Design" - CC BY
3. "Sustainable Housing Complex" - CC0

Images by Concept:
- Green Building: 3 images showing LEED-certified structures
- Solar Panels: 2 images of buildings with integrated solar
- Eco-Friendly Design: 2 images of natural building materials

All images come with proper attribution and are freely usable under their respective Creative Commons licenses.
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/mcp-openverse/issues
- MCP Documentation: https://github.com/anthropics/mcp