/**
 * Extra named snippets for the Developer Mode pool.
 *
 * Each snippet has id (unique), name (program title used as filename
 * in the editor tab and breadcrumb), and code. All snippets are real
 * working programs in their language — no placeholders.
 *
 * Used by inject.cjs to inject into src/content/developer/languages.js.
 */
module.exports = {
  javascript: [
    { id: 'js-debounce', name: 'Debounce Utility', code: `function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const log = debounce((msg) => console.log(msg), 200);
log('hello');
log('world');
log('!');` },
    { id: 'js-event-emitter', name: 'Event Emitter', code: `class EventEmitter {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push(callback);
    return this;
  }

  emit(event, ...args) {
    for (const cb of this.#listeners.get(event) || []) cb(...args);
  }
}

const bus = new EventEmitter();
bus.on('login', (user) => console.log('Welcome', user));
bus.emit('login', 'Ada');` },
    { id: 'js-fetch-retry', name: 'Fetch With Retry', code: `async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Status ' + response.status);
      return response.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, attempt * 200));
    }
  }
}

const data = await fetchWithRetry('/api/users');
console.log(data);` },
    { id: 'js-memoize', name: 'Memoization Cache', code: `function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const slowSquare = memoize((n) => n * n);
console.log(slowSquare(5));
console.log(slowSquare(5));` },
    { id: 'js-group-by', name: 'Group By Key', code: `function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    (groups[key] = groups[key] || []).push(item);
    return groups;
  }, {});
}

const people = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Carol', age: 30 },
];
const byAge = groupBy(people, (p) => p.age);
console.log(byAge);` },
    { id: 'js-singly-linked-list', name: 'Singly Linked List', code: `class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor() { this.head = null; }

  append(value) {
    const node = new Node(value);
    if (!this.head) { this.head = node; return; }
    let cur = this.head;
    while (cur.next) cur = cur.next;
    cur.next = node;
  }

  toArray() {
    const out = [];
    let cur = this.head;
    while (cur) { out.push(cur.value); cur = cur.next; }
    return out;
  }
}

const list = new LinkedList();
list.append(1);
list.append(2);
list.append(3);
console.log(list.toArray());` },
    { id: 'js-priority-queue', name: 'Priority Queue', code: `class PriorityQueue {
  constructor() { this.values = []; }

  enqueue(value, priority) {
    this.values.push({ value, priority });
    this.values.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.values.shift()?.value;
  }
}

const pq = new PriorityQueue();
pq.enqueue('low', 3);
pq.enqueue('high', 1);
pq.enqueue('medium', 2);
console.log(pq.dequeue());` },
    { id: 'js-lru-cache', name: 'LRU Cache', code: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }
}

const cache = new LRUCache(2);
cache.put('a', 1);
cache.put('b', 2);
console.log(cache.get('a'));` },
    { id: 'js-deep-clone', name: 'Deep Clone', code: `function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    copy[key] = deepClone(value[key], seen);
  }
  return copy;
}

const original = { a: 1, b: { c: 2 } };
const clone = deepClone(original);
clone.b.c = 99;
console.log(original.b.c, clone.b.c);` },
    { id: 'js-csv-parser', name: 'CSV Parser', code: `function parseCSV(text, delimiter = ',') {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === delimiter) { row.push(field); field = ''; }
      else if (c === '\\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  row.push(field); rows.push(row);
  return rows;
}

console.log(parseCSV('a,b,c\\n1,2,3'));` },
    { id: 'js-throttle', name: 'Throttle Function', code: `function throttle(fn, wait) {
  let last = 0, pending = null;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    } else {
      clearTimeout(pending);
      pending = setTimeout(() => {
        last = Date.now();
        fn.apply(this, args);
      }, wait - (now - last));
    }
  };
}

const log = throttle((msg) => console.log(msg), 200);
log('a'); log('b'); log('c');` },
    { id: 'js-pipe', name: 'Function Pipe', code: `const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const trim = (s) => s.trim();
const upper = (s) => s.toUpperCase();
const exclaim = (s) => s + '!';

const shout = pipe(trim, upper, exclaim);
console.log(shout('  hello  '));` },
  ],

  typescript: [
    { id: 'ts-debounce', name: 'Debounce (TS)', code: `function debounce<T extends (...args: any[]) => void>(
  fn: T, delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const log = debounce((msg: string) => console.log(msg), 200);
log('hello');
log('world');
log('!');` },
    { id: 'ts-result-type', name: 'Result Type', code: `type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: new Error('Division by zero') };
  return { ok: true, value: a / b };
}

