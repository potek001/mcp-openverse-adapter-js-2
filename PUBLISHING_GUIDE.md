# Publishing Guide for Openverse MCP Server

## Option 1: NPM Registry (Recommended)

### Prerequisites
1. Create an npm account at https://www.npmjs.com/signup
2. Login to npm: `npm login`

### Steps to Publish

1. **Update package.json**
```json
{
  "name": "@yourusername/mcp-openverse",  // Or just "mcp-openverse" if available
  "version": "0.1.0",
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/mcp-openverse"
  },
  "keywords": [
    "mcp",
    "openverse",
    "images",
    "creative-commons",
    "public-domain",
    "claude",
    "anthropic"
  ]
}
```

2. **Test locally first**
```bash
npm link  # Creates global link
npm link @yourusername/mcp-openverse  # Test the link
```

3. **Publish to npm**
```bash
npm publish --access public  # For scoped packages (@username/...)
# or
npm publish  # For unscoped packages
```

### After Publishing
Users can install with:
```bash
npm install -g @yourusername/mcp-openverse
# or
npx @yourusername/mcp-openverse
```

## Option 2: GitHub Package Registry

1. **Update package.json**
```json
{
  "name": "@yourusername/mcp-openverse",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

2. **Create GitHub token** with `write:packages` permission

3. **Configure npm for GitHub**
```bash
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
```

4. **Publish**
```bash
npm publish
```

## Option 3: MCP Registry (Future)

The MCP team is working on an official registry. For now:

1. **Submit to MCP Servers List**
   - Fork https://github.com/anthropics/mcp-servers
   - Add your server to the list
   - Submit a pull request

2. **Follow MCP Guidelines**
   - Clear README with examples
   - Proper error handling
   - Well-documented tools
   - Include CLAUDE_DESKTOP_SETUP.md

## Option 4: Direct GitHub Installation

No publishing needed! Users can install directly:

1. **Make your repo public**

2. **Users install with:**
```bash
git clone https://github.com/yourusername/mcp-openverse
cd mcp-openverse
npm install
npm run build
npm link
```

3. **Or via npm from GitHub:**
```bash
npm install -g github:yourusername/mcp-openverse
```

## Pre-Publishing Checklist

- [ ] Update version in package.json
- [ ] Update author information
- [ ] Update repository URL
- [ ] Test all tools work correctly
- [ ] Update README with real examples
- [ ] Add LICENSE file (if not MIT)
- [ ] Remove test files (test-*.js, *.sh)
- [ ] Update .gitignore if needed
- [ ] Create GitHub repository
- [ ] Tag release version

## Versioning

Follow semantic versioning:
- `0.1.0` → `0.1.1` for bug fixes
- `0.1.0` → `0.2.0` for new features
- `0.1.0` → `1.0.0` for breaking changes

## Marketing Your MCP Server

1. **Create demo video/GIF** showing it in action
2. **Write blog post** about the development
3. **Share on social media** with #MCP #Claude
4. **Submit to newsletters** (Console, TLDR, etc.)
5. **Add to awesome-mcp** list (if it exists)

## Example npm publish flow

```bash
# 1. Clean and rebuild
npm run clean
npm run build

# 2. Test it works
npm link
npx @yourusername/mcp-openverse  # Should start server

# 3. Update version
npm version patch  # or minor/major

# 4. Publish
npm publish --access public

# 5. Create GitHub release
git push --tags
# Create release on GitHub with changelog
```

## Claude Desktop Config After Publishing

Users will add to their config:
```json
{
  "mcpServers": {
    "openverse": {
      "command": "npx",
      "args": ["@yourusername/mcp-openverse"]
    }
  }
}
```

Much cleaner than using file paths!