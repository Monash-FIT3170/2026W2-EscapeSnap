// Cross-platform launcher for `meteor run`.
//
// Replaces `export $(cat .env | xargs) && meteor run`, which only worked in a
// POSIX shell — npm runs scripts through cmd.exe on Windows, where `export` is
// not a command — and which failed outright when no .env file existed, even
// though every variable in .env.example is optional.
//
// Any extra arguments are passed straight through, e.g.
//   meteor npm start -- --port 4000

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const ENV_FILE = '.env';

function loadEnvFile(path) {
  const loaded = {};

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    if (!key) continue;

    let value = trimmed.slice(separator + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);

    loaded[key] = value;
  }

  return loaded;
}

const env = { ...process.env };

if (existsSync(ENV_FILE)) {
  const loaded = loadEnvFile(ENV_FILE);
  Object.assign(env, loaded);
  console.log(`Loaded ${Object.keys(loaded).length} variable(s) from ${ENV_FILE}.`);
} else {
  // Plain ASCII: the Windows console renders this in cp1252, which mangles
  // any non-ASCII punctuation.
  console.log(
    `No ${ENV_FILE} file found - starting with the current environment.\n` +
      `Copy .env.example to ${ENV_FILE} if you need the optional Vision or Rekognition credentials.`
  );
}

// shell: true so that the meteor launcher resolves on Windows, where it is a
// .bat rather than an executable on PATH.
const child = spawn('meteor', ['run', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  shell: true,
});

child.on('error', (error) => {
  console.error(`Failed to start Meteor: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
