export const c = {
  name: 'c',
  rules: [
    { type: 'comment', regex: /\/\/.*|\/\*[\s\S]*?\*\// },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
    { type: 'keyword', regex: /\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/ },
    { type: 'number', regex: /\b(?:0[xX][0-9a-fA-F]+|0[0-7]*|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[fFlL]?)\b/ },
    { type: 'identifier', regex: /#[a-zA-Z0-9_]+|[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'operator', regex: /[-+*\/%=<>!&|^~?:]+|->/ },
    { type: 'punctuation', regex: /[{}\[\]().,;]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};