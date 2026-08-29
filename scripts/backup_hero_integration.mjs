import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const BACKUP_DIR = path.join(ROOT_DIR, 'backup', 'hero-before-3d-integration');

const FILES_TO_BACKUP = [
  'src/components/ai/GlobalHeroAgent.jsx',
  'src/components/ai/GlobalHeroAgent.backup.jsx',
  'src/components/ai/MascotHero.jsx',
  'src/components/ai/ChatAgent.jsx',
  'src/components/ai/ChatAgent.backup.jsx',
  'src/components/pillar/ai/HeroInteractiveAgent.jsx',
  'src/components/pillar/ai/HeroInteractiveAgent.backup.jsx',
  'src/components/pillar/ai/MascotFloating.jsx',
  'src/services/pillar/ai/intentRouter.js',
  'src/services/pillar/ai/authenticatedAgents.js',
  'src/services/pillar/ai/publicAgents.js',
  'src/services/pillar/ai/adminAgent.js',
  'src/services/pillar/ai/aiApi.js',
  'src/services/ai/aiService.js',
  'src/styles/hero-animations.css',
  'public/assets/images/mascot-hero.png',
  'src/components/layout/CustomerPortalLayout.jsx',
  'src/components/pillar/layout/PillarLayout.jsx',
  'src/components/pillar/layout/Sidebar.jsx',
  'src/modules/admin/layouts/AdminSidebar.jsx',
  'src/pages/pillar/auth/Register.jsx',
  'src/pages/pillar/auth/Login.jsx',
  'src/pages/auth/Register.jsx'
];

function getSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function runBackup() {
  console.log('Creating snapshot: backup/hero-before-3d-integration/...');
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  let verified = 0;
  for (const relPath of FILES_TO_BACKUP) {
    const srcPath = path.join(ROOT_DIR, relPath);
    const dstPath = path.join(BACKUP_DIR, relPath);

    if (!fs.existsSync(srcPath)) {
      console.warn(`Source not found: ${srcPath}`);
      continue;
    }

    const dstDir = path.dirname(dstPath);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }

    fs.copyFileSync(srcPath, dstPath);
    const srcSha = getSha256(srcPath);
    const dstSha = getSha256(dstPath);
    if (srcSha === dstSha) {
      verified++;
    }
  }

  console.log(`Snapshot complete: ${verified}/${FILES_TO_BACKUP.length} files backed up and verified.`);
}

runBackup();
