// CODEMAP
// role : src/*.js 를 단일 HTML 하나로 합치는 최소 번들러
// 핵심 : node build.mjs → dist/play.html
// 의존 : node 표준 라이브러리만
// 연관 : demo.a4room.com 배포용 산출물
// 주의 : import/export 문법만 걷어내는 방식이라, 소스에서 default export나
//        동적 import를 쓰기 시작하면 이 스크립트를 손봐야 한다.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ORDER = [
  'config', 'rng', 'state', 'viewport', 'input', 'player', 'tiger', 'arrow',
  'obstacle', 'sim', 'replay', 'fx', 'render', 'main'
];

const body = ORDER.map(name => {
  const src = readFileSync(`src/${name}.js`, 'utf8')
    .split('\n')
    .filter(l => !/^\s*import\s.*from\s+['"].*['"];?\s*$/.test(l))
    .map(l => l.replace(/^\s*export\s+(const|let|function|class)\s/, '$1 '))
    .join('\n');
  return `// ===== src/${name}.js =====\n${src}`;
}).join('\n\n');

const html = readFileSync('index.html', 'utf8')
  .replace('<script type="module" src="./src/main.js"></script>',
           `<script>\n"use strict";\n(function(){\n${body}\n})();\n</script>`);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/play.html', html);
console.log('dist/play.html', html.length, 'bytes');
