#!/usr/bin/env node
/**
 * Post-build minification/obfuscation script.
 * 
 * Usage:
 *   tsx scripts/obfuscate.ts              → minify only (terser)
 *   tsx scripts/obfuscate.ts --obfuscate  → full obfuscation (javascript-obfuscator)
 *   tsx scripts/obfuscate.ts --dir build  → specify directory (default: build)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface ObfuscateOptions {
  dir: string;
  fullObfuscation: boolean;
}

function parseArgs(): ObfuscateOptions {
  const args = process.argv.slice(2);
  return {
    dir: args.includes('--dir') ? args[args.indexOf('--dir') + 1] : 'build',
    fullObfuscation: args.includes('--obfuscate')
  };
}

function collectJsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function minifyWithTerser(code: string, filePath: string): Promise<string> {
  const result = await minify(code, {
    compress: {
      dead_code: true,
      drop_console: false, // keep console for extension debugging
      drop_debugger: true,
      passes: 2
    },
    mangle: {
      reserved: ['chrome'] // don't mangle Chrome API
    },
    format: {
      comments: false
    },
    sourceMap: false
  });

  if (!result.code) {
    throw new Error(`Terser failed for ${filePath}`);
  }

  return result.code;
}

function obfuscateWithJSObfuscator(code: string): string {
  const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: false, // keep size reasonable for extension
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false, // don't rename globals (chrome, document, etc.)
    selfDefending: false, // can cause issues in strict mode
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
    reservedNames: ['chrome', 'browser']
  });

  return result.getObfuscatedCode();
}

async function processFiles(options: ObfuscateOptions): Promise<void> {
  const buildDir = path.resolve(rootDir, options.dir);

  if (!fs.existsSync(buildDir)) {
    console.error(`❌ Directory not found: ${buildDir}`);
    process.exit(1);
  }

  const jsFiles = collectJsFiles(buildDir);
  const mode = options.fullObfuscation ? 'obfuscation' : 'minification';

  console.log(`\n🔒 Starting ${mode}...`);
  console.log(`   Directory: ${buildDir}`);
  console.log(`   Files: ${jsFiles.length}\n`);

  let totalOriginal = 0;
  let totalProcessed = 0;

  for (const filePath of jsFiles) {
    const relativePath = path.relative(buildDir, filePath);
    const original = fs.readFileSync(filePath, 'utf8');
    totalOriginal += original.length;

    try {
      let processed: string;

      if (options.fullObfuscation) {
        // First minify, then obfuscate
        const minified = await minifyWithTerser(original, filePath);
        processed = obfuscateWithJSObfuscator(minified);
      } else {
        processed = await minifyWithTerser(original, filePath);
      }

      fs.writeFileSync(filePath, processed, 'utf8');
      totalProcessed += processed.length;

      const reduction = ((1 - processed.length / original.length) * 100).toFixed(1);
      console.log(`  ✓ ${relativePath}  (${formatSize(original.length)} → ${formatSize(processed.length)}, -${reduction}%)`);
    } catch (error) {
      console.warn(`  ⚠ Skipped ${relativePath}: ${(error as Error).message}`);
      totalProcessed += original.length;
    }
  }

  const totalReduction = ((1 - totalProcessed / totalOriginal) * 100).toFixed(1);
  console.log(`\n✅ ${mode.charAt(0).toUpperCase() + mode.slice(1)} complete!`);
  console.log(`   Total: ${formatSize(totalOriginal)} → ${formatSize(totalProcessed)} (-${totalReduction}%)\n`);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

processFiles(parseArgs()).catch((error: Error) => {
  console.error('❌ Failed:', error.message);
  process.exit(1);
});
