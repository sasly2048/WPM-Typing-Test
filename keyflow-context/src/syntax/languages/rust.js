export const rust = {
  name: 'rust',
  rules: [
    { type: 'comment', regex: /\/\/.*|\/\*[\s\S]*?\*\// },
    { type: 'string', regex: /"(?:\\.|[^"\\])*"/ },
    { type: 'keyword', regex: /\b(?:as|break|const|continue|crate|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|async|await|dyn)\b/ },
    { type: 'boolean', regex: /\b(?:true|false)\b/ },
    { type: 'number', regex: /\b(?:0x[a-fA-F0-9_]+|0o[0-7_]+|0b[01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?(?:f32|f64|i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize)?)\b/ },
    { type: 'class', regex: /[A-Z][a-zA-Z0-9_]*/ },
    { type: 'identifier', regex: /[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'operator', regex: /=>|[-+*\/%=<>!&|^~?:]+/ },
    { type: 'punctuation', regex: /[{}\[\]().,;]/ },
    { type: 'whitespace', regex: /\s+/ }
  ]
};