#!/usr/bin/env node
// Build script for Chrome Extension
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const buildDir = path.join(rootDir, 'build');

// Files and directories to include in build
const filesToCopy = [
  'manifest.json',
  'content.js',
  'background.js',
  'popup.html',
  'popup.js',
  'options.html',
  'options.js',
  'styles.css',
  'bundle.js'
];

const dirsToCopy = [
  'src',
  'icons'
];

const filesToExclude = [
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

function cleanDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied: ${path.relative(rootDir, src)}`);
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠ Directory not found: ${src}`);
    return;
  }

  const destDir = path.join(dest, path.basename(src));
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(src);
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(destDir, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destDir);
    } else {
      copyFile(srcPath, destPath);
    }
  });
}

function shouldExclude(filePath) {
  const relativePath = path.relative(rootDir, filePath);
  return filesToExclude.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(relativePath);
    }
    return relativePath.includes(pattern);
  });
}

function buildExtension() {
  console.log('🚀 Starting build process...\n');

  // Clean build directory
  console.log('📁 Cleaning build directory...');
  cleanDirectory(buildDir);
  console.log('✓ Build directory cleaned\n');

  // Copy files
  console.log('📋 Copying files...');
  filesToCopy.forEach(file => {
    const srcPath = path.join(rootDir, file);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(buildDir, file);
      copyFile(srcPath, destPath);
    } else {
      console.warn(`⚠ File not found: ${file}`);
    }
  });
  console.log('');

  // Copy directories
  console.log('📁 Copying directories...');
  dirsToCopy.forEach(dir => {
    const srcPath = path.join(rootDir, dir);
    if (fs.existsSync(srcPath)) {
      copyDirectory(srcPath, buildDir);
    } else {
      console.warn(`⚠ Directory not found: ${dir}`);
    }
  });
  console.log('');

  // Validate manifest
  console.log('🔍 Validating manifest...');
  const manifestPath = path.join(buildDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`✓ Manifest validated: ${manifest.name} v${manifest.version}`);
  } else {
    throw new Error('Manifest.json not found in build directory!');
  }
  console.log('');

  // Create zip file
  console.log('📦 Creating extension package...');
  const zipPath = path.join(rootDir, 'extension.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`✓ Extension package created: extension.zip (${sizeInMB} MB)`);
      console.log(`\n✅ Build completed successfully!`);
      console.log(`📦 Build directory: ${buildDir}`);
      console.log(`📦 Package: ${zipPath}\n`);
      resolve();
    });

    archive.on('error', (err) => {
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
  .catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });

