#!/usr/bin/env node
// Simple build script (no external dependencies)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const rootDir: string = path.resolve(__dirname, '..');
const buildDir: string = path.join(rootDir, 'build');

// Static assets to copy (non-TS files the extension needs)
const staticFiles: string[] = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'options.html',
  'styles.css',
  'history.html'
];

const staticDirs: string[] = [
  'icons'
];

function cleanDirectory(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src: string, dest: string): void {
  const destDir: string = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓ ${path.relative(rootDir, src)}`);
}

function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ Directory not found: ${src}`);
    return;
  }

  const destDir: string = path.join(dest, path.basename(src));
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files: string[] = fs.readdirSync(src);
  files.forEach((file: string) => {
    const srcPath: string = path.join(src, file);
    const destPath: string = path.join(destDir, file);
    const stat: fs.Stats = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destDir);
    } else {
      copyFile(srcPath, destPath);
    }
  });
}

function buildExtension(): void {
  console.log('🚀 Starting build process...\n');

  // Clean build directory
  console.log('📁 Cleaning build directory...');
  cleanDirectory(buildDir);
  console.log('  ✓ Build directory cleaned\n');

  // Compile TypeScript → build/
  console.log('🔧 Compiling TypeScript...');
  try {
    execSync('npx tsc --project tsconfig.build.json', { cwd: rootDir, stdio: 'inherit' });
    const jsCount: number = fs.readdirSync(buildDir, { recursive: true })
      .filter((f: string | Buffer) => f.toString().endsWith('.js')).length;
    console.log(`  ✓ ${jsCount} files compiled\n`);
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
  }

  // Copy static assets
  console.log('📋 Copying static assets...');
  staticFiles.forEach((file: string) => {
    const srcPath: string = path.join(rootDir, file);
    if (fs.existsSync(srcPath)) {
      copyFile(srcPath, path.join(buildDir, file));
    } else {
      console.warn(`  ⚠ File not found: ${file}`);
    }
  });
  console.log('');

  // Copy static directories
  console.log('📁 Copying directories...');
  staticDirs.forEach((dir: string) => {
    const srcPath: string = path.join(rootDir, dir);
    if (fs.existsSync(srcPath)) {
      copyDirectory(srcPath, buildDir);
    } else {
      console.warn(`  ⚠ Directory not found: ${dir}`);
    }
  });
  console.log('');

  // Validate manifest
  console.log('🔍 Validating manifest...');
  const manifestPath: string = path.join(buildDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest: { name: string; version: string } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`  ✓ Manifest validated: ${manifest.name} v${manifest.version}`);
  } else {
    throw new Error('Manifest.json not found in build directory!');
  }
  console.log('');

  // Create zip
  console.log('📦 Creating extension package...');
  const zipPath: string = path.join(rootDir, 'extension.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  try {
    if (process.platform === 'win32') {
      const buildPath: string = buildDir.replace(/\\/g, '/');
      execSync(
        `powershell -Command "Compress-Archive -Path '${buildPath}\\*' -DestinationPath '${zipPath}' -Force"`,
        { stdio: 'inherit' }
      );
    } else {
      execSync(
        `cd ${buildDir} && zip -r ${zipPath} .`,
        { stdio: 'inherit' }
      );
    }

    const stats: fs.Stats = fs.statSync(zipPath);
    const sizeInMB: string = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  ✓ Extension package created: extension.zip (${sizeInMB} MB)`);
  } catch (error) {
    console.warn('  ⚠ Could not create zip file. Build directory is ready for manual packaging.');
    console.warn(`    Build directory: ${buildDir}`);
  }

  console.log(`\n✅ Build completed successfully!`);
  console.log(`📦 Build directory: ${buildDir}`);
  console.log(`📦 Package: ${zipPath}`);
  console.log(`\n💡 Load the extension in Chrome from: ${buildDir}\n`);
}

// Run build
try {
  buildExtension();
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:', (error as Error).message);
  process.exit(1);
}