const r = divide(10, 2);
if (r.ok) console.log(r.value);` },
    { id: 'ts-discriminated-union', name: 'Discriminated Union', code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.radius * s.radius;
    case 'rectangle': return s.width * s.height;
  }
}

console.log(area({ kind: 'circle', radius: 2 }));
console.log(area({ kind: 'rectangle', width: 3, height: 4 }));` },
    { id: 'ts-generic-repo', name: 'Generic Repository', code: `interface Entity { id: string; }

class Repository<T extends Entity> {
  private items = new Map<string, T>();

  save(entity: T): T {
    this.items.set(entity.id, entity);
    return entity;
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  all(): T[] {
    return Array.from(this.items.values());
  }
}

interface User extends Entity { name: string; email: string; }
const users = new Repository<User>();
users.save({ id: '1', name: 'Ada', email: 'ada@example.com' });
console.log(users.findById('1'));` },
    { id: 'ts-utility-types', name: 'Utility Types', code: `interface User { id: number; name: string; email: string; age: number; }

type PublicUser = Omit<User, 'email' | 'age'>;
type UserPatch = Partial<Pick<User, 'name' | 'email'>>;

const safe: PublicUser = { id: 1, name: 'Ada' };
const patch: UserPatch = { name: 'Grace' };
console.log(safe, patch);` },
    { id: 'ts-decorator', name: 'Method Decorator', code: `function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log('Call:', key, args);
    return original.apply(this, args);
  };
  return descriptor;
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}

new Calculator().add(2, 3);` },
    { id: 'ts-async-task', name: 'Async Task Queue', code: `type Task<T> = () => Promise<T>;

class TaskQueue {
  private queue: Task<unknown>[] = [];
  private running = false;

  add<T>(task: Task<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try { resolve(await task()); } catch (e) { reject(e); }
      });
      this.flush();
    });
  }

  private async flush() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length) {
      const t = this.queue.shift()!;
      await t();
    }
    this.running = false;
  }
}

const q = new TaskQueue();
await q.add(async () => 42);
console.log('done');` },
    { id: 'ts-deep-readonly', name: 'Deep Readonly', code: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

interface Config { db: { url: string; pool: number; }; app: { name: string }; }

const c: DeepReadonly<Config> = {
  db: { url: 'postgres://', pool: 10 },
  app: { name: 'KeyFlow' },
};

console.log(c.db.url);` },
    { id: 'ts-event-bus', name: 'Typed Event Bus', code: `type EventMap = {
  login: { user: string };
  logout: { reason: string };
};

class EventBus<M extends Record<string, unknown>> {
  private listeners = new Map<keyof M, Set<(p: any) => void>>();

  on<E extends keyof M>(event: E, fn: (p: M[E]) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  emit<E extends keyof M>(event: E, payload: M[E]) {
    for (const fn of this.listeners.get(event) || []) fn(payload);
  }
}

const bus = new EventBus<EventMap>();
bus.on('login', (p) => console.log('hi', p.user));
bus.emit('login', { user: 'Ada' });` },
    { id: 'ts-zod-validator', name: 'Schema Validator', code: `type Schema<T> = (input: unknown) => T | string;

const stringSchema: Schema<string> = (input) =>
  typeof input === 'string' ? input : 'Expected string';

const numberSchema: Schema<number> = (input) =>
  typeof input === 'number' ? input : 'Expected number';

const validate = <T>(s: Schema<T>, v: unknown): T | null => {
  const r = s(v);
  return typeof r === 'string' ? null : r;
};

console.log(validate(stringSchema, 'hello'));
console.log(validate(numberSchema, 42));` },
  ],

  python: [
    { id: 'py-decorator', name: 'Timing Decorator', code: `import time
from functools import wraps

def timing(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f'{func.__name__} took {elapsed:.4f}s')
        return result
    return wrapper

@timing
def slow():
    return sum(range(1_000_000))

slow()` },
    { id: 'py-context-manager', name: 'Context Manager', code: `from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f'{label}: {elapsed:.3f}s')

with timer('compute'):
    total = sum(range(1_000_000))` },
    { id: 'py-dataclass', name: 'Dataclass Model', code: `from dataclasses import dataclass, field

@dataclass
class Task:
    title: str
    priority: int = 1
    tags: list = field(default_factory=list)

    def is_urgent(self) -> bool:
        return self.priority >= 3

t = Task('Ship release', priority=3, tags=['prod'])
print(t.is_urgent())` },
    { id: 'py-fstring-debug', name: 'F-String Debug', code: `def calculate_total(items, tax_rate):
    subtotal = sum(item.price for item in items)
    tax = subtotal * tax_rate
    total = subtotal + tax
    print(f'{subtotal=}, {tax_rate=}, {total=}')
    return total

calculate_total([
    type('Item', (), {'price': 10})(),
    type('Item', (), {'price': 20})(),
], 0.2)` },
    { id: 'py-match-statement', name: 'Match Statement', code: `def handle_response(response):
    match response:
        case {'status': 200, 'data': data}:
            return f'OK: {data}'
        case {'status': 404}:
            return 'Not found'
        case {'status': code}:
            return f'Error {code}'
        case _:
            return 'Unknown'

print(handle_response({'status': 200, 'data': 'hello'}))` },
    { id: 'py-async-task', name: 'Async Task Queue', code: `import asyncio

async def worker(name, delay):
    await asyncio.sleep(delay)
    return f'{name} done'

async def main():
    tasks = [
        asyncio.create_task(worker('A', 0.1)),
        asyncio.create_task(worker('B', 0.2)),
        asyncio.create_task(worker('C', 0.05)),
    ]
    return await asyncio.gather(*tasks)

results = await main()
print(results)` },
    { id: 'py-property', name: 'Computed Property', code: `class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    @property
    def area(self):
        return self.width * self.height

    @property
    def perimeter(self):
        return 2 * (self.width + self.height)

r = Rectangle(3, 4)
print(r.area, r.perimeter)` },
    { id: 'py-counter', name: 'Counter (Defaultdict)', code: `from collections import Counter, defaultdict

words = 'the quick brown fox jumps over the lazy dog'.split()
counts = Counter(words)
print(counts.most_common(3))

groups = defaultdict(list)
for word in words:
    groups[len(word)].append(word)
print(dict(groups))` },
    { id: 'py-pathlib', name: 'Pathlib File Ops', code: `from pathlib import Path

p = Path('src')
for f in sorted(p.glob('**/*.js')):
    print(f.stat().st_size, f)

home = Path.home()
docs = home / 'Documents'
docs.mkdir(exist_ok=True)
print(docs.exists())` },
    { id: 'py-threadpool', name: 'ThreadPoolExecutor', code: `from concurrent.futures import ThreadPoolExecutor
import urllib.request

def fetch(url):
    with urllib.request.urlopen(url, timeout=5) as r:
        return len(r.read())

urls = ['https://example.com', 'https://example.org', 'https://example.net']
with ThreadPoolExecutor(max_workers=3) as pool:
    sizes = list(pool.map(fetch, urls))
print(sizes)` },
  ],

  c: [
    { id: 'c-bubble-sort', name: 'Bubble Sort', code: `void bubble_sort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
        }
    }
}

