# GitHub Actions Workflows

## CI Workflow (`ci.yml`)

Runs on every push and pull request to `main`:

- Tests across multiple OS (Ubuntu, Windows, macOS)
- Tests Node.js versions 18.x and 20.x
- Runs linter and format checks
- Runs test suite
- Tests CLI commands

## Publish Workflow (`publish.yml`)

Publishes to NPM in two ways:

### 1. Manual Release (Recommended)

Go to Actions → Publish to NPM → Run workflow

- Choose version bump type: `patch`, `minor`, or `major`
- Automatically bumps version, creates git tag, publishes to NPM, and creates GitHub release

### 2. Automatic Release

Triggers on push to `main` when source files change:

- Automatically bumps patch version
- Publishes to NPM

## Setup Required

Before using the publish workflow, you need to:

1. **Create NPM Access Token**

   ```bash
   # Login to npmjs.com and create an automation token
   # Go to: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   # Create a new "Automation" token
   ```

2. **Add NPM_TOKEN to GitHub Secrets**
   - Go to: Repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM automation token
   - Click "Add secret"

3. **Configure Repository Permissions**
   - Go to: Repository Settings → Actions → General
   - Under "Workflow permissions", ensure:
     - "Read and write permissions" is selected
     - "Allow GitHub Actions to create and approve pull requests" is checked

## Usage

### For Manual Releases

1. Make your changes and push to `main`
2. Go to Actions tab
3. Select "Publish to NPM" workflow
4. Click "Run workflow"
5. Select version bump type
6. Click "Run workflow"

### For Automatic Releases

Just push to `main` - the workflow will automatically:

- Bump the patch version
- Publish to NPM
- Create a git tag and GitHub release

## Preventing Automatic Publishes

To prevent automatic publishing when pushing to main:

1. Add `[skip ci]` to your commit message, OR
2. Remove the `push` trigger from `publish.yml`, OR
3. Only use manual workflow dispatch
