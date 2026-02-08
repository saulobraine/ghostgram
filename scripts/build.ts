#!/usr/bin/env node
// Build script for Chrome Extension
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import archiver from 'archiver';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const rootDir: string = path.resolve(__dirname, '..');
const distDir: string = path.join(rootDir, 'dist');
const buildDir: string = path.join(rootDir, 'build');

// Compile TypeScript before building
console.log('🔧 Compiling TypeScript...');
try {
  execSync('npx tsc --project tsconfig.build.json', { cwd: rootDir, stdio: 'inherit' });
  console.log('✓ TypeScript compiled successfully\n');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  process.exit(1);
}

// Files and directories to include in build
const filesToCopy: string[] = [
  'manifest.json',
  'content.js',
  'content-main.js',
  'background.js',
  'popup.html',
  'popup.js',
  'popup.css',
  'options.html',
  'options.js',
  'styles.css',
  'history.html',
  'history.js'
];

const dirsToCopy: string[] = [
  'src',
  'icons'
];

const filesToExclude: string[] = [
  'node_modules',
  'tests',
  'coverage',
  '.git',
  'dist',
  'build',
  '*.test.js',
  '*.snapshot.test.js',
  'package.json',
  'package-lock.json',
  'jest.config.js',
  'README.md',
  'README-TESTS.md',
  'INSTALL.md',
  'generate-icons.html',
  '.github'
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
  console.log(`✓ Copied: ${path.relative(rootDir, src)}`);
}

function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    console.warn(`⚠ Directory not found: ${src}`);
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

function shouldExclude(filePath: string): boolean {
  const relativePath: string = path.relative(rootDir, filePath);
  return filesToExclude.some((pattern: string) => {
    if (pattern.includes('*')) {
      const regex: RegExp = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(relativePath);
    }
    return relativePath.includes(pattern);
  });
}

function buildExtension(): Promise<void> {
  console.log('🚀 Starting build process...\n');

  // Clean build directory
  console.log('📁 Cleaning build directory...');
  cleanDirectory(buildDir);
  console.log('✓ Build directory cleaned\n');

  // Copy files
  console.log('📋 Copying files...');
  filesToCopy.forEach((file: string) => {
    const srcPath: string = path.join(rootDir, file);
    if (fs.existsSync(srcPath)) {
      const destPath: string = path.join(buildDir, file);
      copyFile(srcPath, destPath);
    } else {
      console.warn(`⚠ File not found: ${file}`);
    }
  });
  console.log('');

  // Copy directories
  console.log('📁 Copying directories...');
  dirsToCopy.forEach((dir: string) => {
    const srcPath: string = path.join(rootDir, dir);
    if (fs.existsSync(srcPath)) {
      copyDirectory(srcPath, buildDir);
    } else {
      console.warn(`⚠ Directory not found: ${dir}`);
    }
  });
  console.log('');

  // Validate manifest
  console.log('🔍 Validating manifest...');
  const manifestPath: string = path.join(buildDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest: { name: string; version: string } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`✓ Manifest validated: ${manifest.name} v${manifest.version}`);
  } else {
    throw new Error('Manifest.json not found in build directory!');
  }
  console.log('');

  // Create zip file
  console.log('📦 Creating extension package...');
  const zipPath: string = path.join(rootDir, 'extension.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  return new Promise<void>((resolve, reject) => {
    const output: fs.WriteStream = fs.createWriteStream(zipPath);
    const archive: archiver.Archiver = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeInMB: string = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✓ Extension package created: extension.zip (${sizeInMB} MB)`);
      console.log(`\n✅ Build completed successfully!`);
      console.log(`📦 Build directory: ${buildDir}`);
      console.log(`📦 Package: ${zipPath}\n`);
      resolve();
    });

    archive.on('error', (err: Error) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(buildDir, false);
    archive.finalize();
  });
}

// Run build
buildExtension()
  .then(() => {
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