int main(void) {
    int arr[] = { 5, 2, 8, 1, 9, 3 };
    int n = sizeof(arr) / sizeof(arr[0]);
    bubble_sort(arr, n);
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    return 0;
}` },
    { id: 'c-linked-list', name: 'Linked List', code: `#include <stdio.h>
#include <stdlib.h>

struct Node { int data; struct Node* next; };

struct Node* create_node(int value) {
    struct Node* n = (struct Node*)malloc(sizeof(struct Node));
    n->data = value;
    n->next = NULL;
    return n;
}

void append(struct Node** head, int value) {
    struct Node* n = create_node(value);
    if (!*head) { *head = n; return; }
    struct Node* cur = *head;
    while (cur->next) cur = cur->next;
    cur->next = n;
}

int main(void) {
    struct Node* list = NULL;
    append(&list, 1); append(&list, 2); append(&list, 3);
    for (struct Node* c = list; c; c = c->next) printf("%d ", c->data);
    printf("\\n");
    return 0;
}` },
    { id: 'c-stack', name: 'Stack (Array)', code: `#include <stdio.h>

#define MAX 100
int stack[MAX];
int top = -1;

void push(int x) { if (top < MAX - 1) stack[++top] = x; }
int pop(void) { return top >= 0 ? stack[top--] : -1; }
int peek(void) { return top >= 0 ? stack[top] : -1; }

