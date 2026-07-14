# 🚀 MAX-AII Auto-Release System

## Overview

MAX-AII includes a complete automated build, test, and release system powered by GitHub Actions.

## How It Works

### 1. **Automatic Build on Push**
Every push to `main` triggers:
- ✅ Code linting
- ✅ Type checking
- ✅ Multi-platform build (Windows/macOS/Linux)
- ✅ Bundle size analysis

### 2. **Version Management**
```bash
npm run release
```

Select from:
- **Patch** (1.0.0 → 1.0.1) - Bug fixes
- **Minor** (1.0.0 → 1.1.0) - New features
- **Major** (1.0.0 → 2.0.0) - Breaking changes
- **Build Only** - No version bump

### 3. **Automatic Release**
When you push a git tag (`v2.0.0`):
1. CI builds executables
2. Creates GitHub release
3. Uploads all artifacts
4. Generates release notes

### 4. **Bundle Size Monitoring**
- Weekly automatic size checks
- Reports on bundle optimization
- Alerts on size regressions

## Workflows

### `.github/workflows/build-release.yml`
**Triggers**: Push to main, Git tags, Manual dispatch

**Jobs**:
- 📋 Code validation (lint + type check)
- 🖥️ Windows build (NSIS installer)
- 🍎 macOS build (DMG + code signing)
- 🐧 Linux build (AppImage + deb)
- 📦 GitHub Release (auto-draft)

**Output**:
- Windows: `Max-AII-*.exe` + portable
- macOS: `Max-AII-*.dmg`
- Linux: AppImage + deb packages

### `.github/workflows/size-monitor.yml`
**Triggers**: Every push, Weekly schedule

**Monitors**:
- `dist/` folder size
- `node_modules` size
- JavaScript bundle sizes
- CSS bundle sizes

**Reports**:
- Size trends
- Optimization recommendations
- Weekly summaries

### `.github/workflows/profile-update.yml` (Coming)
**Triggers**: Weekly, Manual dispatch

**Updates**:
- GitHub profile README
- Project badges
- Release stats

## File Size Targets

| Component | Target | Status |
|-----------|--------|--------|
| Windows Installer | < 150MB | ✅ |
| macOS DMG | < 180MB | ✅ |
| Linux AppImage | < 160MB | ✅ |
| Vite Build (dist/) | < 50MB | ✅ |
| Main Bundle | < 500KB | ✅ |

## Release Process

### Step 1: Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

### Step 2: Trigger Build (Auto)
- GitHub Actions automatically builds
- Check Actions tab for status
- Download artifacts if needed

### Step 3: Bump Version
```bash
npm run release
```

Select version bump type and confirm.

### Step 4: Push Tag
```bash
git push origin --tags
```

### Step 5: Release (Auto)
- Actions creates GitHub release
- Uploads all platform binaries
- Generates release notes
- Publishes to releases page

## Manual Release

### Workflow Dispatch
1. Go to Actions tab
2. Select "Auto Build & Release MAX-AII"
3. Click "Run workflow"
4. Enter version (e.g., `2.0.0`)
5. Add release notes (optional)
6. Click "Run workflow"

## Environment Variables

### Secrets Required
- `GITHUB_TOKEN` - Auto-set by GitHub (read:packages, write:packages)

### Optional
- `DISCORD_WEBHOOK` - For Discord notifications
- `SLACK_WEBHOOK` - For Slack notifications

## Optimization

### Size Management
```bash
# Check current size
npm run build
du -sh dist/

# Analyze dependencies
npm ls --depth=0

# Clean build
npm run clean && npm run build
```

### Performance Tips
1. **Lazy Load Components**: Use React.lazy()
2. **Code Splitting**: Import only what you need
3. **Asset Optimization**: Compress images
4. **Tree Shaking**: Remove unused code
5. **Minification**: Enabled by default in production

## Troubleshooting

### Build Fails
1. Check Actions logs
2. Run `npm run validate` locally
3. Verify Node.js version (18+)
4. Clear npm cache: `npm cache clean --force`

### Release Not Created
1. Verify git tag format: `v2.0.0`
2. Check GITHUB_TOKEN permissions
3. Ensure tag is pushed: `git push origin --tags`

### Large Build Size
1. Run `npm ls` to check dependencies
2. Look for duplicate packages
3. Remove unused dependencies
4. Check bundle analyzer: `npm run analyze`

## Next Steps

1. ✅ **Current**: Auto-build on push
2. 🔄 **Next**: Add Discord/Slack notifications
3. 📊 **Next**: Performance metrics dashboard
4. 🔐 **Next**: Code signing (Windows & macOS)
5. 🌐 **Next**: Auto-update system

## Resources

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Electron Builder](https://www.electron.build/)
- [Release Templates](https://github.com/mdfarhangamer001-art/max-aii/releases)

---

**Status**: ✅ Fully Automated

**Last Updated**: 2024-07-14

**Maintenance**: Automatic via GitHub Actions