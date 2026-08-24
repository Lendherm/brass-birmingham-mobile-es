import fs from 'node:fs';

const dir = 'src/ui/theme';
const parts = [
  'variables.css',
  'base.css',
  'tutorial.css',
  'tutorial-coach.css',
  'strategy.css',
  'setup.css',
  'cards.css',
  'panels.css',
  'era-score.css',
  'board.css',
  'board-enhancements.css',
  'city-overlay.css',
  'tooltips.css',
  'training-hint.css',
  'mobile.css',
  'landscape.css',
  'forced-layout.css',
  'accessibility.css',
  'first-visit.css',
  'credits.css',
  'pwa.css',
];

const out = parts.map((f) => fs.readFileSync(`${dir}/${f}`, 'utf8').trim()).join('\n\n') + '\n';
fs.writeFileSync('src/ui/theme.css', out);
console.log('concatenated theme.css', out.length, 'bytes');
