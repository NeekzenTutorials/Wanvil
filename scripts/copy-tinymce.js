// scripts/copy-tinymce.js
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const src = path.resolve('node_modules/tinymce');
const destDir = path.resolve('public');
const dest = path.join(destDir, 'tinymce');

async function copyFolder(srcDir, dstDir) {
  await fsp.mkdir(dstDir, { recursive: true });
  const entries = await fsp.readdir(srcDir, { withFileTypes: true });
  await Promise.all(entries.map(async (e) => {
    const s = path.join(srcDir, e.name);
    const d = path.join(dstDir, e.name);
    if (e.isDirectory()) return copyFolder(s, d);
    return fsp.copyFile(s, d);
  }));
}

(async () => {
  try {
    if (!fs.existsSync(destDir)) await fsp.mkdir(destDir, { recursive: true });
    await copyFolder(src, dest);
    console.log('[copy-tinymce] Copied tinymce -> public/tinymce');
  } catch (e) {
    console.error('[copy-tinymce] Failed:', e);
    process.exit(0); // ne pas casser l’install
  }
})();
