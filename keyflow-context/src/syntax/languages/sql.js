export const sql = {
  name: 'sql',
  rules: [
    { type: 'comment', regex: /--.*|\/\*[\s\S]*?\*\// },
    { type: 'string', regex: /'(?:''|[^'])*'/ },
    { type: 'keyword', regex: /\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|PRIMARY|KEY|FOREIGN|REFERENCES|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP|BY|ORDER|HAVING|ASC|DESC|LIMIT|OFFSET|AND|OR|NOT|IN|LIKE|IS|NULL|AS|DISTINCT)\b/i },
    { type: 'number', regex: /\b\d+(?:\.\d+)?\b/ },
    { type: 'identifier', regex: /[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'operator', regex: /[-+*\/%=<>!&|^~]+/ },
    { type: 'punctuation', regex: /[().,;]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};