#!/usr/bin/env node
// Script to generate extension icons
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const rootDir: string = path.resolve(__dirname, '..');
const iconsDir: string = path.join(rootDir, 'icons');

// Icon sizes required by Chrome
const iconSizes: number[] = [16, 48, 128];

// Colors for the icon
const colors: Record<string, string> = {
  primary: '#E4405F', // Instagram pink
  secondary: '#833AB4', // Instagram purple
  accent: '#FCAF45', // Instagram yellow
  background: '#FFFFFF'
};

function createIcon(size: number): Buffer {
  // Try to use canvas if available, otherwise create a simple SVG
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(0.5, colors.secondary);
    gradient.addColorStop(1, colors.accent);
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw Instagram camera icon (simplified)
    ctx.fillStyle = colors.background;
    const centerX: number = size / 2;
    const centerY: number = size / 2;
    const radius: number = size * 0.3;
    
    // Draw camera body
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw camera lens
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw center dot
    ctx.fillStyle = colors.background;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas.toBuffer('image/png');
  } catch (error) {
    // Fallback: create SVG
    return createSVGIcon(size);
  }
}

function createSVGIcon(size: number): Buffer {
  const svg: string = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${colors.secondary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.3}" fill="${colors.background}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.18}" fill="url(#grad)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.09}" fill="${colors.background}"/>
</svg>`;
  return Buffer.from(svg);
}

function generateIcons(): void {
  console.log('🎨 Generating extension icons...\n');

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('📁 Created icons directory\n');
  }

  // Generate each icon size
  iconSizes.forEach((size: number) => {
    try {
      const iconData: Buffer = createIcon(size);
      const iconPath: string = path.join(iconsDir, `icon${size}.png`);
      
      // If we got SVG, convert to PNG or save as SVG
      if (iconData.toString().includes('<svg')) {
        // Save as SVG (Chrome accepts SVG in some contexts, but PNG is preferred)
        const svgPath: string = path.join(iconsDir, `icon${size}.svg`);
        fs.writeFileSync(svgPath, iconData);
        console.log(`⚠️  Generated SVG icon: icon${size}.svg (PNG preferred)`);
        console.log(`   You may need to convert this to PNG manually`);
      } else {
        fs.writeFileSync(iconPath, iconData);
        console.log(`✓ Generated icon: icon${size}.png (${size}x${size})`);
      }
    } catch (error) {
      console.error(`❌ Error generating icon${size}.png:`, (error as Error).message);
      // Create a simple placeholder
      createPlaceholderIcon(size);
    }
  });

  console.log('\n✅ Icon generation complete!');
  console.log(`📁 Icons saved to: ${iconsDir}\n`);
  
  // Check if canvas is available
  try {
    require('canvas');
    console.log('✓ Using canvas library for PNG generation');
  } catch (e) {
    console.log('⚠️  Canvas library not found. Install it with: npm install canvas');
    console.log('   Or use the HTML generator: open generate-icons.html in browser\n');
  }
}

function createPlaceholderIcon(size: number): void {
  // Create a simple colored square as placeholder
  const svg: string = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${colors.primary}"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.4}" fill="white" text-anchor="middle" dominant-baseline="middle">IG</text>
</svg>`;
  const svgPath: string = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Created placeholder SVG: icon${size}.svg`);
}

// Run
generateIcons();
