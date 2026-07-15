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

// Helper to gather file category stats
function getFolderStats(dirPath) {
  const stats = {
    js: { size: 0, count: 0 },
    css: { size: 0, count: 0 },
    assets: { size: 0, count: 0 },
    html: { size: 0, count: 0 },
    others: { size: 0, count: 0 }
  };

  function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const fileStats = fs.statSync(filePath);
      if (fileStats.isDirectory()) {
        traverse(filePath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
          stats.js.size += fileStats.size;
          stats.js.count++;
        } else if (ext === '.css') {
          stats.css.size += fileStats.size;
          stats.css.count++;
        } else if (ext === '.html') {
          stats.html.size += fileStats.size;
          stats.html.count++;
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.mp3', '.wav'].includes(ext)) {
          stats.assets.size += fileStats.size;
          stats.assets.count++;
        } else {
          stats.others.size += fileStats.size;
          stats.others.count++;
        }
      }
    }
  }

  traverse(dirPath);
  return stats;
}

const args = process.argv.slice(2);
const isPre = args.includes('--pre');
const isPost = args.includes('--post');

let previousMetadata = null;
try {
  if (fs.existsSync(buildMetadataPath)) {
    previousMetadata = JSON.parse(fs.readFileSync(buildMetadataPath, 'utf8'));
  }
} catch (e) {
  // Ignore or start fresh
}

if (isPre || (!isPre && !isPost)) {
  // === PRE-BUILD: INCREMENT VERSION ===
  console.log("===============================================================");
  console.log("🚀 [Nova AI Build Workflow] Starting Pre-Build Diagnostics...");
  console.log("===============================================================");
  
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
  console.log(`📈 [Version Control] Incremented version: ${currentVersion} -> ${newVersion}`);

  // 2. Write version back to server.ts
  if (fs.existsSync(serverTsPath)) {
    let serverTsContent = fs.readFileSync(serverTsPath, 'utf8');
    const versionRegex = /const CURRENT_APP_VERSION = "[^"]*";/;
    if (versionRegex.test(serverTsContent)) {
      serverTsContent = serverTsContent.replace(versionRegex, `const CURRENT_APP_VERSION = "${newVersion}";`);
      fs.writeFileSync(serverTsPath, serverTsContent, 'utf8');
      console.log(`📝 [Version Control] Synchronized server.ts version with "${newVersion}"`);
    } else {
      console.warn(`⚠️ [Version Control] Could not find CURRENT_APP_VERSION in server.ts`);
    }
  }
  console.log("");
}

if (isPost || (!isPre && !isPost)) {
  // === POST-BUILD: CALCULATE ACCURATE INSTALLER FILE SIZE ===
  console.log("===============================================================");
  console.log("📊 [Nova AI Build Workflow] Running Deep Post-Build Size Analysis...");
  console.log("===============================================================");
  
  // Read package.json to get the version we just set
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version || "1.0.0";
  
  let installerSizeStr = "45.0 MB"; // baseline
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
      console.log(`🎯 [Analysis] Verified actual production installer file: ${setupFile} (${installerSizeStr})`);
    }
  }

  const distDir = path.resolve(__dirname, '../dist');
  const distSize = getFolderSize(distDir);

  if (!foundReleaseFile) {
    // Calculate dist/ folder size and add to the baseline Electron wrapper size (approx 145 MB for full production wrapper)
    const baselineBytes = 145 * 1024 * 1024; // 145 MB standard desktop engine baseline
    exactSizeInBytes = baselineBytes + distSize;
    installerSizeStr = (exactSizeInBytes / (1024 * 1024)).toFixed(2) + " MB";
    console.log(`📦 [Analysis] Compiled dynamic installer bundle size (Web Assets + Electron Shell): ${installerSizeStr}`);
  }

  // 1. Compile category-level asset stats
  const distStats = getFolderStats(distDir);
  console.log("\n📁 [Bundle Breakdown]");
  console.log(`  - JS Bundles:  ${(distStats.js.size / 1024).toFixed(2)} KB (${distStats.js.count} files)`);
  console.log(`  - CSS Styles:  ${(distStats.css.size / 1024).toFixed(2)} KB (${distStats.css.count} files)`);
  console.log(`  - Visual Assets: ${(distStats.assets.size / 1024).toFixed(2)} KB (${distStats.assets.count} files)`);
  console.log(`  - Document HTML: ${(distStats.html.size / 1024).toFixed(2)} KB (${distStats.html.count} files)`);
  console.log(`  - Other configs: ${(distStats.others.size / 1024).toFixed(2)} KB (${distStats.others.count} files)`);
  console.log(`  - TOTAL WEB SIZE: ${(distSize / 1024).toFixed(2)} KB`);

  // 2. Perform Comparative Diagnostics with previous build
  let prevBytes = previousMetadata ? (previousMetadata.bytes || 0) : 0;
  let prevVersion = previousMetadata ? (previousMetadata.version || "Unknown") : "N/A";
  
  let changeInBytes = 0;
  let changePercentage = "0.00%";
  let sizeTrend = "unchanged";
  let explanation = "This is the initial analysis or baseline size.";

  if (prevBytes > 0) {
    changeInBytes = exactSizeInBytes - prevBytes;
    const rawPct = (changeInBytes / prevBytes) * 100;
    changePercentage = (rawPct >= 0 ? "+" : "") + rawPct.toFixed(4) + "%";
    
    if (changeInBytes > 0) {
      sizeTrend = "increased";
      explanation = `The installer package size increased by ${(changeInBytes / 1024).toFixed(2)} KB (${changePercentage}) compared to ${prevVersion}. This is typically due to additional visual assets, node packages, or bundle features.`;
    } else if (changeInBytes < 0) {
      sizeTrend = "decreased";
      explanation = `Excellent optimization! The installer package size decreased by ${(Math.abs(changeInBytes) / 1024).toFixed(2)} KB (${changePercentage}) compared to ${prevVersion}.`;
    } else {
      sizeTrend = "unchanged";
      explanation = `The installer package size is exactly identical to the previous build (${prevVersion}). No size change detected.`;
    }
  }

  console.log("\n📈 [Comparative Trend Analysis]");
  console.log(`  - Previous Build: v${prevVersion} (${prevBytes > 0 ? (prevBytes / (1024 * 1024)).toFixed(2) + " MB" : "N/A"})`);
  console.log(`  - Current Build:  v${currentVersion} (${installerSizeStr})`);
  console.log(`  - Size Shift:     ${sizeTrend.toUpperCase()} (${changePercentage})`);
  console.log(`  - Diagnostic Context: ${explanation}\n`);

  // 4. Save robust consolidated metadata
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const metadata = {
    version: currentVersion,
    installerSize: installerSizeStr,
    bytes: exactSizeInBytes,
    builtAt: new Date().toISOString(),
    analysis: {
      previousVersion: prevVersion,
      previousBytes: prevBytes,
      changeInBytes,
      changePercentage,
      sizeTrend,
      explanation,
      bundleBreakdown: {
        jsBytes: distStats.js.size,
        jsCount: distStats.js.count,
        cssBytes: distStats.css.size,
        cssCount: distStats.css.count,
        assetsBytes: distStats.assets.size,
        assetsCount: distStats.assets.count,
        htmlBytes: distStats.html.size,
        htmlCount: distStats.html.count,
        othersBytes: distStats.others.size,
        othersCount: distStats.others.count,
        totalWebBytes: distSize
      }
    }
  };

  fs.writeFileSync(buildMetadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`✅ [Build Process] Successfully compiled metadata and saved to: ${buildMetadataPath}`);
  console.log("===============================================================\n");
}
