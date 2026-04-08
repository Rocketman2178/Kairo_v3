#!/usr/bin/env node
// Strips --root <path> injected by Claude preview_start (Vite 5 doesn't support --root flag)
const { spawn } = require('child_process');
const rawArgs = process.argv.slice(2);
const args = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--root') { i++; continue; }
  args.push(rawArgs[i]);
}
const proc = spawn('/usr/local/bin/npm', ['run', 'dev', '--', ...args], {
  cwd: '/Users/marshallbriggs/Documents/GitHub/Kairo_v3',
  stdio: 'inherit',
  env: process.env,
});
proc.on('exit', code => process.exit(code ?? 0));
