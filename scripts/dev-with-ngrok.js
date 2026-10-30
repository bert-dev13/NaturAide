#!/usr/bin/env node
/**
 * NatureAide Combined Development & Public Tunnel Runner
 *
 * Windows-compatible process manager:
 * 1. Ensures MySQL service is active on localhost:3306
 * 2. Starts Next.js development server on http://localhost:3000
 * 3. Starts secure ngrok HTTPS tunnel
 * 4. Prints clean, simplified status and testing link
 * 5. Cleanly terminates all child processes on Ctrl+C
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from .env.local without logging secrets
const envLocalPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envLocalPath)) {
  try {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

let nextProcess = null;
let ngrokListener = null;
let ngrokCliProcess = null;
let isShuttingDown = false;

// Idempotent clean process & tunnel teardown
function cleanupAndExit(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('\nStopping NatureAide and closing tunnel...');

  if (ngrokListener) {
    try {
      if (typeof ngrokListener.close === 'function') ngrokListener.close();
    } catch {}
    ngrokListener = null;
  }
  try {
    const ngrok = require('@ngrok/ngrok');
    if (typeof ngrok.disconnect === 'function') ngrok.disconnect();
  } catch {}

  if (ngrokCliProcess && ngrokCliProcess.pid) {
    const pid = ngrokCliProcess.pid;
    ngrokCliProcess = null;
    if (process.platform === 'win32') {
      try { execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' }); } catch {}
    } else {
      try { process.kill(pid, 'SIGTERM'); } catch {}
    }
  }

  if (nextProcess && nextProcess.pid) {
    const targetPid = nextProcess.pid;
    nextProcess = null;
    if (process.platform === 'win32') {
      try { execSync(`taskkill /pid ${targetPid} /T /F`, { stdio: 'ignore' }); } catch {}
    } else {
      try {
        process.kill(-targetPid, 'SIGTERM');
      } catch {
        try { process.kill(targetPid, 'SIGTERM'); } catch {}
      }
    }
  }

  process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));
if (process.platform !== 'win32') {
  process.on('SIGHUP', () => cleanupAndExit(0));
}
process.on('uncaughtException', (err) => {
  console.error('\nDev runner error:', err.message || err);
  cleanupAndExit(1);
});

// Check if a port is open
function isPortOpen(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      status = true;
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

// Auto-start MySQL if port 3306 is not open
async function ensureMySQLRunning() {
  const isOpen = await isPortOpen(3306);
  if (isOpen) return true;

  // Check known XAMPP mysql binary locations
  const candidateMysqld = [
    'C:\\xamppp\\mysql\\bin\\mysqld.exe',
    'C:\\xampp\\mysql\\bin\\mysqld.exe',
    'C:\\laragon\\bin\\mysql\\current\\bin\\mysqld.exe',
  ];

  for (const bin of candidateMysqld) {
    if (fs.existsSync(bin)) {
      const workingDir = path.dirname(path.dirname(bin));
      const iniFile = path.join(bin, '..', 'my.ini');
      try {
        const args = fs.existsSync(iniFile)
          ? [`--defaults-file=${iniFile}`, '--standalone']
          : ['--standalone'];

        spawn(bin, args, {
          cwd: workingDir,
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        }).unref();

        // Wait up to 5 seconds for MySQL to be ready
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (await isPortOpen(3306)) {
            return true;
          }
        }
      } catch {}
    }
  }

  return false;
}

// Helper: Poll Next.js server until responsive
function waitForNextServer(port = 3000, maxWaitMs = 60000) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      if (isShuttingDown) return resolve(false);

      const socket = net.connect({ port, host: '127.0.0.1' }, () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - startTime > maxWaitMs) {
          resolve(false);
        } else {
          setTimeout(check, 400);
        }
      });

      socket.setTimeout(3000, () => {
        socket.destroy();
        if (Date.now() - startTime > maxWaitMs) {
          resolve(false);
        } else {
          setTimeout(check, 400);
        }
      });
    };

    check();
  });
}

// Helper: Resolve ngrok authtoken securely from env or config files without logging secrets
function resolveNgrokAuthtoken() {
  if (process.env.NGROK_AUTHTOKEN && process.env.NGROK_AUTHTOKEN.trim()) {
    return process.env.NGROK_AUTHTOKEN.trim();
  }

  const candidatePaths = [
    path.join(process.env.LOCALAPPDATA || '', 'ngrok', 'ngrok.yml'),
    path.join(process.env.USERPROFILE || process.env.HOME || '', '.config', 'ngrok', 'ngrok.yml'),
    path.join(process.env.USERPROFILE || process.env.HOME || '', '.ngrok2', 'ngrok.yml'),
  ];

  for (const cfgPath of candidatePaths) {
    if (cfgPath && fs.existsSync(cfgPath)) {
      try {
        const text = fs.readFileSync(cfgPath, 'utf8');
        const match = text.match(/authtoken:\s*["']?([^\s"']+)["']?/);
        if (match && match[1]) {
          return match[1].trim();
        }
      } catch {}
    }
  }

  return null;
}

async function startDevEnvironment() {
  console.log('Starting NatureAide...\n');

  // 1. Ensure MySQL is accessible
  await ensureMySQLRunning();

  // 2. Start Next.js Development Server
  const isWindows = process.platform === 'win32';
  const nextCliScript = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

  let spawnExecutable;
  let spawnArgs;

  if (fs.existsSync(nextCliScript)) {
    spawnExecutable = process.execPath;
    spawnArgs = [nextCliScript, 'dev'];
  } else if (isWindows) {
    spawnExecutable = process.env.ComSpec || 'cmd.exe';
    spawnArgs = ['/d', '/s', '/c', 'npm run dev:local'];
  } else {
    spawnExecutable = 'npm';
    spawnArgs = ['run', 'dev:local'];
  }

  const spawnOptions = {
    cwd: projectRoot,
    env: { ...process.env, PORT: '3000' },
    stdio: 'inherit',
    windowsHide: false,
  };

  try {
    nextProcess = spawn(spawnExecutable, spawnArgs, spawnOptions);
  } catch (err) {
    console.error('\nFailed to start Next.js:', err.message || err);
    cleanupAndExit(1);
    return;
  }

  nextProcess.on('error', (err) => {
    console.error('\nNext.js error:', err.message || err);
    cleanupAndExit(1);
  });

  nextProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      cleanupAndExit(code || 0);
    }
  });

  // 3. Wait until localhost:3000 is ready
  const isReady = await waitForNextServer(3000, 60000);

  if (!isReady) {
    console.error('\nTimed out waiting for Next.js to start.');
    cleanupAndExit(1);
    return;
  }

  // 4. Start ngrok tunnel
  const authtoken = resolveNgrokAuthtoken();
  let publicUrl = null;

  if (!authtoken) {
    console.log('\n✓ NatureAide ready');
    console.log('⚠ ngrok authentication is not configured\n');
    console.log('Local:\nhttp://localhost:3000\n');
    console.log('Press Ctrl+C to stop.');
    return;
  }

  try {
    const ngrok = require('@ngrok/ngrok');
    const options = {
      addr: 3000,
      authtoken: authtoken,
    };

    ngrokListener = await ngrok.forward(options);
    publicUrl = ngrokListener.url();
  } catch (err) {
    // Fallback: spawn ngrok binary if @ngrok/ngrok forward had an issue
    try {
      const bin = process.env.NGROK_BIN || 'ngrok';
      ngrokCliProcess = spawn(bin, ['http', '3000', '--log', 'stdout', '--log-format', 'json'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      publicUrl = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(null), 10000);
        ngrokCliProcess.stdout.on('data', (chunk) => {
          for (const line of chunk.toString().split(/\r?\n/)) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);
              if (typeof event.url === 'string' && event.url.startsWith('https://')) {
                clearTimeout(timeout);
                resolve(event.url);
              }
            } catch {}
          }
        });
      });
    } catch {}
  }

  // 5. Clean, simplified terminal output matching user specification
  if (publicUrl) {
    console.log('\n✓ NatureAide ready');
    console.log('✓ Public tunnel connected\n');
    console.log('Local:');
    console.log('http://localhost:3000\n');
    console.log('PUBLIC LINK:');
    console.log(publicUrl + '\n');
    console.log('Keep this terminal open.');
    console.log('Press Ctrl+C to stop.\n');
  } else {
    console.log('\n✓ NatureAide ready');
    console.log('Local:\nhttp://localhost:3000\n');
    console.log('Press Ctrl+C to stop.\n');
  }
}

startDevEnvironment();
