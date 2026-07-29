export const css = {
  name: 'css',
  rules: [
    { type: 'comment', regex: /\/\*[\s\S]*?\*\// },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
    { type: 'keyword', regex: /@[a-zA-Z0-9-]+/ },
    { type: 'class', regex: /\.[a-zA-Z0-9_-]+/ },
    { type: 'identifier', regex: /#[a-zA-Z0-9_-]+|[a-zA-Z0-9-]+(?=\s*:)/ },
    { type: 'number', regex: /\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?\b/ },
    { type: 'operator', regex: /[-+*\/%=<>!:]+/ },
    { type: 'punctuation', regex: /[{}\[\]().,;]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};