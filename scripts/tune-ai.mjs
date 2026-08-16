import { tuneEvalWeights, formatEvalWeights } from '../src/engine/ai/selfPlayTune.ts';

const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
const result = tuneEvalWeights(seeds, 40);

console.log('Baseline score:', result.baselineScore.toFixed(2));
console.log('Tuned score:', result.score.toFixed(2));
console.log('Improved:', result.improved);
console.log('\nTUNED_EVAL_WEIGHTS:');
console.log(formatEvalWeights(result.weights));
