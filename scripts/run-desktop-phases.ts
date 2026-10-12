import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface PhaseDefinition {
  id: number;
  name: string;
  description: string;
  requiredFiles: string[];
  validate?: () => boolean | Promise<boolean>;
}

const PHASES: PhaseDefinition[] = [
  {
    id: 1,
    name: 'Fase 1: Desacoplamento & Setup da UI',
    description: 'Verificação da estrutura React + Vite e dependências do desktop',
    requiredFiles: [
      'packages/desktop/package.json',
      'packages/desktop/tsconfig.json',
      'packages/desktop/tsconfig.main.json',
      'packages/desktop/vite.config.ts',
    ],
  },
  {
    id: 2,
    name: 'Fase 2: Sessão e Login Nativo',
    description: 'Gestor de sessão com partição persist:instagram e captura de cookies',
    requiredFiles: [
      'packages/desktop/src/main/InstagramSessionManager.ts',
      'packages/desktop/src/preload/index.ts',
    ],
  },
  {
    id: 3,
    name: 'Fase 3: Cliente REST e Motores de Scan/Unfollow',
    description: 'Endpoints do Instagram, varredura em 2 fases e fila com proteção anti-ban',
    requiredFiles: [
      'packages/desktop/src/main/DesktopInstagramApiClient.ts',
      'packages/desktop/src/main/DesktopScanEngine.ts',
      'packages/desktop/src/main/DesktopUnfollowEngine.ts',
    ],
  },
  {
    id: 4,
    name: 'Fase 4: Interface do Dashboard (Desktop UI)',
    description: 'Componentes React, barras de progresso, tabela de usuários e modais',
    requiredFiles: [
      'packages/desktop/src/renderer/index.html',
      'packages/desktop/src/renderer/src/main.tsx',
      'packages/desktop/src/renderer/src/App.tsx',
      'packages/desktop/src/renderer/src/components/Header.tsx',
      'packages/desktop/src/renderer/src/components/MetricCards.tsx',
      'packages/desktop/src/renderer/src/components/UserTable.tsx',
      'packages/desktop/src/renderer/src/components/ScanProgressBar.tsx',
      'packages/desktop/src/renderer/src/components/UnfollowProgressBar.tsx',
      'packages/desktop/src/renderer/src/components/WhitelistManagerModal.tsx',
      'packages/desktop/src/renderer/src/components/SettingsModal.tsx',
    ],
  },
  {
    id: 5,
    name: 'Fase 5: Persistência Local e Whitelist',
    description: 'Armazenamento seguro em userData de Whitelist, Configurações e Histórico',
    requiredFiles: [
      'packages/desktop/src/main/DesktopStorageManager.ts',
    ],
  },
  {
    id: 6,
    name: 'Fase 6: Testes, Build & Empacotamento',
    description: 'Testes unitários vitest e compilação completa do Main + Renderer',
    requiredFiles: [
      'packages/desktop/tests/DesktopInstagramApiClient.test.ts',
      'packages/desktop/tests/DesktopScanEngine.test.ts',
      'packages/desktop/tests/DesktopUnfollowEngine.test.ts',
      'packages/desktop/tests/DesktopStorageManager.test.ts',
    ],
  },
];

function logHeader(title: string) {
  console.log('\n' + '='.repeat(68));
  console.log(` 👻 GHOSTGRAM DESKTOP - LOOP DE FASES: ${title}`);
  console.log('='.repeat(68));
}

async function runLoop() {
  const rootDir = process.cwd();
  logHeader('VERIFICAÇÃO E EXECUÇÃO');

  let allPassed = true;

  for (const phase of PHASES) {
    console.log(`\n▶ [FASE ${phase.id}] ${phase.name}`);
    console.log(`  Descrição: ${phase.description}`);

    let missingFiles = 0;
    for (const relPath of phase.requiredFiles) {
      const fullPath = path.join(rootDir, relPath);
      if (fs.existsSync(fullPath)) {
        console.log(`  ✅ Arquivo presente: ${relPath}`);
      } else {
        console.log(`  ❌ Arquivo ausente: ${relPath}`);
        missingFiles++;
      }
    }

    if (missingFiles > 0) {
      console.log(`  ⚠️ Fase ${phase.id} com pendências.`);
      allPassed = false;
    } else {
      console.log(`  ✨ Fase ${phase.id} 100% implementada.`);
    }
  }

  console.log('\n' + '-'.repeat(68));
  console.log('⚡ EXECUTANDO SUITE DE TESTES AUTOMATIZADOS DO DESKTOP...');
  console.log('-'.repeat(68));

  try {
    execSync('pnpm --filter @ghostgram/desktop test', { stdio: 'inherit' });
    console.log('✅ Testes Unitários: APROVADOS (100%)');
  } catch {
    console.error('❌ Testes Unitários: FALHARAM');
    allPassed = false;
  }

  console.log('\n' + '-'.repeat(68));
  console.log('⚡ EXECUTANDO COMPILAÇÃO COMPLETA DO APP DESKTOP...');
  console.log('-'.repeat(68));

  try {
    execSync('pnpm --filter @ghostgram/desktop run build', { stdio: 'inherit' });
    console.log('✅ Build Completo (Renderer + Main + Preload): CONCLUÍDO COM SUCESSO');
  } catch {
    console.error('❌ Build Completo: FALHOU');
    allPassed = false;
  }

  console.log('\n' + '='.repeat(68));
  if (allPassed) {
    console.log(' 🎉 TODAS AS 6 FASES DO PLANO DO DESKTOP ESTÃO APLICADAS E VALIDADAS!');
    console.log(' Para iniciar o desktop em desenvolvimento execute:');
    console.log('   pnpm run dev:desktop');
  } else {
    console.log(' ⚠️ Foram detectadas pendências em algumas fases.');
  }
  console.log('='.repeat(68) + '\n');
}

void runLoop();
