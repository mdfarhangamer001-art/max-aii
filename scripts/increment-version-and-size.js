import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../package.json');
const serverTsPath = path.resolve(__dirname, '../server.ts');
const buildMetadataPath = path.resolve(__dirname, '../dist/build-metadata.json');

// Helper to calculate folder size recursively
function getFolderSize(dirPath) {
  let totalSize = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      totalSize += getFolderSize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  return totalSize;
}

const args = process.argv.slice(2);
const isPre = args.includes('--pre');
const isPost = args.includes('--post');

if (isPre || (!isPre && !isPost)) {
  // === PRE-BUILD: INCREMENT VERSION ===
  console.log("[Build Process] Running Pre-Build Version Increment...");
  
  // 1. Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || "1.0.0";

  // Split version parts
  const parts = currentVersion.split('.').map(Number);
  if (parts.length === 3 && !isNaN(parts[2])) {
    parts[2] += 1; // Increment patch version
  } else {
    parts[0] = 1;
    parts[1] = 0;
    parts[2] = 1;
  }
  const newVersion = parts.join('.');
  packageJson.version = newVersion;

  // Write back to package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
  console.log(`[Build Process] Version incremented: ${currentVersion} -> ${newVersion}`);

  // 2. Write version back to server.ts
  if (fs.existsSync(serverTsPath)) {
    let serverTsContent = fs.readFileSync(serverTsPath, 'utf8');
    const versionRegex = /const CURRENT_APP_VERSION = "[^"]*";/;
    if (versionRegex.test(serverTsContent)) {
      serverTsContent = serverTsContent.replace(versionRegex, `const CURRENT_APP_VERSION = "${newVersion}";`);
      fs.writeFileSync(serverTsPath, serverTsContent, 'utf8');
      console.log(`[Build Process] Updated server.ts CURRENT_APP_VERSION to "${newVersion}"`);
    } else {
      console.warn(`[Build Process] Could not find CURRENT_APP_VERSION declaration in server.ts`);
    }
  }
}

if (isPost || (!isPre && !isPost)) {
  // === POST-BUILD: CALCULATE ACCURATE INSTALLER FILE SIZE ===
  console.log("[Build Process] Running Post-Build Installer Size Calculation...");
  
  // Read package.json to get the version we just set
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || "1.0.0";
  
  let installerSizeStr = "45.2 MB"; // default baseline
  let exactSizeInBytes = 0;

  const releaseDir = path.resolve(__dirname, '../release');
  let foundReleaseFile = false;

  if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir);
    const setupFile = files.find(f => f.endsWith('.exe') || f.endsWith('.dmg') || f.endsWith('.zip'));
    if (setupFile) {
      const stats = fs.statSync(path.join(releaseDir, setupFile));
      exactSizeInBytes = stats.size;
      installerSizeStr = (stats.size / (1024 * 1024)).toFixed(2) + " MB";
      foundReleaseFile = true;
      console.log(`[Build Process] Found setup file: ${setupFile} (${installerSizeStr})`);
    }
  }

  if (!foundReleaseFile) {
    // Calculate dist/ folder size and add to the baseline Electron wrapper size (approx 45.0 MB)
    const distDir = path.resolve(__dirname, '../dist');
    const distSize = getFolderSize(distDir);
    const baselineBytes = 45 * 1024 * 1024; // 45 MB baseline for full Electron package shell
    exactSizeInBytes = baselineBytes + distSize;
    installerSizeStr = (exactSizeInBytes / (1024 * 1024)).toFixed(2) + " MB";
    console.log(`[Build Process] Calculated dynamic bundle installer size (dist + baseline): ${installerSizeStr}`);
  }

  // 4. Save metadata
  const distDir = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const metadata = {
    version: currentVersion,
    installerSize: installerSizeStr,
    bytes: exactSizeInBytes,
    builtAt: new Date().toISOString()
  };

  fs.writeFileSync(buildMetadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`[Build Process] Wrote build-metadata.json with version ${currentVersion} and installer size ${installerSizeStr}`);
}
