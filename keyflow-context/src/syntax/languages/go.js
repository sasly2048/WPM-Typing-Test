export const go = {
  name: 'go',
  rules: [
    { type: 'comment', regex: /\/\/.*|\/\*[\s\S]*?\*\// },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|`(?:[^`])*`|'(?:\\.|[^'\\])*'/ },
    { type: 'keyword', regex: /\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/ },
    { type: 'boolean', regex: /\b(?:true|false)\b/ },
    { type: 'null', regex: /\bnil\b/ },
    { type: 'number', regex: /\b(?:0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?i?)\b/ },
    { type: 'class', regex: /[A-Z][a-zA-Z0-9_]*/ },
    { type: 'identifier', regex: /[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'operator', regex: /:=|[-+*\/%=<>!&|^~?:]+/ },
    { type: 'punctuation', regex: /[{}\[\]().,;]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};