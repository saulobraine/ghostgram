#!/usr/bin/env node
// Icon generator using Sharp (converted from CommonJS)
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const sizes: number[] = [16, 48, 128];

async function generateIcon(size: number): Promise<void> {
  const fontSize: number = Math.round(size * 0.75);
  const svg: string = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size*0.2)}" fill="#1a1a1a"/>
    <text x="50%" y="54%" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">👻</text>
  </svg>`;
  
  const outPath: string = path.join(__dirname, '..', 'icons', `icon${size}.png`);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`Generated icon${size}.png`);
}

(async (): Promise<void> => {
  for (const s of sizes) {
    await generateIcon(s);
  }
  console.log('Done!');
})();
