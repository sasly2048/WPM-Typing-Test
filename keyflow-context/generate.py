import json
import os

base_dir = r'C:\Users\ragha\.gemini\antigravity\scratch\WPM-Typing-Test'

snippets = []
idx = 1

def add_snippets(lang, chunks):
    global idx
    for c in chunks:
        snippets.append({
            'id': idx,
            'text': c.strip(),
            'language': lang,
            'difficulty': 'medium'
        })
        idx += 1

add_snippets('javascript', [
    'function add(a, b) {\n  return a + b;\n}',
    'const arr = [1, 2, 3];\narr.map(x => x * 2);',
    'fetch("/api/data")\n  .then(res => res.json())\n  .then(data => console.log(data));',
    'const debounce = (fn, delay) => {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => fn(...args), delay);\n  };\n};',
    'class User {\n  constructor(name) {\n    this.name = name;\n  }\n}'
])

add_snippets('python', [
    'def fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)',
    'import os\n\nfor root, dirs, files in os.walk("."):\n    for name in files:\n        print(name)',
    'class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None',
    '[x * 2 for x in range(10) if x % 2 == 0]',
    'def count_words(text):\n    return len(text.split())'
])

add_snippets('java', [
    'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
    'List<String> list = new ArrayList<>();\nlist.add("Java");\nlist.add("is");\nlist.add("cool");',
    'public interface Animal {\n    void makeSound();\n}',
    'public int add(int a, int b) {\n    return a + b;\n}',
    'for (int i = 0; i < 10; i++) {\n    System.out.println(i);\n}'
])

add_snippets('c', [
    '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    'void swap(int *xp, int *yp) {\n    int temp = *xp;\n    *xp = *yp;\n    *yp = temp;\n}',
    'int fact(int n) {\n    if (n == 0) return 1;\n    return n * fact(n-1);\n}',
    'struct Point {\n    int x;\n    int y;\n};',
    'int arr[] = {1, 2, 3, 4, 5};\nint len = sizeof(arr)/sizeof(arr[0]);'
])

add_snippets('typescript', [
    'interface User {\n  name: string;\n  id: number;\n}\n\nconst user: User = {\n  name: "Hayes",\n  id: 0,\n};',
    'function logName(user: User) {\n  console.log(user.name);\n}',
    'type Result = "success" | "failure";',
    'class Generic<T> {\n  value: T;\n}',
    'const num: number = 42;'
])

add_snippets('rust', [
    'fn main() {\n    let mut x = 5;\n    x += 1;\n    println!("x is: {}", x);\n}',
    'struct User {\n    username: String,\n    email: String,\n    active: bool,\n}',
    'impl User {\n    fn new() -> Self {\n        User { ... }\n    }\n}',
    'enum IpAddr {\n    V4(String),\n    V6(String),\n}',
    'let v = vec![1, 2, 3];'
])

add_snippets('go', [
    'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, world!")\n}',
    'func add(x int, y int) int {\n    return x + y\n}',
    'type Vertex struct {\n    X int\n    Y int\n}',
    'm := make(map[string]int)',
    'go func() {\n    fmt.Println("async")\n}()'
])

add_snippets('html', [
    '<!DOCTYPE html>\n<html>\n<head>\n  <title>Page Title</title>\n</head>\n<body>\n  <h1>My First Heading</h1>\n  <p>My first paragraph.</p>\n</body>\n</html>',
    '<div class="container">\n  <header>Header</header>\n  <main>Main Content</main>\n  <footer>Footer</footer>\n</div>',
    '<form action="/submit" method="post">\n  <input type="text" name="user">\n  <button type="submit">Submit</button>\n</form>',
    '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>',
    '<img src="image.jpg" alt="Description" />'
])

add_snippets('css', [
    '.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n}',
    'body {\n  background-color: #f0f0f0;\n  font-family: Arial, sans-serif;\n}',
    'a:hover {\n  color: red;\n  text-decoration: underline;\n}',
    '@media (max-width: 600px) {\n  .container {\n    flex-direction: column;\n  }\n}',
    '#header {\n  position: sticky;\n  top: 0;\n}'
])

add_snippets('sql', [
    'SELECT * FROM Users WHERE age > 18 ORDER BY name ASC;',
    'INSERT INTO Customers (CustomerName, City)\nVALUES (\'Cardinal\', \'Stavanger\');',
    'UPDATE Customers SET ContactName = \'Alfred\' WHERE CustomerID = 1;',
    'DELETE FROM Customers WHERE CustomerName=\'Alfred\';',
    'CREATE TABLE Persons (\n    PersonID int,\n    LastName varchar(255)\n);'
])

