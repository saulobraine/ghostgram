#!/usr/bin/env node
// Convert SVG icons to PNG
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const iconsDir = path.join(rootDir, 'icons');

const iconSizes = [16, 48, 128];

async function convertWithSharp() {
  try {
    const sharp = (await import('sharp')).default;

    console.log('🔄 Converting SVG icons to PNG using Sharp...\n');

    for (const size of iconSizes) {
      const svgPath = path.join(iconsDir, `icon${size}.svg`);
      const pngPath = path.join(iconsDir, `icon${size}.png`);

      if (!fs.existsSync(svgPath)) {
        console.warn(`⚠️  SVG not found: icon${size}.svg`);
        continue;
      }

      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);

      console.log(`✓ Converted: icon${size}.png (${size}x${size})`);
    }

    console.log('\n✅ Conversion complete!');
    return true;
  } catch (error) {
    return false;
  }
}

async function convertWithCanvas() {
  try {
    const { createCanvas, loadImage } = await import('canvas');

    console.log('🔄 Converting SVG icons to PNG using Canvas...\n');

    for (const size of iconSizes) {
      const svgPath = path.join(iconsDir, `icon${size}.svg`);
      const pngPath = path.join(iconsDir, `icon${size}.png`);

      if (!fs.existsSync(svgPath)) {
        console.warn(`⚠️  SVG not found: icon${size}.svg`);
        continue;
      }

      // Canvas doesn't support SVG directly, so we'll use a workaround
      // Read SVG as data URL and create image
      const svgData = fs.readFileSync(svgPath, 'utf8');
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`;

      const img = await loadImage(dataUrl);
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, size, size);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(pngPath, buffer);

      console.log(`✓ Converted: icon${size}.png (${size}x${size})`);
    }

    console.log('\n✅ Conversion complete!');
    return true;
  } catch (error) {
    return false;
  }
}

function convertWithBrowserAPI() {
  console.log('📝 Browser-based conversion instructions:\n');
  console.log('1. Open generate-icons.html in your browser');
  console.log('2. Click "Download All Icons"');
  console.log('3. Move the downloaded PNG files to the icons/ folder\n');
  console.log('Or use an online converter:');
  console.log('- https://cloudconvert.com/svg-to-png');
  console.log('- https://convertio.co/svg-png/\n');
}

async function main() {
  console.log('🎨 Converting SVG icons to PNG...\n');

  // Try Sharp first (best option)
  if (await convertWithSharp()) {
    return;
  }

  // Try Canvas
  if (await convertWithCanvas()) {
    return;
  }

  // Fallback to instructions
  console.log('❌ No conversion library found.\n');
  console.log('Install one of these:\n');
  console.log('  npm install sharp');
  console.log('  npm install canvas\n');
  console.log('Or use the browser method:\n');
  convertWithBrowserAPI();
}

main().catch(console.error);

