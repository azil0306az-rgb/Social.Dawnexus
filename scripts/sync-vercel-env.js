import { spawn } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const envsToAdd = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'CRON_SECRET',
  'APP_URL',
  'MAIN_SITE_URL',
];

async function addEnvVar(key, val) {
  if (!val) {
    console.log(`Skipping ${key} (no value)`);
    return;
  }

  // Remove existing first to avoid duplicate errors
  await new Promise((resolve) => {
    const rm = spawn('npx', ['vercel', 'env', 'rm', key, 'production', '-y'], { shell: true });
    rm.on('close', () => resolve());
  });

  return new Promise((resolve, reject) => {
    console.log(`Adding ${key} to Vercel production...`);
    const proc = spawn('npx', ['vercel', 'env', 'add', key, 'production'], {
      shell: true,
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    proc.stdin.write(val);
    proc.stdin.end();

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ Added ${key}`);
        resolve();
      } else {
        console.warn(`Warning: exit code ${code} for ${key}`);
        resolve();
      }
    });

    proc.on('error', (err) => {
      console.error(`Error adding ${key}:`, err);
      resolve();
    });
  });
}

async function main() {
  for (const k of envsToAdd) {
    const val = process.env[k];
    if (val) {
      await addEnvVar(k, val);
    }
  }
  console.log('Environment sync completed.');
}

main();