add_snippets('bash', [
    '#!/bin/bash\n\nfor i in {1..5}\ndo\n  echo "Welcome $i times"\ndone',
    'if [ -f "$FILE" ]; then\n    echo "$FILE exists."\nfi',
    'echo "Hello World" > test.txt',
    'ls -la | grep "txt"',
    'export PATH=$PATH:/usr/local/bin'
])


os.makedirs(os.path.join(base_dir, 'src', 'data'), exist_ok=True)
with open(os.path.join(base_dir, 'src', 'data', 'code-snippets.json'), 'w') as f:
    json.dump(snippets, f, indent=2)

# syntax
syntax_dir = os.path.join(base_dir, 'src', 'syntax', 'languages')
os.makedirs(syntax_dir, exist_ok=True)

langs = {
    'java': """export const java = {
  name: 'java',
  rules: [
    { type: 'comment', regex: /\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\// },
    { type: 'string', regex: /"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'/ },
    { type: 'keyword', regex: /\\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while)\\b/ },
    { type: 'boolean', regex: /\\b(?:true|false)\\b/ },
    { type: 'null', regex: /\\bnull\\b/ },
    { type: 'number', regex: /\\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?[fFdD]?)\\b/ },
    { type: 'class', regex: /[A-Z][a-zA-Z0-9_$]*/ },
    { type: 'identifier', regex: /[a-zA-Z_$][a-zA-Z0-9_$]*/ },
    { type: 'operator', regex: /[-+*\\/%=<>!&|^~?:]+/ },
    { type: 'punctuation', regex: /[{}\\[\\]().,;]/ },
    { type: 'whitespace', regex: /\\s+/ }
  ]
};""",
    'rust': """export const rust = {
  name: 'rust',
  rules: [
    { type: 'comment', regex: /\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\// },
    { type: 'string', regex: /"(?:\\\\.|[^"\\\\])*"/ },
    { type: 'keyword', regex: /\\b(?:as|break|const|continue|crate|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|async|await|dyn)\\b/ },
    { type: 'boolean', regex: /\\b(?:true|false)\\b/ },
    { type: 'number', regex: /\\b(?:0x[a-fA-F0-9_]+|0o[0-7_]+|0b[01_]+|\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:[eE][+-]?\\d[\\d_]*)?(?:f32|f64|i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize)?)\\b/ },
    { type: 'class', regex: /[A-Z][a-zA-Z0-9_]*/ },
    { type: 'identifier', regex: /[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'operator', regex: /=>|[-+*\\/%=<>!&|^~?:]+/ },
    { type: 'punctuation', regex: /[{}\\[\\]().,;]/ },
    { type: 'whitespace', regex: /\\s+/ }
  ]
};""",
    'go': """export const go = {
  name: 'go',
  rules: [
    { type: 'comment', regex: /\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\// },
    { type: 'string', regex: /"(?:\\\\.|[^"\\\\])*"|`(?:[^`])*`|'(?:\\\\.|[^'\\\\])*'/ },
    { type: 'keyword', regex: /\\b(?:break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var)\\b/ },
    { type: 'boolean', regex: /\\b(?:true|false)\\b/ },
    { type: 'null', regex: /\\bnil\\b/ },
    { type: 'number', regex: /\\b(?:0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?i?)\\b/ },
    { type: 'class', regex: /[A-Z][a-zA-Z0-9_]*/ },
    { type: 'identifier', regex: /[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'operator', regex: /:=|[-+*\\/%=<>!&|^~?:]+/ },
    { type: 'punctuation', regex: /[{}\\[\\]().,;]/ },
    { type: 'whitespace', regex: /\\s+/ }
  ]
};""",
    'html': """export const html = {
  name: 'html',
  rules: [
    { type: 'comment', regex: /<!--[\\s\\S]*?-->/ },
    { type: 'string', regex: /"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'/ },
    { type: 'keyword', regex: /<\\/?[a-zA-Z0-9-]+/ },
    { type: 'operator', regex: /=|>|\\/|<!DOCTYPE/ },
    { type: 'identifier', regex: /[a-zA-Z0-9-]+(?=\\s*=)/ },
    { type: 'punctuation', regex: /[<>]/ },
    { type: 'whitespace', regex: /\\s+/ }
  ]
};""",
    'css': """export const css = {
  name: 'css',
  rules: [
    { type: 'comment', regex: /\\/\\*[\\s\\S]*?\\*\\// },
    { type: 'string', regex: /"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'/ },
    { type: 'keyword', regex: /@[a-zA-Z0-9-]+/ },
    { type: 'class', regex: /\\.[a-zA-Z0-9_-]+/ },
    { type: 'identifier', regex: /#[a-zA-Z0-9_-]+|[a-zA-Z0-9-]+(?=\\s*:)/ },
    { type: 'number', regex: /\\b\\d+(?:\\.\\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?\\b/ },
    { type: 'operator', regex: /[-+*\\/%=<>!:]+/ },
    { type: 'punctuation', regex: /[{}\\[\\]().,;]/ },
    { type: 'whitespace', regex: /\\s+/ }
  ]
};""",
    'sql': """export const sql = {
  name: 'sql',
  rules: [
    { type: 'comment', regex: /--.*|\\/\\*[\\s\\S]*?\\*\\// },
    { type: 'string', regex: /'(?:''|[^'])*'/ },
    { type: 'keyword', regex: /\\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|PRIMARY|KEY|FOREIGN|REFERENCES|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP|BY|ORDER|HAVING|ASC|DESC|LIMIT|OFFSET|AND|OR|NOT|IN|LIKE|IS|NULL|AS|DISTINCT)\\b/i },
    { type: 'number', regex: /\\b\\d+(?:\\.\\d+)?\\b/ },
    { type: 'identifier', regex: /[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'operator', regex: /[-+*\\/%=<>!&|^~]+/ },
    { type: 'punctuation', regex: /[().,;]/ },
    { type: 'whitespace', regex: /\\s+/ }
  ]
};""",
    'bash': """export const bash = {
  name: 'bash',
  rules: [
    { type: 'comment', regex: /#.*/ },
    { type: 'string', regex: /"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'/ },
    { type: 'keyword', regex: /\\b(?:if|then|else|elif|fi|for|while|in|do|done|case|esac|function|return|echo|read|set|export|source|alias)\\b/ },
    { type: 'identifier', regex: /\\$[a-zA-Z_][a-zA-Z0-9_]*|\\$\\{[^}]+\\}|\\$#|\\$@|\\$\\*|\\$\\?|\\$\\$/ },
    { type: 'number', regex: /\\b\\d+\\b/ },
    { type: 'operator', regex: /[-+*\\/%=<>!&|^~]+|\\||>>|>/ },
    { type: 'punctuation', regex: /[{}\\[\\]().,;]/ },
    { type: 'whitespace', regex: /\\s+/ }
  ]
};""",
    'c': """export const c = {
  name: 'c',
  rules: [
    { type: 'comment', regex: /\\/\\/.*|\\/\\*[\\s\\S]*?\\*\\// },
    { type: 'string', regex: /"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'/ },
    { type: 'keyword', regex: /\\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\\b/ },
    { type: 'number', regex: /\\b(?:0[xX][0-9a-fA-F]+|0[0-7]*|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?[fFlL]?)\\b/ },
    { type: 'identifier', regex: /#[a-zA-Z0-9_]+|[a-zA-Z_][a-zA-Z0-9_]*/ },
    { type: 'operator', regex: /[-+*\\/%=<>!&|^~?:]+|->/ },
    { type: 'punctuation', regex: /[{}\\[\\]().,;]/ },
    { type: 'whitespace', regex: /\\s+/ }
  ]
};"""
}

for lang, content in langs.items():
    with open(os.path.join(syntax_dir, f'{lang}.js'), 'w') as f:
        f.write(content)

content_dir = os.path.join(base_dir, 'src', 'content', 'developer')
os.makedirs(content_dir, exist_ok=True)

lang_content = {}

for lang in langs.keys():
    # Filter snippets for lang
    lang_snippets = [s for s in snippets if s['language'] == lang]
    
    js_snippets_str = []
    for s in lang_snippets:
        s_id = s['id']
        code_esc = s['text'].replace('`', '\\`')
        js_snippets_str.append(f"""    {{
      id: '{lang}-{s_id}',
      category: 'General',
      difficulty: 'Medium',
      code: `{code_esc}`
    }}""")
    
    snippets_array_str = ",\n".join(js_snippets_str)
    
    content = f"""export const {lang}Snippets = {{
  id: 'developer-{lang}',
  name: '{lang.capitalize()} Snippets',
  description: 'Practice real-world {lang.capitalize()} code.',
  type: 'code',
  language: '{lang}',
  snippets: [
{snippets_array_str}
  ]
}};
"""
    with open(os.path.join(content_dir, f'{lang}.js'), 'w') as f:
        f.write(content)