int main(void) {
    push(1); push(2); push(3);
    printf("%d\\n", pop());
    printf("%d\\n", peek());
    return 0;
}` },
    { id: 'c-hash-table', name: 'Hash Table (Chaining)', code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define BUCKETS 16

typedef struct Entry { char* key; int value; struct Entry* next; } Entry;

typedef struct {
    Entry* buckets[BUCKETS];
} HashMap;

unsigned int hash(const char* s) {
    unsigned int h = 5381;
    while (*s) h = h * 33 + (unsigned char)*s++;
    return h % BUCKETS;
}

void put(HashMap* m, const char* k, int v) {
    unsigned int h = hash(k);
    Entry* e = m->buckets[h];
    while (e) { if (strcmp(e->key, k) == 0) { e->value = v; return; } e = e->next; }
    e = (Entry*)malloc(sizeof(Entry));
    e->key = strdup(k); e->value = v; e->next = m->buckets[h];
    m->buckets[h] = e;
}

int main(void) {
    HashMap m = {0};
    put(&m, "alice", 1); put(&m, "bob", 2);
    printf("%d\\n", m.buckets[hash("alice")]->value);
    return 0;
}` },
    { id: 'c-quicksort', name: 'Quicksort', code: `#include <stdio.h>

void swap(int* a, int* b) { int t = *a; *a = *b; *b = t; }

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(&arr[i], &arr[j]);
        }
    }
    swap(&arr[i + 1], &arr[high]);
    return i + 1;
}

void quicksort(int arr[], int low, int high) {
    if (low < high) {
        int p = partition(arr, low, high);
        quicksort(arr, low, p - 1);
        quicksort(arr, p + 1, high);
    }
}

int main(void) {
    int arr[] = { 10, 7, 8, 9, 1, 5 };
    int n = sizeof(arr) / sizeof(arr[0]);
    quicksort(arr, 0, n - 1);
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    return 0;
}` },
    { id: 'c-string-reverse', name: 'In-Place String Reverse', code: `#include <stdio.h>
#include <string.h>

void reverse(char* str) {
    int left = 0;
    int right = strlen(str) - 1;
    while (left < right) {
        char tmp = str[left];
        str[left] = str[right];
        str[right] = tmp;
        left++; right--;
    }
}

int main(void) {
    char s[] = "hello world";
    reverse(s);
    printf("%s\\n", s);
    return 0;
}` },
    { id: 'c-file-read', name: 'Read File Line by Line', code: `#include <stdio.h>

int main(void) {
    FILE* f = fopen("data/paragraphs.json", "r");
    if (!f) { perror("fopen"); return 1; }
    char line[512];
    int n = 0;
    while (fgets(line, sizeof(line), f)) n++;
    fclose(f);
    printf("lines: %d\\n", n);
    return 0;
}` },
    { id: 'c-dynamic-array', name: 'Dynamic Array (Realloc)', code: `#include <stdio.h>
#include <stdlib.h>

int* push(int* arr, int* n, int* cap, int v) {
    if (*n == *cap) {
        *cap = *cap ? *cap * 2 : 4;
        arr = realloc(arr, *cap * sizeof(int));
    }
    arr[(*n)++] = v;
    return arr;
}

int main(void) {
    int* arr = NULL, n = 0, cap = 0;
    for (int i = 0; i < 10; i++) arr = push(arr, &n, &cap, i * i);
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    free(arr);
    return 0;
}` },
    { id: 'c-binary-search', name: 'Binary Search', code: `#include <stdio.h>

int binary_search(const int* arr, int n, int target) {
    int low = 0, high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main(void) {
    int arr[] = { 2, 5, 8, 12, 16, 23, 38, 56, 72, 91 };
    int n = sizeof(arr) / sizeof(arr[0]);
    printf("%d\\n", binary_search(arr, n, 23));
    return 0;
}` },
  ],

  cpp: [
    { id: 'cpp-vector', name: 'Vector Operations', code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = { 5, 2, 8, 1, 9, 3 };
    std::sort(numbers.begin(), numbers.end());
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;
    return 0;
}` },
    { id: 'cpp-smart-pointer', name: 'Smart Pointer Buffer', code: `#include <iostream>
#include <memory>
#include <stdexcept>

std::unique_ptr<int[]> allocate_buffer(size_t size) {
    if (size == 0) throw std::invalid_argument("size must be positive");
    return std::make_unique<int[]>(size);
}

int main() {
    auto buf = allocate_buffer(5);
    for (size_t i = 0; i < 5; i++) buf[i] = (int)(i * i);
    for (size_t i = 0; i < 5; i++) std::cout << buf[i] << " ";
    std::cout << std::endl;
    return 0;
}` },
    { id: 'cpp-template', name: 'Generic Clamp', code: `#include <iostream>
#include <algorithm>

template <typename T>
T clamp(T value, T low, T high) {
    return std::max(low, std::min(value, high));
}

int main() {
    std::cout << clamp(15, 0, 10) << std::endl;
    std::cout << clamp(-3, 0, 10) << std::endl;
    return 0;
}` },
    { id: 'cpp-class', name: 'Timer Class', code: `#include <iostream>
#include <chrono>

class Timer {
public:
    Timer() : start_(std::chrono::steady_clock::now()) {}
    double elapsed_ms() const {
        auto end = std::chrono::steady_clock::now();
        return std::chrono::duration<double, std::milli>(end - start_).count();
    }
private:
    std::chrono::steady_clock::time_point start_;
};

int main() {
    Timer t;
    long s = 0;
    for (int i = 0; i < 1000000; i++) s += i;
    std::cout << "sum=" << s << " took " << t.elapsed_ms() << "ms" << std::endl;
    return 0;
}` },
    { id: 'cpp-quicksort', name: 'Quicksort Partition', code: `#include <vector>
#include <utility>
#include <iostream>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

int main() {
    std::vector<int> v = { 10, 7, 8, 9, 1, 5 };
    int p = partition(v, 0, (int)v.size() - 1);
    std::cout << "pivot index: " << p << std::endl;
    return 0;
}` },
    { id: 'cpp-map-count', name: 'Word Frequency Map', code: `#include <iostream>
#include <unordered_map>
#include <string>
#include <sstream>

int main() {
    std::stringstream ss("the quick brown fox jumps over the lazy dog");
    std::unordered_map<std::string, int> counts;
    std::string word;
    while (ss >> word) counts[word]++;

    for (const auto& [k, v] : counts) {
        std::cout << k << ": " << v << std::endl;
    }
    return 0;
}` },
    { id: 'cpp-lambda', name: 'Sort with Lambda', code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> v = { 5, 2, 8, 1, 9, 3 };
    std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });
    for (int x : v) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
}` },
    { id: 'cpp-shared-ptr', name: 'Shared Pointer Graph', code: `#include <iostream>
#include <memory>
#include <vector>

struct Node {
    int value;
    std::vector<std::shared_ptr<Node>> next;
    Node(int v) : value(v) {}
};

int main() {
    auto a = std::make_shared<Node>(1);
    auto b = std::make_shared<Node>(2);
    auto c = std::make_shared<Node>(3);
    a->next = { b, c };
    std::cout << a->next[0]->value << std::endl;
    std::cout << a->next[1]->value << std::endl;
    return 0;
}` },
    { id: 'cpp-variant', name: 'Variant Visitor', code: `#include <iostream>
#include <variant>
#include <string>

int main() {
    std::variant<int, double, std::string> v = 42;
    std::visit([](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, int>) std::cout << "int: " << arg;
        else if constexpr (std::is_same_v<T, double>) std::cout << "double: " << arg;
        else std::cout << "string: " << arg;
    }, v);
    std::cout << std::endl;
    return 0;
}` },
    { id: 'cpp-thread-pool', name: 'Thread Pool', code: `#include <iostream>
#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <vector>

class ThreadPool {
public:
    ThreadPool(size_t n) {
        for (size_t i = 0; i < n; ++i)
            workers_.emplace_back([this]{ worker_loop(); });
    }
    ~ThreadPool() {
        { std::lock_guard<std::mutex> l(m_); stop_ = true; }
        cv_.notify_all();
        for (auto& t : workers_) t.join();
    }
    void submit(std::function<void()> f) {
        { std::lock_guard<std::mutex> l(m_); q_.push(std::move(f)); }
        cv_.notify_one();
    }
private:
    void worker_loop() {
        while (true) {
            std::function<void()> f;
            { std::unique_lock<std::mutex> l(m_); cv_.wait(l, [&]{ return stop_ || !q_.empty(); });
              if (stop_ && q_.empty()) return;
              f = std::move(q_.front()); q_.pop();
            }
            f();
        }
    }
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> q_;
    std::mutex m_;
    std::condition_variable cv_;
    bool stop_ = false;
};

int main() {
    ThreadPool pool(4);
    for (int i = 0; i < 8; ++i) pool.submit([i]{ std::cout << i << "\\n"; });
}` },
  ],

  java: [
    { id: 'java-singleton', name: 'Thread-Safe Singleton', code: `public class DatabaseConnection {
    private static volatile DatabaseConnection instance;

    private DatabaseConnection() {}

    public static DatabaseConnection getInstance() {
        if (instance == null) {
            synchronized (DatabaseConnection.class) {
                if (instance == null) {
                    instance = new DatabaseConnection();
                }
            }
        }
        return instance;
    }
}` },
    { id: 'java-generic-stack', name: 'Generic Stack', code: `import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

public class Stack<T> {
    private final List<T> items = new ArrayList<>();

    public void push(T item) {
        items.add(item);
    }

    public T pop() {
        if (items.isEmpty()) {
            throw new NoSuchElementException("Stack is empty");
        }
        return items.remove(items.size() - 1);
    }
}` },
    { id: 'java-interface-default', name: 'Interface With Default Method', code: `public interface Shape {
    double area();

    default String describe() {
        return "Shape with area " + area();
    }
}

public class Circle implements Shape {
    private final double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}` },
    { id: 'java-stream-filter', name: 'Stream Filtering', code: `import java.util.List;
import java.util.stream.Collectors;

public class UserFilter {
    public static List<String> activeNames(List<User> users) {
        return users.stream()
            .filter(User::isActive)
            .map(User::getName)
            .sorted()
            .collect(Collectors.toList());
    }
}

class User {
    private final String name;
    private final boolean active;
    public User(String name, boolean active) { this.name = name; this.active = active; }
    public String getName() { return name; }
    public boolean isActive() { return active; }
}` },
    { id: 'java-optional', name: 'Optional Chaining', code: `import java.util.Optional;

public class UserService {
    public String resolveDisplayName(Optional<User> user) {
        return user
            .map(User::getNickname)
            .filter(name -> !name.isBlank())
            .orElse("Anonymous");
    }
}

class User {
    private final String nickname;
    public User(String nickname) { this.nickname = nickname; }
    public String getNickname() { return nickname; }
}` },
    { id: 'java-merge-sort', name: 'Merge Sort', code: `import java.util.Arrays;

public class MergeSort {
    public static int[] sort(int[] arr) {
        if (arr.length <= 1) return arr;
        int mid = arr.length / 2;
        int[] left = sort(Arrays.copyOfRange(arr, 0, mid));
        int[] right = sort(Arrays.copyOfRange(arr, mid, arr.length));
        return merge(left, right);
    }

    private static int[] merge(int[] left, int[] right) {
        int[] result = new int[left.length + right.length];
        int i = 0, l = 0, r = 0;
        while (l < left.length && r < right.length) {
            result[i++] = left[l] < right[r] ? left[l++] : right[r++];
        }
        while (l < left.length) result[i++] = left[l++];
        while (r < right.length) result[i++] = right[r++];
        return result;
    }
}` },
    { id: 'java-optional-pattern', name: 'Optional Pattern Matching', code: `import java.util.Optional;

public class Handler {
    public String process(Optional<String> input) {
        return switch (input) {
            case Optional<String>(var s) when !s.isBlank() -> s.toUpperCase();
            case Optional<String>(var s) -> "(empty)";
            case null -> "(none)";
        };
    }
}` },
    { id: 'java-records', name: 'Java Records', code: `public record Money(long amount, String currency) {
    public Money {
        if (amount < 0) throw new IllegalArgumentException("negative amount");
    }

    public Money add(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("currency mismatch");
        }
        return new Money(amount + other.amount, currency);
    }
}

class Main {
    public static void main(String[] args) {
        Money a = new Money(100, "USD");
        Money b = new Money(50, "USD");
        System.out.println(a.add(b).amount());
    }
}` },
    { id: 'java-completable-future', name: 'Completable Future Chain', code: `import java.util.concurrent.CompletableFuture;

public class Main {
    public static void main(String[] args) {
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> "Hello")
            .thenApply(s -> s + ", World")
            .thenApply(String::toUpperCase);
        System.out.println(future.join());
    }
}` },
  ],

  go: [
    { id: 'go-goroutine', name: 'Worker Pool', code: `package main

import (
    "fmt"
    "sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        results <- j * 2
    }
}

func main() {
    jobs := make(chan int, 10)
    results := make(chan int, 10)
    var wg sync.WaitGroup
    for w := 1; w <= 3; w++ {
        wg.Add(1)
        go worker(w, jobs, results, &wg)
    }
    for j := 1; j <= 5; j++ {
        jobs <- j
    }
    close(jobs)
    wg.Wait()
    close(results)
    for r := range results {
        fmt.Println(r)
    }
}` },
    { id: 'go-error-wrap', name: 'Wrapped HTTP Error', code: `package main

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

func fetchWithTimeout(ctx context.Context, url string) (*http.Response, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("building request: %w", err)
    }
    return http.DefaultClient.Do(req)
}` },
    { id: 'go-stack', name: 'Generic Stack', code: `package main

type Stack struct {
    items []int
}

func (s *Stack) Push(item int) {
    s.items = append(s.items, item)
}

func (s *Stack) Pop() (int, bool) {
    if len(s.items) == 0 {
        return 0, false
    }
    last := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return last, true
}

func main() {
    s := &Stack{}
    s.Push(1)
    s.Push(2)
    s.Push(3)
    v, _ := s.Pop()
    fmt.Println(v)
}` },
    { id: 'go-mutex-cache', name: 'Mutex-Protected Cache', code: `package main

import (
    "fmt"
    "sync"
)

type Cache struct {
    mu    sync.RWMutex
    items map[string]int
}

func (c *Cache) Get(key string) (int, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    v, ok := c.items[key]
    return v, ok
}

func (c *Cache) Set(key string, value int) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.items[key] = value
}

func main() {
    c := &Cache{items: make(map[string]int)}
    c.Set("alice", 1)
    v, _ := c.Get("alice")
    fmt.Println(v)
}` },
    { id: 'go-generics', name: 'Generic Map Function', code: `package main

import "fmt"

func Map[T, U any](items []T, transform func(T) U) []U {
    result := make([]U, len(items))
    for i, item := range items {
        result[i] = transform(item)
    }
    return result
}

func main() {
    numbers := []int{1, 2, 3, 4}
    squared := Map(numbers, func(n int) int { return n * n })
    fmt.Println(squared)
}` },
    { id: 'go-binary-search', name: 'Binary Search', code: `package main

import "fmt"

func binarySearch(items []int, target int) int {
    low, high := 0, len(items)-1
    for low <= high {
        mid := (low + high) / 2
        switch {
        case items[mid] == target:
            return mid
        case items[mid] < target:
            low = mid + 1
        default:
            high = mid - 1
        }
    }
    return -1
}

func main() {
    items := []int{2, 5, 8, 12, 16, 23, 38}
    fmt.Println(binarySearch(items, 23))
}` },
    { id: 'go-http-server', name: 'Tiny HTTP Server', code: `package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
    })
    if err := http.ListenAndServe(":8080", nil); err != nil {
        panic(err)
    }
}` },
    { id: 'go-sort-custom', name: 'Custom Sort (Slices.SortFunc)', code: `package main

import (
    "cmp"
    "fmt"
    "slices"
)

type Person struct {
    Name string
    Age  int
}

func main() {
    people := []Person{
        {"Alice", 30}, {"Bob", 25}, {"Carol", 35},
    }
    slices.SortFunc(people, func(a, b Person) int {
        return cmp.Compare(a.Age, b.Age)
    })
    fmt.Println(people)
}` },
    { id: 'go-defer-cleanup', name: 'Defer Cleanup Pattern', code: `package main

import "fmt"

func processFile(path string) (string, error) {
    f, err := osOpen(path)
    if err != nil {
        return "", err
    }
    defer f.Close()

    return f.Read()
}

func main() {
    s, err := processFile("data/paragraphs.json")
    if err != nil {
        fmt.Println("error:", err)
        return
    }
    fmt.Println("first chars:", s[:30])
}` },
  ],

  rust: [
    { id: 'rust-result', name: 'Result Handling', code: `use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}` },
    { id: 'rust-enum-match', name: 'Enum Pattern Match', code: `enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Rectangle { width, height } => width * height,
    }
}

fn main() {
    let s = Shape::Circle { radius: 2.0 };
    println!("{}", area(&s));
}` },
    { id: 'rust-generic-stack', name: 'Generic Stack', code: `struct Stack<T> {
    items: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Self {
        Stack { items: Vec::new() }
    }

    fn push(&mut self, item: T) {
        self.items.push(item);
    }

    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }
}

fn main() {
    let mut s = Stack::new();
    s.push(1);
    s.push(2);
    println!("{:?}", s.pop());
}` },
    { id: 'rust-iterator-chain', name: 'Iterator Chain', code: `fn even_squares(numbers: &[i32]) -> Vec<i32> {
    numbers
        .iter()
        .filter(|&&n| n % 2 == 0)
        .map(|&n| n * n)
        .collect()
}

fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];
    println!("{:?}", even_squares(&v));
}` },
    { id: 'rust-trait', name: 'Trait With Default', code: `trait Greet {
    fn name(&self) -> &str;
    fn greet(&self) -> String {
        format!("Hello, {}!", self.name())
    }
}

struct Person { name: String }

impl Greet for Person {
    fn name(&self) -> &str { &self.name }
}

fn main() {
    let p = Person { name: "Ada".to_string() };
    println!("{}", p.greet());
}` },
    { id: 'rust-mutex', name: 'Shared State With Mutex', code: `use std::sync::{Arc, Mutex};
use std::thread;

fn increment_counter() -> i32 {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
    *counter.lock().unwrap()
}` },
    { id: 'rust-error-trait', name: 'Custom Error Type', code: `use std::fmt;

#[derive(Debug)]
enum AppError {
    NotFound(String),
    Permission(String),
    Invalid(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::NotFound(m) => write!(f, "Not found: {}", m),
            AppError::Permission(m) => write!(f, "No permission: {}", m),
            AppError::Invalid(m) => write!(f, "Invalid: {}", m),
        }
    }
}

fn main() {
    let e = AppError::NotFound("user".to_string());
    println!("{}", e);
}` },
    { id: 'rust-iter-find', name: 'Find with Iterator', code: `fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6];
    let even = numbers.iter().find(|&&n| n % 2 == 0);
    println!("First even: {:?}", even);

    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}` },
    { id: 'rust-btreemap', name: 'Sorted BTreeMap', code: `use std::collections::BTreeMap;

fn main() {
    let mut map = BTreeMap::new();
    map.insert("banana", 3);
    map.insert("apple", 5);
    map.insert("cherry", 1);

    for (key, val) in &map {
        println!("{}: {}", key, val);
    }
}` },
  ],

  kotlin: [
    { id: 'kt-coroutines', name: 'Flow Collector', code: `import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.runBlocking

fun fetchNumbers(): Flow<Int> = flow {
    for (i in 1..5) {
        kotlinx.coroutines.delay(100)
        emit(i)
    }
}

fun main() = runBlocking {
    fetchNumbers().collect { println("Got: $it") }
}` },
    { id: 'kt-data-class', name: 'Data Class With Copy', code: `data class User(
    val id: Int,
    val name: String,
    val email: String
)

fun main() {
    val original = User(1, "Ada", "ada@example.com")
    val updated = original.copy(name = "Grace")
    println(original)
    println(updated)
}` },
    { id: 'kt-sealed-class', name: 'Sealed Result Type', code: `sealed class Result<out T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Failure(val error: Throwable) : Result<Nothing>()
}

inline fun <T, R> T.map(transform: (T) -> R): Result<R> = when (this) {
    is Result.Success -> Result.Success(transform(value))
    is Result.Failure -> this
}

fun divide(a: Int, b: Int): Result<Int> =
    if (b == 0) Result.Failure(ArithmeticException()) else Result.Success(a / b)

fun main() {
    println(divide(10, 2).map { it * it })
}` },
    { id: 'kt-extension-function', name: 'Extension Function', code: `fun String.isPalindrome(): Boolean {
    val clean = this.lowercase().filter { it.isLetterOrDigit() }
    return clean == clean.reversed()
}

fun main() {
    println("A man, a plan, a canal: Panama".isPalindrome())
    println("Hello, world".isPalindrome())
}` },
    { id: 'kt-scope-functions', name: 'Scope Functions', code: `class Config {
    var timeout: Int = 30
    var retries: Int = 3
}

fun main() {
    val config = Config().apply {
        timeout = 60
        retries = 5
    }
    println(config)
}` },
    { id: 'kt-scope-function-let', name: 'Scope Function let', code: `fun processName(name: String?): Int {
    return name?.let { n ->
        println("Processing: $n")
        n.length
    } ?: run {
        println("No name provided")
        0
    }
}

fun main() {
    println(processName("Alice"))
    println(processName(null))
}` },
    { id: 'kt-sequence-builder', name: 'Sequence Builder', code: `fun fibonacci(): Sequence<Long> = sequence {
    var a = 0L
    var b = 1L
    while (true) {
        yield(a)
        val next = a + b
        a = b
        b = next
    }
}

fun main() {
    fibonacci().take(10).forEach(::println)
}` },
    { id: 'kt-coroutine-async', name: 'Coroutines: async / await', code: `import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay

suspend fun fetchUser(id: Int): String {
    delay(100)
    return "User($id)\`
}

suspend fun fetchOrders(user: String): List<String> {
    delay(100)
    return listOf(\"$user-order-1\", \"$user-order-2\")
}

suspend fun loadDashboard(): String = coroutineScope {
    val user = async { fetchUser(1) }
    val orders = async { fetchOrders(user.await()) }
    \"\\\${user.await()} with \\\${orders.await().size} orders\"
}

fun main() = kotlinx.coroutines.runBlocking {
    println(loadDashboard())
` },
    { id: 'kt-extension-list', name: 'List Extensions', code: `fun <T> List<T>.secondOrNull(): T? =
    if (size >= 2) this[1] else null

fun <T> List<T>.penultimate(): T? =
    if (size >= 2) this[size - 2] else null

fun main() {
    val nums = listOf(10, 20, 30, 40)
    println(nums.secondOrNull())
    println(nums.penultimate())
}` },
  ],

  swift: [
    { id: 'swift-enum', name: 'Associated Value Enum', code: `enum NetworkResult<T> {
    case success(T)
    case failure(Error)
}

struct User: Codable {
    let id: Int
    let username: String
}

func handle(_ result: NetworkResult<User>) {
    switch result {
    case .success(let user):
        print("Got: \\(user.username)")
    case .failure(let error):
        print("Failed: \\(error)")
    }
}` },
    { id: 'swift-protocol', name: 'Protocol With Default', code: `protocol Greetable {
    var name: String { get }
    func greet() -> String
}

extension Greetable {
    func greet() -> String {
        return "Hello, \\(name)!\`
    }
}

struct User: Greetable {
    let name: String
}

let u = User(name: \"Ada\")
print(u.greet())`},
    { id: 'swift-generic-func', name: 'Generic Swap Function', code: `func swap<T>(_ a: inout T, _ b: inout T) {
    let tmp = a
    a = b
    b = tmp
}

var x = 1
var y = 2
swap(&x, &y)
print("\\(x), \\(y)")` },
    { id: 'swift-optional-chaining', name: 'Optional Chaining', code: `struct Address {
    var city: String?
}

struct Profile {
    var address: Address?
}

func resolveCity(_ profile: Profile) -> String {
    return profile.address?.city ?? "Unknown\`
}

let p = Profile(address: Address(city: \"Berlin\"))
print(resolveCity(p))`},
    { id: 'swift-async-fetch', name: 'Async Fetch', code: `func fetchUser(id: Int) async throws -> User {
    let url = URL(string: "https://api.example.com/users/\\(id)")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}

struct User: Codable {
    let id: Int
    let username: String
}

Task {
    do {
        let u = try await fetchUser(id: 1)
        print(u.username)
    } catch {
        print("error:", error)
    }
}` },
    { id: 'swift-result-builder', name: 'Result Builder', code: `@resultBuilder
struct StringBuilder {
    static func buildBlock(_ components: String...) -> String {
        components.joined(separator: " ")
    }
}

func greet(@StringBuilder _ build: () -> String) -> String {
    build()
}

let message = greet {
    "Hello"
    "World\`
}
print(message)`},
    { id: 'swift-actor', name: 'Actor Concurrency', code: `actor Counter {
    private var value = 0
    func increment() { value += 1 }
    func current() -> Int { value }
}

let c = Counter()
Task {
    for _ in 0..100 { await c.increment() }
}
Task {
    try? await Task.sleep(nanoseconds: 100_000_000)
    print(await c.current())
}
RunLoop.main.run(until: Date(timeIntervalSinceNow: 1))` },
    { id: 'swift-property-wrapper', name: 'Property Wrapper', code: `@propertyWrapper
struct Clamped<Value: Comparable> {
    private var value: Value
    private let range: ClosedRange<Value>
    var wrappedValue: Value {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
        self.range = range
    }
}

struct Settings {
    @Clamped(0...100) var volume: Int = 50
}
var s = Settings()
s.volume = 150
print(s.volume)` },
    { id: 'swift-closures', name: 'Capturing Closures', code: `func makeCounter() -> () -> Int {
    var count = 0
    return { count += 1; return count }
}

let counter = makeCounter()
print(counter())
print(counter())
print(counter())` },
  ],
};
