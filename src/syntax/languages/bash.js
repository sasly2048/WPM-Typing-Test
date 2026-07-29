export const bash = {
  name: 'bash',
  rules: [
    { type: 'comment', regex: /#.*/ },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/ },
    { type: 'keyword', regex: /\b(?:if|then|else|elif|fi|for|while|in|do|done|case|esac|function|return|echo|read|set|export|source|alias)\b/ },
    { type: 'identifier', regex: /\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{[^}]+\}|\$#|\$@|\$\*|\$\?|\$\$/ },
    { type: 'number', regex: /\b\d+\b/ },
    { type: 'operator', regex: /[-+*\/%=<>!&|^~]+|\||>>|>/ },
    { type: 'punctuation', regex: /[{}\[\]().,;]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};