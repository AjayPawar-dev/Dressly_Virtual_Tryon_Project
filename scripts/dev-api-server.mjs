import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generateTryOnHandler from '../api/generate-tryon.js';
import healthHandler from '../api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const DEV_API_PORT = 3001;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnv() {
  loadEnvFile(path.join(projectRoot, '.env.local'));
}

function attachResponseHelpers(res) {
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };

  res.json = (payload) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
    }

    res.end(JSON.stringify(payload));
    return res;
  };

  return res;
}

function routeRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (pathname === '/api/health' || pathname === '/health') {
    healthHandler(req, res);
    return;
  }

  if (pathname === '/api/generate-tryon' || pathname === '/generate-tryon') {
    generateTryOnHandler(req, res);
    return;
  }

  res.status(404).json({ error: 'Not found' });
}

export function createDevApiServer() {
  loadLocalEnv();

  return createServer((req, res) => {
    attachResponseHelpers(res);
    routeRequest(req, res);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const server = createDevApiServer();

  server.listen(DEV_API_PORT, () => {
    console.log(`Local API server listening on http://localhost:${DEV_API_PORT}`);
  });
}
