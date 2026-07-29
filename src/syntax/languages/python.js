export const python = {
  name: 'python',
  rules: [
    { type: 'comment', regex: /#.*/ },
    { type: 'string', regex: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
    { type: 'keyword', regex: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case)\b/ },
    { type: 'boolean', regex: /\b(?:True|False)\b/ },
    { type: 'null', regex: /\bNone\b/ },
    { type: 'number', regex: /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:[jJ])?)\b/ },
    { type: 'decorator', regex: /@[a-zA-Z_]\w*/ },
    { type: 'function', regex: /[a-zA-Z_]\w*(?=\s*\()/ },
    { type: 'class', regex: /[A-Z]\w*/ },
    { type: 'identifier', regex: /[a-zA-Z_]\w*/ },
    { type: 'operator', regex: /\/\/|\*\*|[-+*\/%=<>!&|^~]+/ },
    { type: 'punctuation', regex: /[{}()[\].,;:]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};
