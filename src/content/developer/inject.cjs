const fs = require('fs');
const vm = require('vm');
const path = require('path');

const snippets = {};
for (const f of ['snippets.cjs', 'snippets-extra.cjs']) {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  const m = src.match(/module\.exports\s*=\s*([\s\S]*?)\s*;?\s*$/);
  if (!m) { console.error('no exports in', f); process.exit(1); }
  const obj = vm.runInThisContext('(' + m[1] + ')', { filename: f });
  Object.assign(snippets, obj);
}

const langsPath = path.join(__dirname, 'languages.js');
let src = fs.readFileSync(langsPath, 'utf8');

for (const [lang, list] of Object.entries(snippets)) {
  // Find the start of the language array by looking for the
  // top-level `  <lang>: [` at the start of a line.
  const startRe = new RegExp(`(^|\\n)  ${lang}: \\[`);
  const startMatch = src.match(startRe);
  if (!startMatch) {
    console.error(`language ${lang} not found in source file`);
    process.exit(1);
  }
  const startIdx = startMatch.index + startMatch[0].length;

  // Walk forward, tracking bracket depth. To avoid being confused
  // by `[]` or `{}` inside strings, template literals, or comments,
  // we maintain a simple state machine.
  let depth = 1;
  let endIdx = -1;
  let i = startIdx;
  let inString = null; // ', ", or `
  let inLineComment = false;
  let inBlockComment = false;
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      i++; continue;
    }
    if (inBlockComment) {
      if (c === '*' && n === '/') { inBlockComment = false; i += 2; continue; }
      i++; continue;
    }
    if (inString) {
      if (c === '\\') { i += 2; continue; }
      if (c === inString) { inString = null; i++; continue; }
      i++; continue;
    }
    // Not in string/comment
    if (c === '/' && n === '/') { inLineComment = true; i += 2; continue; }
    if (c === '/' && n === '*') { inBlockComment = true; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`') { inString = c; i++; continue; }
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
    i++;
  }
  if (endIdx < 0) {
    console.error(`unterminated array for ${lang}`);
    process.exit(1);
  }

  const rendered = list
    .map((s) => {
      const safeName = String(s.name).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      // Escape backslashes, backticks, and unescaped ${ in the
      // code so it can be embedded in a JS template literal.
      let safeCode = String(s.code).replace(/\\/g, '\\\\');
      // Escape any ${ that is not already preceded by an odd
      // number of backslashes.
      let out = '';
      for (let k = 0; k < safeCode.length; k++) {
        if (safeCode[k] === '$' && safeCode[k + 1] === '{') {
          let n = 0, j = k - 1;
          while (j >= 0 && safeCode[j] === '\\') { n++; j--; }
          if (n % 2 === 0) out += '\\';
        }
        out += safeCode[k];
      }
      safeCode = out.replace(/`/g, '\\`');
      return '    {\n' +
        `      id: '${s.id}',\n` +
        `      name: '${safeName}',\n` +
        `      code: \`${safeCode}\`\n` +
        '    }';
    })
    .join(',\n');

  // Insert before the closing ] of the existing array
  const before = src.slice(0, endIdx).replace(/,\s*$/, '').trimEnd();
  const after = src.slice(endIdx);
  src = before + ',\n' + rendered + '\n  ' + after;
}

fs.writeFileSync(langsPath, src);
const total = Object.values(snippets).reduce((s, a) => s + a.length, 0);
console.log('Injected', total, 'new snippets across', Object.keys(snippets).length, 'languages');
