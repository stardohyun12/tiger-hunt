import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { INPUT_KEY } from '../src/config.js';
import { createState } from '../src/state.js';
import { rngFromSeed, rngNext, rngRange } from '../src/rng.js';
import { updateSimulation } from '../src/sim.js';
import { deserialize, hashState, playback, record, serialize } from '../src/replay.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function generatedInputs(seed, frameCount) {
  let rng = rngFromSeed(seed);
  let charging = false;
  const inputs = [];

  for (let f = 0; f < frameCount; f++) {
    let next = rngNext(rng);
    rng = next.state;
    const bits = next.value;
    let k = 0;
    if (bits & 1) k |= INPUT_KEY.W;
    if (bits & 2) k |= INPUT_KEY.S;
    if (bits & 4) k |= INPUT_KEY.A;
    if (bits & 8) k |= INPUT_KEY.D;

    next = rngRange(rng, 80, 620);
    rng = next.state;
    const ax = next.value;
    next = rngRange(rng, 240, 440);
    rng = next.state;
    const ay = next.value;

    next = rngNext(rng);
    rng = next.state;
    let c = 0;
    if (!charging && next.value % 71 === 0) {
      charging = true;
      c = 1;
    } else if (charging && next.value % 29 === 0) {
      charging = false;
      c = 2;
    }
    inputs.push({ f, k, ax, ay, c });
  }
  return inputs;
}

function run(seed, inputs, shouldRecord = false) {
  const S = createState(seed);
  S.phase = 'play';
  for (const input of inputs) {
    if (S.phase !== 'play') break;
    if (shouldRecord) record(S, input);
    updateSimulation(S, input);
  }
  return S;
}

test('같은 시드와 입력열은 100개 시드에서 같은 상태 해시를 만든다', () => {
  const inputs = generatedInputs(0x51f15eed, 720);
  for (let seed = 1; seed <= 100; seed++) {
    assert.equal(hashState(run(seed, inputs)), hashState(run(seed, inputs)), `seed ${seed}`);
  }
});

test('리플레이 직렬화 왕복 뒤 재생 결과가 원본과 일치한다', () => {
  const inputs = generatedInputs(0xc0decafe, 1200);
  const original = run(20260819, inputs, true);
  const encoded = serialize(original.replay);
  assert.match(encoded, /^[-\d,\[\]]+$/, '직렬화 payload는 정수만 포함해야 한다');
  const replayed = playback(deserialize(encoded));
  assert.equal(hashState(replayed), hashState(original));
});

function stripCommentsAndStrings(source) {
  let output = '';
  let mode = 'code';
  let quote = '';
  let templateExpressionDepth = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];
    if (mode === 'code') {
      if (templateExpressionDepth && char === '{') {
        templateExpressionDepth++; output += char;
      } else if (templateExpressionDepth && char === '}') {
        templateExpressionDepth--; output += ' ';
        if (!templateExpressionDepth) mode = 'template';
      } else if (char === '/' && next === '/') { mode = 'lineComment'; output += '  '; i++; }
      else if (char === '/' && next === '*') { mode = 'blockComment'; output += '  '; i++; }
      else if (char === "'" || char === '"') {
        mode = 'string'; quote = char; output += ' ';
      } else if (char === '`') {
        mode = 'template'; output += ' ';
      } else output += char;
    } else if (mode === 'lineComment') {
      if (char === '\n') { mode = 'code'; output += '\n'; }
      else output += ' ';
    } else if (mode === 'blockComment') {
      if (char === '*' && next === '/') { mode = 'code'; output += '  '; i++; }
      else output += char === '\n' ? '\n' : ' ';
    } else if (mode === 'template') {
      if (char === '\\') {
        output += ' ';
        output += next === '\n' ? '\n' : ' ';
        i++;
      } else if (char === '`') {
        mode = 'code'; output += ' ';
      } else if (char === '$' && next === '{') {
        mode = 'code'; templateExpressionDepth = 1; output += '  '; i++;
      } else output += char === '\n' ? '\n' : ' ';
    } else if (char === '\\') {
      output += ' ';
      if (next === '\n') output += '\n';
      else output += ' ';
      i++;
    } else if (char === quote) {
      mode = 'code'; output += ' ';
    } else output += char === '\n' ? '\n' : ' ';
  }
  return output;
}

test('sim 소스에는 비결정적 API와 금지 수학 연산이 없다', () => {
  const files = [
    'config.js', 'state.js', 'player.js', 'tiger.js', 'arrow.js',
    'obstacle.js', 'target.js', 'rng.js', 'sim.js', 'replay.js'
  ];
  const patterns = [
    ['Math.random', /\bMath\.random\b/g],
    ['Date.now', /\bDate\.now\b/g],
    ['performance.now', /\bperformance\.now\b/g],
    ['document', /\bdocument\b/g],
    ['window', /\bwindow\b/g],
    ['localStorage', /\blocalStorage\b/g],
    ['fetch', /\bfetch\b/g],
    ['금지 Math 함수', /\bMath\.(?:sin|cos|tan|asin|acos|atan|atan2|pow|exp|log|hypot|cbrt)\b/g],
    ['** 연산자', /\*\*/g]
  ];
  const violations = [];

  for (const file of files) {
    const source = stripCommentsAndStrings(readFileSync(join(ROOT, 'src', file), 'utf8'));
    for (const [label, pattern] of patterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        const line = source.slice(0, match.index).split('\n').length;
        violations.push(`${file}:${line}: ${label}`);
      }
    }
  }
  assert.deepEqual(violations, [], violations.join('\n'));
});
