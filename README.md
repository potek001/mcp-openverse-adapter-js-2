# @mcp/openverse

An MCP (Model Context Protocol) server that provides tools for searching and fetching openly-licensed images from [Openverse](https://openverse.org/).

## Features

- 🔍 Search for CC-licensed and public domain images
- 🎨 Filter by license type, source, file format, and more
- 📊 Get detailed image information including attribution
- 🔗 Find related images
- 📝 Essay-specific image search for content illustration
- ⚡ Built with TypeScript and fastmcp for excellent performance

## Installation

```bash
npm install -g @mcp/openverse
```

Or install from source:

```bash
git clone https://github.com/yourusername/mcp-openverse.git
cd mcp-openverse
npm install
npm run build
npm link
```

## Usage

### As an MCP Server

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

Or if installed locally:

```json
{
  "mcpServers": {
    "openverse": {
      "command": "node",
      "args": ["/path/to/mcp-openverse/dist/index.js"]
    }
  }
}
```

### Available Tools

#### `search_images`
Search for openly-licensed images with various filters.

Parameters:
- `query` (required): Search terms
- `page`: Page number (default: 1)
- `page_size`: Results per page (default: 20, max: 500)
- `license`: License type (`by`, `by-sa`, `by-nc`, `by-nd`, `cc0`, etc.)
- `license_type`: `commercial` or `modification`
- `creator`: Filter by creator name
- `source`: Filter by source (`flickr`, `wikimedia`, `met`, etc.)
- `extension`: File type (`jpg`, `png`, `gif`, `svg`)
- `aspect_ratio`: `tall`, `wide`, or `square`
- `size`: `small`, `medium`, or `large`
- `mature`: Include mature content (default: false)

Example:
```typescript
// Search for nature photos with commercial license
{
  "query": "forest landscape",
  "page_size": 10,
  "license_type": "commercial",
  "extension": "jpg",
  "aspect_ratio": "wide"
}
```

#### `get_image_details`
Get detailed information about a specific image.

Parameters:
- `image_id` (required): Openverse image ID (UUID format)

#### `get_related_images`
Find images related to a specific image.

Parameters:
- `image_id` (required): The image ID to find related images for
- `page`: Page number (default: 1)
- `page_size`: Results per page (default: 10)

#### `get_image_stats`
Get statistics about available images by source.

No parameters required.

#### `search_images_for_essay`
High-level tool for finding images to illustrate essays or articles.

Parameters:
- `essay_topic` (required): Main topic/title of the essay
- `concepts` (required): Array of key concepts to find images for
- `style`: `photo`, `illustration`, or `any` (default: `any`)
- `max_images`: Maximum images to return (default: 10)

Example:
```typescript
{
  "essay_topic": "Climate Change",
  "concepts": ["global warming", "renewable energy", "carbon emissions"],
  "style": "photo",
  "max_images": 15
}
```

## Image Attribution

All images from Openverse come with attribution requirements. The API provides:
- `attribution`: Pre-formatted attribution text
- `license`: License code (e.g., 'by-sa')
- `license_url`: Link to the license
- `creator`: Original creator/photographer
- `creator_url`: Link to creator's profile

Always include proper attribution when using images.

## Rate Limits

The Openverse API has the following rate limits:
- Anonymous: 100 requests/day, 5 requests/hour
- Authenticated: 10,000 requests/day, 100 requests/minute

This MCP server currently uses anonymous access. For higher rate limits, consider implementing OAuth authentication.

## Development

### Building from Source

```bash
npm install
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

### Testing the Server

You can test the server using the MCP inspector:

```bash
npx @modelcontextprotocol/inspector dist/index.js
```

## Examples

### Finding Images for a Blog Post

```typescript
// Using the search_images_for_essay tool
{
  "essay_topic": "Sustainable Architecture",
  "concepts": ["green building", "solar panels", "eco-friendly design"],
  "style": "photo",
  "max_images": 10
}
```

### Searching with Specific Requirements

```typescript
// Using the search_images tool
{
  "query": "mountain landscape sunrise",
  "aspect_ratio": "wide",
  "license_type": "commercial",
  "extension": "jpg",
  "size": "large",
  "page_size": 20
}
```

## Integration with WRITE System

This MCP server is designed to work seamlessly with the WRITE essay development system. When using `claude-write-enhanced.sh`, images will be automatically sourced using this server.

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Follow TypeScript best practices
2. Add tests for new features
3. Update documentation
4. Ensure all tools have proper error handling

## Acknowledgments

- [Openverse](https://openverse.org/) for providing the API and openly-licensed content
- [WordPress](https://github.com/WordPress/openverse) for maintaining the Openverse project
- [fastmcp](https://github.com/punkpeye/fastmcp) for the excellent MCP framework

## Troubleshooting

### Common Issues

1. **Rate limit errors**: You're hitting the anonymous API limits. Wait an hour or implement authentication.
2. **No results**: Try broader search terms or remove filters.
3. **Connection errors**: Check your internet connection and firewall settings.

### Debug Mode

Set the `DEBUG` environment variable:

```bash
DEBUG=mcp:* npx @mcp/openverse
```