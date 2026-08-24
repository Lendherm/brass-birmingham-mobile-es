import { spawnSync } from 'node:child_process';

process.env.GITHUB_PAGES = 'true';

function run(label, command, args) {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('concat theme', 'node', ['scripts/concat-theme.mjs']);
run('typecheck', 'npx', ['tsc', '-b']);
run('vite build (GitHub Pages)', 'npx', ['vite', 'build']);
