import fs from 'node:fs';

const lines = fs.readFileSync('src/ui/theme.css', 'utf8').split(/\r?\n/);
const chunks = [
  ['variables.css', 0, 122],
  ['base.css', 122, 424],
  ['tutorial.css', 424, 571],
  ['tutorial-coach.css', 571, 659],
  ['strategy.css', 659, 745],
  ['setup.css', 745, 877],
  ['cards.css', 877, 1068],
  ['panels.css', 1068, 1366],
  ['board.css', 1366, 1436],
  ['mobile.css', 1436, lines.length],
];

fs.mkdirSync('src/ui/theme', { recursive: true });
for (const [name, start, end] of chunks) {
  fs.writeFileSync(`src/ui/theme/${name}`, `${lines.slice(start, end).join('\n').trim()}\n`);
}

const index = [
  ...chunks.map(([name]) => `@import './${name}';`),
  "@import './accessibility.css';",
  "@import './first-visit.css';",
].join('\n');
fs.writeFileSync('src/ui/theme/index.css', `${index}\n`);
console.log('split ok');
