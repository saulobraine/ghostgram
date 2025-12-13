#!/usr/bin/env node
// Simple icon generator using SVG (no dependencies)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const iconsDir = path.join(rootDir, 'icons');

// Icon sizes required by Chrome
const iconSizes = [16, 48, 128];

// Instagram-inspired colors
const colors = {
  primary: '#E4405F',    // Instagram pink
  secondary: '#833AB4',  // Instagram purple
  accent: '#FCAF45',     // Instagram yellow
  background: '#FFFFFF'
};

function createSVGIcon(size) {
  const radius = size * 0.1;
  const centerX = size / 2;
  const centerY = size / 2;
  const cameraRadius = size * 0.3;
  const lensRadius = size * 0.18;
  const dotRadius = size * 0.09;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${colors.secondary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" fill="url(#grad${size})" rx="${radius}"/>
  
  <!-- Camera body (outer circle) -->
  <circle cx="${centerX}" cy="${centerY}" r="${cameraRadius}" fill="${colors.background}" opacity="0.95"/>
  
  <!-- Camera lens (middle circle) -->
  <circle cx="${centerX}" cy="${centerY}" r="${lensRadius}" fill="url(#grad${size})"/>
  
  <!-- Center dot -->
  <circle cx="${centerX}" cy="${centerY}" r="${dotRadius}" fill="${colors.background}"/>
  
  <!-- Optional: Add "U" for Unfollowers -->
  <text x="${centerX}" y="${centerY + size * 0.15}" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.25}" 
        font-weight="bold"
        fill="${colors.background}" 
        text-anchor="middle" 
        opacity="0.8">U</text>
</svg>`;
}

function generateIcons() {
  console.log('🎨 Generating extension icons (SVG format)...\n');

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('📁 Created icons directory\n');
  }

  // Generate each icon size
  iconSizes.forEach(size => {
    const svg = createSVGIcon(size);
    const svgPath = path.join(iconsDir, `icon${size}.svg`);
    const pngPath = path.join(iconsDir, `icon${size}.png`);
    
    // Save SVG
    fs.writeFileSync(svgPath, svg);
    console.log(`✓ Generated SVG icon: icon${size}.svg (${size}x${size})`);
    
    // Note about PNG conversion
    console.log(`   ⚠️  Chrome requires PNG format. Convert SVG to PNG:`);
    console.log(`   - Online: https://cloudconvert.com/svg-to-png`);
    console.log(`   - Or use: npm install canvas && npm run icons:png\n`);
  });

  console.log('✅ SVG icons generated!');
  console.log(`📁 Icons saved to: ${iconsDir}\n`);
  console.log('📝 Next steps:');
  console.log('   1. Convert SVG files to PNG format');
  console.log('   2. Or use the HTML generator: open generate-icons.html in browser');
  console.log('   3. Or install canvas: npm install canvas && npm run icons:png\n');
}

// Run
generateIcons();

