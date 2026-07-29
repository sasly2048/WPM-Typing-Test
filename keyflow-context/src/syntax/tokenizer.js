import { javascript } from './languages/javascript.js';
import { python } from './languages/python.js';
import { java } from './languages/java.js';
import { rust } from './languages/rust.js';
import { go } from './languages/go.js';
import { html } from './languages/html.js';
import { css } from './languages/css.js';
import { sql } from './languages/sql.js';
import { bash } from './languages/bash.js';
import { c } from './languages/c.js';
import { typescript } from './languages/typescript.js';

export const LANGUAGES = {
  javascript,
  python,
  java,
  rust,
  go,
  html,
  css,
  sql,
  bash,
  c,
  typescript,
  // map common aliases
  js: javascript,
  py: python,
  ts: typescript,
  'c++': c,
  cpp: c
};

export function tokenize(code, languageDef) {
  if (typeof code !== 'string') return [];
  if (!code) return [];

  // If a string is passed, look it up in the registry
  if (typeof languageDef === 'string') {
    languageDef = LANGUAGES[languageDef.toLowerCase()] || LANGUAGES.javascript;
  }

  if (!languageDef) return [];

  if (!languageDef._compiled) {
    const parts = languageDef.rules.map((rule, i) => `(?<g${i}>${rule.regex.source})`);
    // 'y' flag ensures the regex matches exactly from the lastIndex
    languageDef._compiled = new RegExp(parts.join('|'), 'y');
  }

  const tokens = [];
  const regex = languageDef._compiled;
  regex.lastIndex = 0;

  let currentPos = 0;

  while (currentPos < code.length) {
    regex.lastIndex = currentPos;
    const match = regex.exec(code);

    if (match) {
      for (let i = 0; i < languageDef.rules.length; i++) {
        if (match.groups[`g${i}`] !== undefined) {
          tokens.push({
            type: languageDef.rules[i].type,
            value: match[0],
          });
          break;
        }
      }
      currentPos = regex.lastIndex;
    } else {
      // No match found at current position, consume 1 character as 'text'
      const lastToken = tokens[tokens.length - 1];
      if (lastToken && lastToken.type === 'text') {
        lastToken.value += code[currentPos];
      } else {
        tokens.push({ type: 'text', value: code[currentPos] });
      }
      currentPos++;
    }
  }

  return tokens;
}
