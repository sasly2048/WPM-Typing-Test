export const html = {
  name: 'html',
  rules: [
    { type: 'comment', regex: /<!--[\s\S]*?-->/ },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
    { type: 'keyword', regex: /<\/?[a-zA-Z0-9-]+/ },
    { type: 'operator', regex: /=|>|\/|<!DOCTYPE/ },
    { type: 'identifier', regex: /[a-zA-Z0-9-]+(?=\s*=)/ },
    { type: 'punctuation', regex: /[<>]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};