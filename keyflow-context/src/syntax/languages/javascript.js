export const javascript = {
  name: 'javascript',
  rules: [
    { type: 'comment', regex: /\/\/.*|\/\*[\s\S]*?\*\// },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/ },
    { type: 'keyword', regex: /\b(?:const|let|var|function|return|if|else|for|while|class|import|export|default|switch|case|break|continue|try|catch|finally|throw|new|this|typeof|instanceof|void|delete|await|yield|async)\b/ },
    { type: 'boolean', regex: /\b(?:true|false)\b/ },
    { type: 'null', regex: /\bnull\b/ },
    { type: 'undefined', regex: /\bundefined\b/ },
    { type: 'number', regex: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/ },
    { type: 'function', regex: /[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/ },
    { type: 'class', regex: /[A-Z][a-zA-Z0-9_$]*/ },
    { type: 'identifier', regex: /[a-zA-Z_$][a-zA-Z0-9_$]*/ },
    { type: 'operator', regex: /=>|[-+*\/%=<>!&|^~?:]+/ },
    { type: 'punctuation', regex: /[{}()[\].,;]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};
