import asar from '@electron/asar';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bundle() {
  const rootDir = __dirname;
  const tempAppDir = path.join(rootDir, '.temp_app');
  const targetDir = fs.existsSync(path.join(rootDir, 'RankSync-Windows')) 
    ? path.join(rootDir, 'RankSync-Windows') 
    : path.join(rootDir, 'PCM-Tracker-Windows');
  const targetResources = path.join(targetDir, 'resources');
  const targetAsar = path.join(targetResources, 'app.asar');

  console.log('1. Preparing clean app staging directory...');
  if (fs.existsSync(tempAppDir)) {
    fs.rmSync(tempAppDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempAppDir, { recursive: true });

  // Copy dist
  fs.cpSync(path.join(rootDir, 'dist'), path.join(tempAppDir, 'dist'), { recursive: true });

  // Copy electron
  fs.cpSync(path.join(rootDir, 'electron'), path.join(tempAppDir, 'electron'), { recursive: true });

  // Create package.json
  const pkg = {
    name: 'ranksync',
    productName: 'RankSync',
    version: '1.0.0',
    main: 'electron/main.cjs',
  };
  fs.writeFileSync(path.join(tempAppDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8');

  console.log('2. Packing into app.asar via @electron/asar...');
  await asar.createPackage(tempAppDir, targetAsar);

  console.log('3. Cleaning up default_app.asar and loose folders...');
  const defaultAppAsar = path.join(targetResources, 'default_app.asar');
  if (fs.existsSync(defaultAppAsar)) {
    fs.rmSync(defaultAppAsar, { force: true });
  }

  const looseApp = path.join(targetResources, 'app');
  if (fs.existsSync(looseApp)) {
    fs.rmSync(looseApp, { recursive: true, force: true });
  }

  fs.rmSync(tempAppDir, { recursive: true, force: true });

  console.log('SUCCESS! app.asar created at:', targetAsar);
}

bundle().catch(err => {
  console.error('Error bundling app.asar:', err);
  process.exit(1);
});
