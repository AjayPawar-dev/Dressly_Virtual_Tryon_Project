import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const viteCliPath = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

if (!existsSync(viteCliPath)) {
  console.error('Unable to find Vite CLI. Run npm install in vton-frontend first.');
  process.exit(1);
}

function spawnChild(label, args) {
  const child = spawn(process.execPath, args, {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`${label} exited with signal ${signal}`);
      return;
    }

    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}`);
      shutdown(code);
    }
  });

  child.on('error', (error) => {
    console.error(`${label} failed to start`, error);
    shutdown(1);
  });

  return child;
}

let apiProcess;
let viteProcess;
let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (apiProcess && !apiProcess.killed) {
    apiProcess.kill('SIGTERM');
  }

  if (viteProcess && !viteProcess.killed) {
    viteProcess.kill('SIGTERM');
  }

  setTimeout(() => process.exit(exitCode), 150);
}

export function startDevServers() {
  apiProcess = spawnChild('API server', ['scripts/dev-api-server.mjs']);
  viteProcess = spawnChild('Vite dev server', [viteCliPath]);

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startDevServers();
}
