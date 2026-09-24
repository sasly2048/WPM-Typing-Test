// src/content/developer/languages.js
// Real, idiomatic code snippets for Developer Mode. Multiple unique snippets
// per language spanning different constructs (functions, classes, async,
// error handling, data structures) so practice sessions don't repeat.

export const LANGUAGE_SNIPPETS = {
  javascript: [
    {
      id: 'js-binary-search',
      name: 'Binary Search',
      code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`
    },
    {
      id: 'js-debounce',
      name: 'Debounce Utility',
      code: `function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}`
    },
    {
      id: 'js-event-emitter',
      name: 'Event Emitter',
      code: `class EventEmitter {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);
    return this;
  }

  emit(event, ...args) {
    const callbacks = this.#listeners.get(event) || [
};

    callbacks.forEach((cb) => cb(...args));
  }
}`
    },
    {
      id: 'js-fetch-retry',
      name: 'Fetch With Retry',
      code: `async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(\`Status \${response.status}\`);
      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, attempt * 200));
    }
  }
}`
    },
    {
      id: 'js-memoize',
      name: 'Memoization Cache',
      code: `function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}`
    },
    {
      id: 'js-group-by',
      name: 'Group By Key',
      code: `function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    (groups[key] ||= []).push(item);
    return groups;
  }, {});
}`
    },
    {
      id: 'js-linked-list',
      name: 'Singly Linked List',
      code: `class LinkedList {
  head = null;

  pushFront(value) {
    this.head = { value, next: this.head };
  }

  toArray() {
    const result = [];
    let node = this.head;
    while (node) {
      result.push(node.value);
      node = node.next;
    }
    return result;
  }
}`
    },
  
    {

      id: 'js-pipe',

      name: 'Function Pipe',

      code: `const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const trim = (s) => s.trim();
const upper = (s) => s.toUpperCase();
const shout = pipe(trim, upper, (s) => \`\${s}!\`);

console.log(shout('  hello  '));`

    },
    {

      id: 'js-clone-deep',

      name: 'Deep Clone',

      code: `function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);

  for (const key of Reflect.ownKeys(value)) {
    copy[key] = deepClone(value[key], seen);
  }
  return copy;
}`

    },
    {

      id: 'js-throttle',

      name: 'Throttle Function',

      code: `function throttle(fn, wait) {
  let last = 0;
  let pending = null;
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
}`

    },
    {

      id: 'js-fetcher',

      name: 'Type-Safe Fetcher',

      code: `async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(\`Request failed: \${response.status}\`);
  }
  return response.json();
}`

    },
    {

      id: 'js-priority-queue',

      name: 'Priority Queue',

      code: `class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(value, priority) {
    this.values.push({ value, priority });
    this.values.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.values.shift()?.value;
  }
}`

    },
    {

      id: 'js-lru-cache',

      name: 'LRU Cache',

      code: `class LRUCache {
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
}`

    },
    {

      id: 'js-csv-parser',

      name: 'CSV Parser',

      code: `function parseCsv(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field) row.push(field);
  if (row.length) rows.push(row);
  return rows;
}`

    },
    {

      id: 'js-event-bus',

      name: 'Typed Event Bus',

      code: `class EventBus {
  #listeners = new Map();

  on(event, handler) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(handler);
    return () => this.#listeners.get(event)?.delete(handler);
  }

  emit(event, payload) {
    for (const handler of this.#listeners.get(event) ?? []) {
      handler(payload);
    }
  }
}`

    },
    {
      id: 'js-debounce',
      name: 'Debounce Utility',
      code: `function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const log = debounce((msg) => console.log(msg), 200);
log('hello');
log('world');
log('!');`
    },
    {
      id: 'js-event-emitter',
      name: 'Event Emitter',
      code: `class EventEmitter {
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
bus.emit('login', 'Ada');`
    },
    {
      id: 'js-fetch-retry',
      name: 'Fetch With Retry',
      code: `async function fetchWithRetry(url, retries = 3) {
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
console.log(data);`
    },
    {
      id: 'js-memoize',
      name: 'Memoization Cache',
      code: `function memoize(fn) {
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
console.log(slowSquare(5));`
    },
    {
      id: 'js-group-by',
      name: 'Group By Key',
      code: `function groupBy(items, keyFn) {
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
console.log(byAge);`
    },
    {
      id: 'js-singly-linked-list',
      name: 'Singly Linked List',
      code: `class Node {
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
console.log(list.toArray());`
    },
    {
      id: 'js-priority-queue',
      name: 'Priority Queue',
      code: `class PriorityQueue {
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
console.log(pq.dequeue());`
    },
    {
      id: 'js-lru-cache',
      name: 'LRU Cache',
      code: `class LRUCache {
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
console.log(cache.get('a'));`
    },
    {
      id: 'js-deep-clone',
      name: 'Deep Clone',
      code: `function deepClone(value, seen = new WeakMap()) {
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
console.log(original.b.c, clone.b.c);`
    },
    {
      id: 'js-csv-parser',
      name: 'CSV Parser',
      code: `function parseCSV(text, delimiter = ',') {
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

console.log(parseCSV('a,b,c\\n1,2,3'));`
    },
    {
      id: 'js-throttle',
      name: 'Throttle Function',
      code: `function throttle(fn, wait) {
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
log('a'); log('b'); log('c');`
    },
    {
      id: 'js-pipe',
      name: 'Function Pipe',
      code: `const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const trim = (s) => s.trim();
const upper = (s) => s.toUpperCase();
const exclaim = (s) => s + '!';

const shout = pipe(trim, upper, exclaim);
console.log(shout('  hello  '));`
    }
  ],

  typescript: [
    {
      id: 'ts-generics',
      name: 'Generic Repository',
      code: `interface Entity {
  id: string;
}

class Repository<T extends Entity> {
  private items: Map<string, T> = new Map();

  public save(item: T): void {
    this.items.set(item.id, item);
  }

  public findById(id: string): T | undefined {
    return this.items.get(id);
  }
}`
    },
    {
      id: 'ts-discriminated-union',
      name: 'Discriminated Union',
      code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
  }
}`
    },
    {
      id: 'ts-utility-types',
      name: 'Utility Types',
      code: `interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type PublicUser = Omit<User, 'password'>;
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>;`
    },
    {
      id: 'ts-async-queue',
      name: 'Async Task Queue',
      code: `class TaskQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  enqueue(task: () => Promise<void>): void {
    this.queue.push(task);
    if (!this.running) this.drain();
  }

  private async drain(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }
    this.running = false;
  }
}`
    },
    {
      id: 'ts-type-guard',
      name: 'Custom Type Guard',
      code: `interface ApiError {
  message: string;
  code: number;
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'code' in value
  );
}`
    },
    {
      id: 'ts-decorator',
      name: 'Method Decorator',
      code: `function logCall(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    console.log(\`Calling \${key} with\`, args);
    return original.apply(this, args);
  };
  return descriptor;
}`
    },
  
    {

      id: 'ts-generic-repo',

      name: 'Generic Repository',

      code: `export interface Entity {
  id: string;
}

export class Repository<T extends Entity> {
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
}`

    },
    {

      id: 'ts-discriminated',

      name: 'Discriminated Union',

      code: `type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  throw result.error;
}`

    },
    {

      id: 'ts-pick-omit',

      name: 'Pick and Omit',

      code: `interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type PublicUser = Omit<User, 'password'>;
type Credentials = Pick<User, 'email' | 'password'>;`

    },
    {

      id: 'ts-async-promise',

      name: 'Promise.allSettled',

      code: `async function loadDashboardData(userId: string) {
  const [profile, settings, sessions] = await Promise.allSettled([
    api.getProfile(userId),
    api.getSettings(userId),
    api.getRecentSessions(userId),
  ]);

  return {
    profile: profile.status === 'fulfilled' ? profile.value : null,
    settings: settings.status === 'fulfilled' ? settings.value : null,
    sessions: sessions.status === 'fulfilled' ? sessions.value : [],
  };
}`

    },
    {

      id: 'ts-mapped-types',

      name: 'Mapped Types',

      code: `type Nullable<T> = { [K in keyof T]: T[K] | null };
type Readonly2<T> = { readonly [K in keyof T]: T[K] };

interface Config {
  theme: string;
  volume: number;
}

const safeConfig: Nullable<Config> = {
  theme: 'light',
  volume: null,
};`

    },
    {

      id: 'ts-react-hook',

      name: 'Custom React Hook',

      code: `function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`

    },
    {
      id: 'ts-debounce',
      name: 'Debounce (TS)',
      code: `function debounce<T extends (...args: any[]) => void>(
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
log('!');`
    },
    {
      id: 'ts-result-type',
      name: 'Result Type',
      code: `type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: new Error('Division by zero') };
  return { ok: true, value: a / b };
}

const r = divide(10, 2);
if (r.ok) console.log(r.value);`
    },
    {
      id: 'ts-discriminated-union',
      name: 'Discriminated Union',
      code: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.radius * s.radius;
    case 'rectangle': return s.width * s.height;
  }
}

console.log(area({ kind: 'circle', radius: 2 }));
console.log(area({ kind: 'rectangle', width: 3, height: 4 }));`
    },
    {
      id: 'ts-generic-repo',
      name: 'Generic Repository',
      code: `interface Entity { id: string; }

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
console.log(users.findById('1'));`
    },
    {
      id: 'ts-utility-types',
      name: 'Utility Types',
      code: `interface User { id: number; name: string; email: string; age: number; }

type PublicUser = Omit<User, 'email' | 'age'>;
type UserPatch = Partial<Pick<User, 'name' | 'email'>>;

const safe: PublicUser = { id: 1, name: 'Ada' };
const patch: UserPatch = { name: 'Grace' };
console.log(safe, patch);`
    },
    {
      id: 'ts-decorator',
      name: 'Method Decorator',
      code: `function log(target: any, key: string, descriptor: PropertyDescriptor) {
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

new Calculator().add(2, 3);`
    },
    {
      id: 'ts-async-task',
      name: 'Async Task Queue',
      code: `type Task<T> = () => Promise<T>;

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
console.log('done');`
    },
    {
      id: 'ts-deep-readonly',
      name: 'Deep Readonly',
      code: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

interface Config { db: { url: string; pool: number; }; app: { name: string }; }

const c: DeepReadonly<Config> = {
  db: { url: 'postgres://', pool: 10 },
  app: { name: 'KeyFlow' },
};

console.log(c.db.url);`
    },
    {
      id: 'ts-event-bus',
      name: 'Typed Event Bus',
      code: `type EventMap = {
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
bus.emit('login', { user: 'Ada' });`
    },
    {
      id: 'ts-zod-validator',
      name: 'Schema Validator',
      code: `type Schema<T> = (input: unknown) => T | string;

const stringSchema: Schema<string> = (input) =>
  typeof input === 'string' ? input : 'Expected string';

const numberSchema: Schema<number> = (input) =>
  typeof input === 'number' ? input : 'Expected number';

const validate = <T>(s: Schema<T>, v: unknown): T | null => {
  const r = s(v);
  return typeof r === 'string' ? null : r;
};

console.log(validate(stringSchema, 'hello'));
console.log(validate(numberSchema, 42));`
    }
  ],

  python: [
    {
      id: 'py-decorator',
      name: 'Timing Decorator',
      code: `import time
from functools import wraps

def measure_time(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        print(f"{func.__name__} took {duration:.4f}s")
        return result
    return wrapper`
    },
    {
      id: 'py-lru-cache',
      name: 'LRU Cache',
      code: `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key):
        if key not in self.cache:
            return -1
        self.order.remove(key)
        self.order.append(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            oldest = self.order.pop(0)
            del self.cache[oldest]
        self.cache[key] = value
        self.order.append(key)`
    },
    {
      id: 'py-dataclass',
      name: 'Dataclass Model',
      code: `from dataclasses import dataclass, field

@dataclass
class Task:
    title: str
    priority: int = 1
    tags: list = field(default_factory=list)

    def is_urgent(self):
        return self.priority >= 3`
    },
    {
      id: 'py-context-manager',
      name: 'Context Manager',
      code: `from contextlib import contextmanager

@contextmanager
def open_transaction(connection):
    transaction = connection.begin()
    try:
        yield transaction
        transaction.commit()
    except Exception:
        transaction.rollback()
        raise`
    },
    {
      id: 'py-generator',
      name: 'Chunked Generator',
      code: `def chunk_list(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]

def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item`
    },
    {
      id: 'py-binary-search',
      name: 'Binary Search',
      code: `def binary_search(sorted_list, target):
    low, high = 0, len(sorted_list) - 1
    while low <= high:
        mid = (low + high) // 2
        if sorted_list[mid] == target:
            return mid
        elif sorted_list[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`
    },
    {
      id: 'py-async-fetch',
      name: 'Async HTTP Fetch',
      code: `import asyncio
import aiohttp

async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [session.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)
        return [await r.json() for r in responses]`
    },
  
    {

      id: 'py-decorator-timing',

      name: 'Timing Decorator',

      code: `import time
from functools import wraps

def timing(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f'{func.__name__} took {elapsed:.3f}s')
        return result
    return wrapper`

    },
    {

      id: 'py-property',

      name: 'Computed Property',

      code: `class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    @property
    def area(self):
        return self.width * self.height

    @property
    def perimeter(self):
        return 2 * (self.width + self.height)`

    },
    {

      id: 'py-typing-protocol',

      name: 'Structural Typing',

      code: `from typing import Protocol

class Drawable(Protocol):
    def draw(self) -> None: ...

class Circle:
    def draw(self) -> None:
        print('Drawing circle')

class Square:
    def draw(self) -> None:
        print('Drawing square')

def render(shape: Drawable) -> None:
    shape.draw()`

    },
    {

      id: 'py-fstring-debug',

      name: 'F-String Debugging',

      code: `def calculate_total(items, tax_rate):
    subtotal = sum(item.price for item in items)
    tax = subtotal * tax_rate
    total = subtotal + tax
    print(f'{subtotal=}, {tax_rate=}, {total=}')
    return total`

    },
    {

      id: 'py-match-statement',

      name: 'Match Statement',

      code: `def handle_response(response):
    match response:
        case {'status': 200, 'data': data}:
            return f'OK: {data}'
        case {'status': 404}:
            return 'Not found'
        case {'status': code}:
            return f'Error {code}'
        case _:
            return 'Unknown'`

    },
    {

      id: 'py-walrus',

      name: 'Walrus Operator',

      code: `import re

def extract_numbers(text):
    pattern = re.compile(r'\\d+')
    return [int(m.group()) for m in pattern.finditer(text) if (m := pattern.search(text, m.end() if m else 0))]`

    },
    {
      id: 'py-decorator',
      name: 'Timing Decorator',
      code: `import time
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

slow()`
    },
    {
      id: 'py-context-manager',
      name: 'Context Manager',
      code: `from contextlib import contextmanager
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
    total = sum(range(1_000_000))`
    },
    {
      id: 'py-dataclass',
      name: 'Dataclass Model',
      code: `from dataclasses import dataclass, field

@dataclass
class Task:
    title: str
    priority: int = 1
    tags: list = field(default_factory=list)

    def is_urgent(self) -> bool:
        return self.priority >= 3

t = Task('Ship release', priority=3, tags=['prod'])
print(t.is_urgent())`
    },
    {
      id: 'py-fstring-debug',
      name: 'F-String Debug',
      code: `def calculate_total(items, tax_rate):
    subtotal = sum(item.price for item in items)
    tax = subtotal * tax_rate
    total = subtotal + tax
    print(f'{subtotal=}, {tax_rate=}, {total=}')
    return total

calculate_total([
    type('Item', (), {'price': 10})(),
    type('Item', (), {'price': 20})(),
], 0.2)`
    },
    {
      id: 'py-match-statement',
      name: 'Match Statement',
      code: `def handle_response(response):
    match response:
        case {'status': 200, 'data': data}:
            return f'OK: {data}'
        case {'status': 404}:
            return 'Not found'
        case {'status': code}:
            return f'Error {code}'
        case _:
            return 'Unknown'

print(handle_response({'status': 200, 'data': 'hello'}))`
    },
    {
      id: 'py-async-task',
      name: 'Async Task Queue',
      code: `import asyncio

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
print(results)`
    },
    {
      id: 'py-property',
      name: 'Computed Property',
      code: `class Rectangle:
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
print(r.area, r.perimeter)`
    },
    {
      id: 'py-counter',
      name: 'Counter (Defaultdict)',
      code: `from collections import Counter, defaultdict

words = 'the quick brown fox jumps over the lazy dog'.split()
counts = Counter(words)
print(counts.most_common(3))

groups = defaultdict(list)
for word in words:
    groups[len(word)].append(word)
print(dict(groups))`
    },
    {
      id: 'py-pathlib',
      name: 'Pathlib File Ops',
      code: `from pathlib import Path

p = Path('src')
for f in sorted(p.glob('**/*.js')):
    print(f.stat().st_size, f)

home = Path.home()
docs = home / 'Documents'
docs.mkdir(exist_ok=True)
print(docs.exists())`
    },
    {
      id: 'py-threadpool',
      name: 'ThreadPoolExecutor',
      code: `from concurrent.futures import ThreadPoolExecutor
import urllib.request

def fetch(url):
    with urllib.request.urlopen(url, timeout=5) as r:
        return len(r.read())

urls = ['https://example.com', 'https://example.org', 'https://example.net']
with ThreadPoolExecutor(max_workers=3) as pool:
    sizes = list(pool.map(fetch, urls))
print(sizes)`
    }
  ],

  c: [
    {
      id: 'c-linked-list',
      name: 'Linked List Node',
      code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

struct Node* createNode(int value) {
    struct Node* newNode = (struct Node*)malloc(sizeof(struct Node));
    newNode->data = value;
    newNode->next = NULL;
    return newNode;
}`
    },
    {
      id: 'c-binary-search',
      name: 'Binary Search',
      code: `int binarySearch(int arr[], int size, int target) {
    int low = 0, high = size - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`
    },
    {
      id: 'c-stack',
      name: 'Fixed-Size Stack',
      code: `#define MAX_SIZE 100

typedef struct {
    int items[MAX_SIZE];
    int top;
} Stack;

void push(Stack* s, int value) {
    if (s->top < MAX_SIZE - 1) {
        s->items[++s->top] = value;
    }
}

int pop(Stack* s) {
    return s->top >= 0 ? s->items[s->top--] : -1;
}`
    },
    {
      id: 'c-string-reverse',
      name: 'In-Place String Reverse',
      code: `void reverseString(char* str) {
    int left = 0;
    int right = 0;
    while (str[right] != '\\0') right++;
    right--;

    while (left < right) {
        char temp = str[left];
        str[left] = str[right];
        str[right] = temp;
        left++;
        right--;
    }
}`
    },
    {
      id: 'c-file-read',
      name: 'Read File Line By Line',
      code: `#include <stdio.h>

void printFileLines(const char* path) {
    FILE* file = fopen(path, "r");
    if (!file) return;

    char buffer[256];
    while (fgets(buffer, sizeof(buffer), file)) {
        printf("%s", buffer);
    }
    fclose(file);
}`
    },
    {
      id: 'c-bubble-sort',
      name: 'Bubble Sort',
      code: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`
    },
  
    {

      id: 'c-quicksort',

      name: 'Quicksort',

      code: `void quicksort(int arr[], int low, int high) {
    if (low < high) {
        int pivot = arr[high];
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                int temp = arr[++i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        quicksort(arr, low, i);
        quicksort(arr, i + 2, high);
    }
}`

    },
    {

      id: 'c-hashmap',

      name: 'Open-Addressed Hashmap',

      code: `#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#define HASHMAP_SIZE 1024

typedef struct Entry {
    char* key;
    void* value;
    int occupied;
} Entry;

typedef struct HashMap {
    Entry buckets[HASHMAP_SIZE];
} HashMap;

uint32_t hash(const char* str) {
    uint32_t h = 2166136261u;
    while (*str) {
        h ^= (uint8_t)*str++;
        h *= 16777619u;
    }
    return h;
}`

    },
    {

      id: 'c-deque',

      name: 'Ring Buffer',

      code: `#define DEQUE_SIZE 64

typedef struct {
    int data[DEQUE_SIZE];
    int head;
    int tail;
    int count;
} Deque;

void dequePush(Deque* d, int value) {
    d->data[d->tail] = value;
    d->tail = (d->tail + 1) % DEQUE_SIZE;
    d->count++;
}

int dequePop(Deque* d) {
    int value = d->data[d->head];
    d->head = (d->head + 1) % DEQUE_SIZE;
    d->count--;
    return value;
}`

    },
    {
      id: 'c-bubble-sort',
      name: 'Bubble Sort',
      code: `void bubble_sort(int arr[], int n) {
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
}`
    },
    {
      id: 'c-linked-list',
      name: 'Linked List',
      code: `#include <stdio.h>
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
}`
    },
    {
      id: 'c-stack',
      name: 'Stack (Array)',
      code: `#include <stdio.h>

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
}`
    },
    {
      id: 'c-hash-table',
      name: 'Hash Table (Chaining)',
      code: `#include <stdio.h>
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
}`
    },
    {
      id: 'c-quicksort',
      name: 'Quicksort',
      code: `#include <stdio.h>

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
}`
    },
    {
      id: 'c-string-reverse',
      name: 'In-Place String Reverse',
      code: `#include <stdio.h>
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
}`
    },
    {
      id: 'c-file-read',
      name: 'Read File Line by Line',
      code: `#include <stdio.h>

int main(void) {
    FILE* f = fopen("data/paragraphs.json", "r");
    if (!f) { perror("fopen"); return 1; }
    char line[512];
    int n = 0;
    while (fgets(line, sizeof(line), f)) n++;
    fclose(f);
    printf("lines: %d\\n", n);
    return 0;
}`
    },
    {
      id: 'c-dynamic-array',
      name: 'Dynamic Array (Realloc)',
      code: `#include <stdio.h>
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
}`
    },
    {
      id: 'c-binary-search',
      name: 'Binary Search',
      code: `#include <stdio.h>

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
}`
    }
  ],

  cpp: [
    {
      id: 'cpp-vector',
      name: 'Vector Operations',
      code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9};
    std::sort(numbers.begin(), numbers.end());
    for (const auto& num : numbers) {
        std::cout << num << " ";
    }
    return 0;
}`
    },
    {
      id: 'cpp-smart-pointer',
      name: 'Smart Pointer Buffer',
      code: `#include <memory>
#include <stdexcept>

std::unique_ptr<int[]> allocateBuffer(size_t size) {
    if (size == 0) {
        throw std::invalid_argument("size must be positive");
    }
    return std::make_unique<int[]>(size);
}`
    },
    {
      id: 'cpp-template',
      name: 'Generic Clamp',
      code: `template <typename T>
T clamp(T value, T low, T high) {
    if (value < low) return low;
    if (value > high) return high;
    return value;
}`
    },
    {
      id: 'cpp-class',
      name: 'Timer Class',
      code: `#include <chrono>

class Timer {
public:
    Timer() : start(std::chrono::steady_clock::now()) {}

    double elapsedMs() const {
        auto end = std::chrono::steady_clock::now();
        std::chrono::duration<double, std::milli> diff = end - start;
        return diff.count();
    }

private:
    std::chrono::steady_clock::time_point start;
};`
    },
    {
      id: 'cpp-quicksort',
      name: 'Quicksort Partition',
      code: `#include <vector>
#include <utility>

int partition(std::vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            std::swap(arr[++i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}`
    },
    {
      id: 'cpp-map-count',
      name: 'Word Frequency Map',
      code: `#include <unordered_map>
#include <string>
#include <sstream>

std::unordered_map<std::string, int> wordCount(const std::string& text) {
    std::unordered_map<std::string, int> counts;
    std::istringstream stream(text);
    std::string word;
    while (stream >> word) {
        counts[word]++;
    }
    return counts;
}`
    },
  
    {

      id: 'cpp-variant',

      name: 'Variant Visitor',

      code: `#include <variant>
#include <string>
#include <iostream>

using Value = std::variant<int, double, std::string>;

void describe(const Value& v) {
    std::visit([](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, int>)
            std::cout << "int: " << arg;
        else if constexpr (std::is_same_v<T, double>)
            std::cout << "double: " << arg;
        else
            std::cout << "string: " << arg;
    }, v);
}`

    },
    {

      id: 'cpp-threadpool',

      name: 'Thread Pool',

      code: `#include <thread>
#include <queue>
#include <mutex>
#include <condition_variable>
#include <functional>
#include <vector>

class ThreadPool {
public:
    explicit ThreadPool(size_t n) : stop(false) {
        for (size_t i = 0; i < n; ++i) {
            workers.emplace_back([this] { workerLoop(); });
        }
    }

    ~ThreadPool() {
        { std::lock_guard<std::mutex> lk(m); stop = true; }
        cv.notify_all();
        for (auto& t : workers) t.join();
    }

    void enqueue(std::function<void()> task) {
        { std::lock_guard<std::mutex> lk(m); tasks.push(std::move(task)); }
        cv.notify_one();
    }

private:
    void workerLoop() {
        while (true) {
            std::function<void()> task;
            {
                std::unique_lock<std::mutex> lk(m);
                cv.wait(lk, [this] { return stop || !tasks.empty(); });
                if (stop && tasks.empty()) return;
                task = std::move(tasks.front());
                tasks.pop();
            }
            task();
        }
    }

    std::vector<std::thread> workers;
    std::queue<std::function<void()>> tasks;
    std::mutex m;
    std::condition_variable cv;
    bool stop;
};`

    },
    {

      id: 'cpp-constexpr-fib',

      name: 'Constexpr Fibonacci',

      code: `#include <cstdint>

constexpr uint64_t fibonacci(int n) {
    if (n <= 1) return n;
    uint64_t a = 0, b = 1;
    for (int i = 2; i <= n; ++i) {
        uint64_t next = a + b;
        a = b;
        b = next;
    }
    return b;
}

static_assert(fibonacci(10) == 55, "Math broke at compile time");`

    },
    {
      id: 'cpp-vector',
      name: 'Vector Operations',
      code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = { 5, 2, 8, 1, 9, 3 };
    std::sort(numbers.begin(), numbers.end());
    for (int n : numbers) std::cout << n << " ";
    std::cout << std::endl;
    return 0;
}`
    },
    {
      id: 'cpp-smart-pointer',
      name: 'Smart Pointer Buffer',
      code: `#include <iostream>
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
}`
    },
    {
      id: 'cpp-template',
      name: 'Generic Clamp',
      code: `#include <iostream>
#include <algorithm>

template <typename T>
T clamp(T value, T low, T high) {
    return std::max(low, std::min(value, high));
}

int main() {
    std::cout << clamp(15, 0, 10) << std::endl;
    std::cout << clamp(-3, 0, 10) << std::endl;
    return 0;
}`
    },
    {
      id: 'cpp-class',
      name: 'Timer Class',
      code: `#include <iostream>
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
}`
    },
    {
      id: 'cpp-quicksort',
      name: 'Quicksort Partition',
      code: `#include <vector>
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
}`
    },
    {
      id: 'cpp-map-count',
      name: 'Word Frequency Map',
      code: `#include <iostream>
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
}`
    },
    {
      id: 'cpp-lambda',
      name: 'Sort with Lambda',
      code: `#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> v = { 5, 2, 8, 1, 9, 3 };
    std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });
    for (int x : v) std::cout << x << " ";
    std::cout << std::endl;
    return 0;
}`
    },
    {
      id: 'cpp-shared-ptr',
      name: 'Shared Pointer Graph',
      code: `#include <iostream>
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
}`
    },
    {
      id: 'cpp-variant',
      name: 'Variant Visitor',
      code: `#include <iostream>
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
}`
    },
    {
      id: 'cpp-thread-pool',
      name: 'Thread Pool',
      code: `#include <iostream>
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
}`
    }
  ],

  java: [
    {
      id: 'java-singleton',
      name: 'Thread-Safe Singleton',
      code: `public class DatabaseConnection {
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
}`
    },
    {
      id: 'java-generic-stack',
      name: 'Generic Stack',
      code: `import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

public class Stack<T> {
    private List<T> items = new ArrayList<>();

    public void push(T item) {
        items.add(item);
    }

    public T pop() {
        if (items.isEmpty()) {
            throw new NoSuchElementException("Stack is empty");
        }
        return items.remove(items.size() - 1);
    }
}`
    },
    {
      id: 'java-interface-default',
      name: 'Interface With Default Method',
      code: `public interface Shape {
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
}`
    },
    {
      id: 'java-stream-filter',
      name: 'Stream Filtering',
      code: `import java.util.List;
import java.util.stream.Collectors;

public List<String> activeUserNames(List<User> users) {
    return users.stream()
        .filter(User::isActive)
        .map(User::getName)
        .sorted()
        .collect(Collectors.toList());
}`
    },
    {
      id: 'java-optional',
      name: 'Optional Chaining',
      code: `import java.util.Optional;

public String resolveDisplayName(Optional<User> user) {
    return user
        .map(User::getNickname)
        .filter(name -> !name.isBlank())
        .orElse("Anonymous");
}`
    },
    {
      id: 'java-merge-sort',
      name: 'Merge Sort',
      code: `import java.util.Arrays;

public static int[] mergeSort(int[] arr) {
    if (arr.length <= 1) return arr;
    int mid = arr.length / 2;
    int[] left = mergeSort(Arrays.copyOfRange(arr, 0, mid));
    int[] right = mergeSort(Arrays.copyOfRange(arr, mid, arr.length));
    return merge(left, right);
}`
    },
  
    {

      id: 'java-record',

      name: 'Java Record',

      code: `public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(amount, "amount must not be null");
        Objects.requireNonNull(currency, "currency must not be null");
    }

    public Money add(Money other) {
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(amount.add(other.amount), currency);
    }
}`

    },
    {

      id: 'java-builder',

      name: 'Builder Pattern',

      code: `public final class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;

    private HttpRequest(Builder b) {
        this.url = b.url;
        this.method = b.method;
        this.headers = Map.copyOf(b.headers);
    }

    public static Builder builder(String url) {
        return new Builder(url);
    }

    public static class Builder {
        private final String url;
        private String method = "GET";
        private final Map<String, String> headers = new HashMap<>();

        private Builder(String url) { this.url = url; }

        public Builder method(String m) { this.method = m; return this; }
        public Builder header(String k, String v) { headers.put(k, v); return this; }
        public HttpRequest build() { return new HttpRequest(this); }
    }
}`

    },
    {

      id: 'java-completablefuture',

      name: 'Completable Future Chain',

      code: `import java.util.concurrent.CompletableFuture;

public CompletableFuture<UserProfile> loadProfile(String userId) {
    return api.fetchUser(userId)
        .thenCompose(user ->
            api.fetchPreferences(user.id())
                .thenApply(prefs -> new UserProfile(user, prefs)))
        .exceptionally(ex -> {
            logger.error("Failed to load profile", ex);
            return UserProfile.empty();
        });
}`

    },
    {
      id: 'java-singleton',
      name: 'Thread-Safe Singleton',
      code: `public class DatabaseConnection {
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
}`
    },
    {
      id: 'java-generic-stack',
      name: 'Generic Stack',
      code: `import java.util.ArrayList;
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
}`
    },
    {
      id: 'java-interface-default',
      name: 'Interface With Default Method',
      code: `public interface Shape {
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
}`
    },
    {
      id: 'java-stream-filter',
      name: 'Stream Filtering',
      code: `import java.util.List;
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
}`
    },
    {
      id: 'java-optional',
      name: 'Optional Chaining',
      code: `import java.util.Optional;

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
}`
    },
    {
      id: 'java-merge-sort',
      name: 'Merge Sort',
      code: `import java.util.Arrays;

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
}`
    },
    {
      id: 'java-optional-pattern',
      name: 'Optional Pattern Matching',
      code: `import java.util.Optional;

public class Handler {
    public String process(Optional<String> input) {
        return switch (input) {
            case Optional<String>(var s) when !s.isBlank() -> s.toUpperCase();
            case Optional<String>(var s) -> "(empty)";
            case null -> "(none)";
        };
    }
}`
    },
    {
      id: 'java-records',
      name: 'Java Records',
      code: `public record Money(long amount, String currency) {
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
}`
    },
    {
      id: 'java-completable-future',
      name: 'Completable Future Chain',
      code: `import java.util.concurrent.CompletableFuture;

public class Main {
    public static void main(String[] args) {
        CompletableFuture<String> future = CompletableFuture
            .supplyAsync(() -> "Hello")
            .thenApply(s -> s + ", World")
            .thenApply(String::toUpperCase);
        System.out.println(future.join());
    }
}`
    }
  ],

  go: [
    {
      id: 'go-goroutine',
      name: 'Worker Pool',
      code: `package main

import (
    "fmt"
    "sync"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for j := range jobs {
        results <- j * 2
    }
}`
    },
    {
      id: 'go-error-wrap',
      name: 'Wrapped HTTP Error',
      code: `func fetchWithTimeout(url string, timeout time.Duration) (*http.Response, error) {
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("building request: %w", err)
    }
    return http.DefaultClient.Do(req)
}`
    },
    {
      id: 'go-stack',
      name: 'Generic Stack',
      code: `type Stack struct {
    items []int
}

func (s *Stack) Push(item int) {
    s.items = append(s.items, item)
}

func (s *Stack) Pop() (int, error) {
    if len(s.items) == 0 {
        return 0, errors.New("stack is empty")
    }
    last := len(s.items) - 1
    item := s.items[last]
    s.items = s.items[:last]
    return item, nil
}`
    },
    {
      id: 'go-mutex-cache',
      name: 'Mutex-Protected Cache',
      code: `type Cache struct {
    mu    sync.RWMutex
    items map[string]int
}

func (c *Cache) Get(key string) (int, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    value, ok := c.items[key]
    return value, ok
}

func (c *Cache) Set(key string, value int) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.items[key] = value
}`
    },
    {
      id: 'go-generics',
      name: 'Generic Map Function',
      code: `func Map[T, U any](items []T, transform func(T) U) []U {
    result := make([]U, len(items))
    for i, item := range items {
        result[i] = transform(item)
    }
    return result
}`
    },
    {
      id: 'go-binary-search',
      name: 'Binary Search',
      code: `func BinarySearch(items []int, target int) int {
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
}`
    },
  
    {

      id: 'go-channel-fanout',

      name: 'Channel Fan-Out',

      code: `package main

import (
    "context"
    "sync"
)

func fanOut(ctx context.Context, input <-chan int, workers int) []<-chan int {
    channels := make([]<-chan int, workers)
    for i := 0; i < workers; i++ {
        out := make(chan int)
        channels[i] = out
        go func() {
            defer close(out)
            for {
                select {
                case <-ctx.Done():
                    return
                case v, ok := <-input:
                    if !ok {
                        return
                    }
                    select {
                    case out <- v * v:
                    case <-ctx.Done():
                        return
                    }
                }
            }
        }()
    }
    return channels
}`

    },
    {

      id: 'go-http-middleware',

      name: 'HTTP Middleware',

      code: `package http

import (
    "log"
    "net/http"
    "time"
)

func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("panic: %v", err)
                http.Error(w, "internal server error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}`

    },
    {

      id: 'go-defer-pattern',

      name: 'Defer Cleanup',

      code: `func processFile(path string) (string, error) {
    file, err := os.Open(path)
    if err != nil {
        return "", fmt.Errorf("opening %s: %w", path, err)
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)
    var lines []string
    for scanner.Scan() {
        lines = append(lines, scanner.Text())
    }
    if err := scanner.Err(); err != nil {
        return "", fmt.Errorf("scanning %s: %w", path, err)
    }
    return strings.Join(lines, "\\n"), nil
}`

    },
    {
      id: 'go-goroutine',
      name: 'Worker Pool',
      code: `package main

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
}`
    },
    {
      id: 'go-error-wrap',
      name: 'Wrapped HTTP Error',
      code: `package main

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
}`
    },
    {
      id: 'go-stack',
      name: 'Generic Stack',
      code: `package main

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
}`
    },
    {
      id: 'go-mutex-cache',
      name: 'Mutex-Protected Cache',
      code: `package main

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
}`
    },
    {
      id: 'go-generics',
      name: 'Generic Map Function',
      code: `package main

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
}`
    },
    {
      id: 'go-binary-search',
      name: 'Binary Search',
      code: `package main

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
}`
    },
    {
      id: 'go-http-server',
      name: 'Tiny HTTP Server',
      code: `package main

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
}`
    },
    {
      id: 'go-sort-custom',
      name: 'Custom Sort (Slices.SortFunc)',
      code: `package main

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
}`
    },
    {
      id: 'go-defer-cleanup',
      name: 'Defer Cleanup Pattern',
      code: `package main

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
}`
    }
  ],

  rust: [
    {
      id: 'rust-result',
      name: 'Result Handling',
      code: `use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}`
    },
    {
      id: 'rust-enum-match',
      name: 'Enum Pattern Match',
      code: `enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
        Shape::Rectangle { width, height } => width * height,
    }
}`
    },
    {
      id: 'rust-generic-stack',
      name: 'Generic Stack',
      code: `struct Stack<T> {
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
}`
    },
    {
      id: 'rust-iterator-chain',
      name: 'Iterator Chain',
      code: `fn even_squares(numbers: &[i32]) -> Vec<i32> {
    numbers
        .iter()
        .filter(|&&n| n % 2 == 0)
        .map(|&n| n * n)
        .collect()
}`
    },
    {
      id: 'rust-trait',
      name: 'Trait With Default',
      code: `trait Greet {
    fn name(&self) -> String;

    fn greet(&self) -> String {
        format!("Hello, {}!", self.name())
    }
}

struct Person {
    name: String,
}

impl Greet for Person {
    fn name(&self) -> String {
        self.name.clone()
    }
}`
    },
    {
      id: 'rust-mutex',
      name: 'Shared State With Mutex',
      code: `use std::sync::{Arc, Mutex};
use std::thread;

fn increment_counter() -> i32 {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            *counter.lock().unwrap() += 1;
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
    *counter.lock().unwrap()
}`
    },
  
    {

      id: 'rust-async-join',

      name: 'Async Join',

      code: `use tokio::try_join;

async fn load_dashboard(user_id: u64) -> Result<Dashboard, AppError> {
    let (profile, settings, stats) = try_join!(
        fetch_profile(user_id),
        fetch_settings(user_id),
        fetch_stats(user_id),
    )?;
    Ok(Dashboard { profile, settings, stats })
}`

    },
    {

      id: 'rust-iterator-sum',

      name: 'Sum With Closure',

      code: `fn total_revenue(orders: &[Order]) -> f64 {
    orders
        .iter()
        .filter(|o| o.status == OrderStatus::Paid)
        .map(|o| o.amount)
        .sum()
}`

    },
    {

      id: 'rust-lifetime',

      name: 'Lifetime Annotations',

      code: `struct Parser<'a> {
    input: &'a str,
    position: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Self { input, position: 0 }
    }

    fn peek(&self) -> Option<char> {
        self.input[self.position..].chars().next()
    }
}`

    },
    {
      id: 'rust-result',
      name: 'Result Handling',
      code: `use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}`
    },
    {
      id: 'rust-enum-match',
      name: 'Enum Pattern Match',
      code: `enum Shape {
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
}`
    },
    {
      id: 'rust-generic-stack',
      name: 'Generic Stack',
      code: `struct Stack<T> {
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
}`
    },
    {
      id: 'rust-iterator-chain',
      name: 'Iterator Chain',
      code: `fn even_squares(numbers: &[i32]) -> Vec<i32> {
    numbers
        .iter()
        .filter(|&&n| n % 2 == 0)
        .map(|&n| n * n)
        .collect()
}

fn main() {
    let v = vec![1, 2, 3, 4, 5, 6];
    println!("{:?}", even_squares(&v));
}`
    },
    {
      id: 'rust-trait',
      name: 'Trait With Default',
      code: `trait Greet {
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
}`
    },
    {
      id: 'rust-mutex',
      name: 'Shared State With Mutex',
      code: `use std::sync::{Arc, Mutex};
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
}`
    },
    {
      id: 'rust-error-trait',
      name: 'Custom Error Type',
      code: `use std::fmt;

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
}`
    },
    {
      id: 'rust-iter-find',
      name: 'Find with Iterator',
      code: `fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6];
    let even = numbers.iter().find(|&&n| n % 2 == 0);
    println!("First even: {:?}", even);

    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);
}`
    },
    {
      id: 'rust-btreemap',
      name: 'Sorted BTreeMap',
      code: `use std::collections::BTreeMap;

fn main() {
    let mut map = BTreeMap::new();
    map.insert("banana", 3);
    map.insert("apple", 5);
    map.insert("cherry", 1);

    for (key, val) in &map {
        println!("{}: {}", key, val);
    }
}`
    }
  ],

  kotlin: [
    {
      id: 'kt-coroutines',
      name: 'Flow Collector',
      code: `import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

fun fetchNumbers(): Flow<Int> = flow {
    for (i in 1..5) {
        kotlinx.coroutines.delay(100)
        emit(i)
    }
}`
    },
    {
      id: 'kt-data-class',
      name: 'Data Class With Copy',
      code: `data class User(
    val id: Int,
    val name: String,
    val email: String
)

fun anonymize(user: User): User =
    user.copy(name = "Anonymous", email = "hidden@example.com")`
    },
    {
      id: 'kt-sealed-class',
      name: 'Sealed Result Type',
      code: `sealed class Result<out T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Failure(val error: Throwable) : Result<Nothing>()
}

fun <T> Result<T>.getOrNull(): T? = when (this) {
    is Result.Success -> value
    is Result.Failure -> null
}`
    },
    {
      id: 'kt-extension-function',
      name: 'Extension Function',
      code: `fun String.isValidEmail(): Boolean {
    val pattern = Regex("^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\\\.[A-Za-z]{2,})$")
    return pattern.matches(this)
}`
    },
    {
      id: 'kt-scope-functions',
      name: 'Scope Functions',
      code: `class Config {
    var timeout: Int = 30
    var retries: Int = 3
}

val config = Config().apply {
    timeout = 60
    retries = 5
}`
    },
  
    {

      id: 'kt-coroutine-retry',

      name: 'Coroutine Retry',

      code: `import kotlinx.coroutines.delay
import kotlin.math.pow

suspend fun <T> retryWithBackoff(
    attempts: Int = 5,
    initialDelayMs: Long = 100,
    block: suspend () -> T,
): T {
    var currentDelay = initialDelayMs
    repeat(attempts - 1) { attempt ->
        try {
            return block()
        } catch (e: Exception) {
            if (attempt == attempts - 1) throw e
            delay(currentDelay)
            currentDelay = (currentDelay * 2.0.pow(attempt.toDouble())).toLong()
        }
    }
    return block()
}`

    },
    {

      id: 'kt-null-safety',

      name: 'Safe Call Chain',

      code: `fun describeUser(user: User?): String {
    return user
        ?.takeIf { it.isActive }
        ?.profile
        ?.let { "\${it.name} (\${it.role})" }
        ?: "Anonymous"
}`

    },
    {
      id: 'kt-coroutines',
      name: 'Flow Collector',
      code: `import kotlinx.coroutines.flow.Flow
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
}`
    },
    {
      id: 'kt-data-class',
      name: 'Data Class With Copy',
      code: `data class User(
    val id: Int,
    val name: String,
    val email: String
)

fun main() {
    val original = User(1, "Ada", "ada@example.com")
    val updated = original.copy(name = "Grace")
    println(original)
    println(updated)
}`
    },
    {
      id: 'kt-sealed-class',
      name: 'Sealed Result Type',
      code: `sealed class Result<out T> {
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
}`
    },
    {
      id: 'kt-extension-function',
      name: 'Extension Function',
      code: `fun String.isPalindrome(): Boolean {
    val clean = this.lowercase().filter { it.isLetterOrDigit() }
    return clean == clean.reversed()
}

fun main() {
    println("A man, a plan, a canal: Panama".isPalindrome())
    println("Hello, world".isPalindrome())
}`
    },
    {
      id: 'kt-scope-functions',
      name: 'Scope Functions',
      code: `class Config {
    var timeout: Int = 30
    var retries: Int = 3
}

fun main() {
    val config = Config().apply {
        timeout = 60
        retries = 5
    }
    println(config)
}`
    },
    {
      id: 'kt-scope-function-let',
      name: 'Scope Function let',
      code: `fun processName(name: String?): Int {
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
}`
    },
    {
      id: 'kt-sequence-builder',
      name: 'Sequence Builder',
      code: `fun fibonacci(): Sequence<Long> = sequence {
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
}`
    },
    {
      id: 'kt-coroutine-async',
      name: 'Coroutines: async / await',
      code: `import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.delay

suspend fun fetchUser(id: Int): String {
    delay(100)
    return "User($id)\`
}

suspend fun fetchOrders(user: String): List<String> {
    delay(100)
    return listOf("$user-order-1", "$user-order-2")
}

suspend fun loadDashboard(): String = coroutineScope {
    val user = async { fetchUser(1) }
    val orders = async { fetchOrders(user.await()) }
    "\\\${user.await()} with \\\${orders.await().size} orders"
}

fun main() = kotlinx.coroutines.runBlocking {
    println(loadDashboard())
`
    },
    {
      id: 'kt-extension-list',
      name: 'List Extensions',
      code: `fun <T> List<T>.secondOrNull(): T? =
    if (size >= 2) this[1] else null

fun <T> List<T>.penultimate(): T? =
    if (size >= 2) this[size - 2] else null

fun main() {
    val nums = listOf(10, 20, 30, 40)
    println(nums.secondOrNull())
    println(nums.penultimate())
}`
    }
  ],

  swift: [
    {
      id: 'swift-enum',
      name: 'Associated Value Enum',
      code: `enum NetworkResult<T> {
    case success(T)
    case failure(Error)
}

struct User: Codable {
    let id: Int
    let username: String
}`
    },
    {
      id: 'swift-protocol',
      name: 'Protocol With Default',
      code: `protocol Greetable {
    var name: String { get }
    func greet() -> String
}

extension Greetable {
    func greet() -> String {
        "Hello, \\(name)!"
    }
}`
    },
    {
      id: 'swift-generic-func',
      name: 'Generic Swap Function',
      code: `func swapValues<T>(_ a: inout T, _ b: inout T) {
    let temp = a
    a = b
    b = temp
}`
    },
    {
      id: 'swift-optional-chaining',
      name: 'Optional Chaining',
      code: `struct Address {
    var city: String?
}

struct Profile {
    var address: Address?
}

func resolveCity(_ profile: Profile) -> String {
    profile.address?.city ?? "Unknown"
}`
    },
    {
      id: 'swift-async-await',
      name: 'Async Fetch',
      code: `func fetchUser(id: Int) async throws -> User {
    let url = URL(string: "https://api.example.com/users/\\(id)")!
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}`
    },
  
    {

      id: 'swift-result-builder',

      name: 'Result Builder',

      code: `@resultBuilder
struct StringBuilder {
    static func buildBlock(_ components: String...) -> String {
        components.joined(separator: " ")
    }
}

func greet(@StringBuilder _ build: () -> String) -> String {
    "Hello, " + build()
}

let message = greet {
    "world"
    "from"
    "Swift"
}`

    },
    {

      id: 'swift-actor',

      name: 'Actor Concurrency',

      code: `actor BankAccount {
    private var balance: Decimal = 0

    func deposit(_ amount: Decimal) {
        balance += amount
    }

    func withdraw(_ amount: Decimal) -> Bool {
        guard balance >= amount else { return false }
        balance -= amount
        return true
    }

    func currentBalance() -> Decimal {
        balance
    }
}`

    },
    {
      id: 'swift-enum',
      name: 'Associated Value Enum',
      code: `enum NetworkResult<T> {
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
}`
    },
    {
      id: 'swift-protocol',
      name: 'Protocol With Default',
      code: `protocol Greetable {
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

let u = User(name: "Ada")
print(u.greet())`
    },
    {
      id: 'swift-generic-func',
      name: 'Generic Swap Function',
      code: `func swap<T>(_ a: inout T, _ b: inout T) {
    let tmp = a
    a = b
    b = tmp
}

var x = 1
var y = 2
swap(&x, &y)
print("\\(x), \\(y)")`
    },
    {
      id: 'swift-optional-chaining',
      name: 'Optional Chaining',
      code: `struct Address {
    var city: String?
}

struct Profile {
    var address: Address?
}

func resolveCity(_ profile: Profile) -> String {
    return profile.address?.city ?? "Unknown\`
}

let p = Profile(address: Address(city: "Berlin"))
print(resolveCity(p))`
    },
    {
      id: 'swift-async-fetch',
      name: 'Async Fetch',
      code: `func fetchUser(id: Int) async throws -> User {
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
}`
    },
    {
      id: 'swift-result-builder',
      name: 'Result Builder',
      code: `@resultBuilder
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
print(message)`
    },
    {
      id: 'swift-actor',
      name: 'Actor Concurrency',
      code: `actor Counter {
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
RunLoop.main.run(until: Date(timeIntervalSinceNow: 1))`
    },
    {
      id: 'swift-property-wrapper',
      name: 'Property Wrapper',
      code: `@propertyWrapper
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
print(s.volume)`
    },
    {
      id: 'swift-closures',
      name: 'Capturing Closures',
      code: `func makeCounter() -> () -> Int {
    var count = 0
    return { count += 1; return count }
}

let counter = makeCounter()
print(counter())
print(counter())
print(counter())`
    }
  ],

  html: [
    {
      id: 'html-form',
      name: 'Accessible Form',
      code: `<form class="login-card" method="POST" action="/login">
  <label for="user-email">Email Address</label>
  <input type="email" id="user-email" name="email" required autocomplete="email" />
  <button type="submit" class="btn btn-primary">Sign In</button>
</form>`
    },
    {
      id: 'html-semantic-layout',
      name: 'Semantic Page Layout',
      code: `<body>
  <header>
    <nav aria-label="Primary">
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <main>
    <article>
      <h1>Article Title</h1>
      <p>Article content goes here.</p>
    </article>
  </main>
  <footer>&copy; 2024 KeyFlow</footer>
</body>`
    },
    {
      id: 'html-table',
      name: 'Data Table',
      code: `<table>
  <caption>Recent Sessions</caption>
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">WPM</th>
      <th scope="col">Accuracy</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2024-01-15</td>
      <td>95</td>
      <td>98%</td>
    </tr>
  </tbody>
</table>`
    },
    {
      id: 'html-dialog',
      name: 'Native Dialog Element',
      code: `<dialog id="confirm-dialog">
  <h2>Confirm Action</h2>
  <p>Are you sure you want to delete this session?</p>
  <menu>
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>Confirm</button>
  </menu>
</dialog>`
    },
  
    {

      id: 'html-article',

      name: 'Article With Time',

      code: `<article class="post">
  <header>
    <h2>Why Open Source Matters</h2>
    <p class="meta">
      By <a href="/authors/jane">Jane Doe</a>
      on <time datetime="2024-01-15">January 15, 2024</time>
    </p>
  </header>
  <p>Open source software powers most of the modern internet...</p>
  <footer>
    <a href="/posts/why-open-source">Read more</a>
  </footer>
</article>`

    },
    {

      id: 'html-progress',

      name: 'Accessible Progress Bar',

      code: `<div role="progressbar"
     aria-valuenow="65"
     aria-valuemin="0"
     aria-valuemax="100"
     aria-label="Test progress">
  <div class="progress-fill" style="width: 65%"></div>
  <span class="sr-only">65% complete</span>
</div>`

    },
    {
      id: 'html-form',
      name: 'Accessible Form',
      code: `<form class="login-card" method="POST" action="/login">
  <label for="user-email">Email Address</label>
  <input type="email" id="user-email" name="email" required autocomplete="email" />
  <button type="submit" class="btn btn-primary">Sign In</button>
</form>`
    },
    {
      id: 'html-semantic-layout',
      name: 'Semantic Page Layout',
      code: `<body>
  <header>
    <nav aria-label="Primary">
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <main>
    <article>
      <h1>Article Title</h1>
      <p>Article content goes here.</p>
    </article>
  </main>
  <footer>&copy; 2024 KeyFlow</footer>
</body>`
    },
    {
      id: 'html-table',
      name: 'Data Table',
      code: `<table>
  <caption>Recent Sessions</caption>
  <thead>
    <tr>
      <th scope="col">Date</th>
      <th scope="col">WPM</th>
      <th scope="col">Accuracy</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2024-01-15</td>
      <td>95</td>
      <td>98%</td>
    </tr>
  </tbody>
</table>`
    },
    {
      id: 'html-dialog',
      name: 'Native Dialog Element',
      code: `<dialog id="confirm-dialog">
  <h2>Confirm Action</h2>
  <p>Are you sure you want to delete this session?</p>
  <menu>
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>Confirm</button>
  </menu>
</dialog>`
    },
    {
      id: 'html-article-blog',
      name: 'Blog Post with Metadata',
      code: `<article>
  <header>
    <h1>The Joy of Small Modules</h1>
    <p>
      <time datetime="2024-01-15">January 15, 2024</time>
      &middot; 8 min read
    </p>
  </header>
  <p>Programs are made of parts, and parts are made of parts...</p>
  <footer>
    <p>Tags: <a href="/t/architecture">architecture</a>, <a href="/t/modules">modules</a></p>
  </footer>
</article>`
    },
    {
      id: 'html-progress',
      name: 'Progress Bar with ARIA',
      code: `<div role="progressbar" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100"
     aria-label="Test progress" class="progress">
  <div class="progress-fill" style="width: 65%"></div>
  <span class="sr-only">65% complete</span>
</div>`
    },
    {
      id: 'html-aria-tabs',
      name: 'ARIA Tabs',
      code: `<div role="tablist" aria-label="Settings tabs">
  <button role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1">
    General
  </button>
  <button role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2" tabindex="-1">
    Privacy
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">General settings</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>Privacy settings</div>`
    },
    {
      id: 'html-figure',
      name: 'Figure With Caption',
      code: `<figure>
  <img src="/images/wpm-chart.png" alt="WPM over time" width="600" height="300" />
  <figcaption>Words per minute over the last 30 days</figcaption>
</figure>`
    },
    {
      id: 'html-nav-breadcrumb',
      name: 'Breadcrumb Navigation',
      code: `<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/practice">Practice</a></li>
    <li><a href="/practice/typing">Typing</a></li>
    <li aria-current="page">Results</li>
  </ol>
</nav>`
    }
  ],

  css: [
    {
      id: 'css-grid',
      name: 'Glassmorphism Layout',
      code: `.glass-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}`
    },
    {
      id: 'css-custom-properties',
      name: 'Themeable Custom Properties',
      code: `:root {
  --color-bg: #0f0f12;
  --color-text: #e2e2e2;
  --space-unit: 8px;
}

[data-theme='light'] {
  --color-bg: #ffffff;
  --color-text: #111111;
}

.card {
  background: var(--color-bg);
  padding: calc(var(--space-unit) * 3);
}`
    },
    {
      id: 'css-flexbox-nav',
      name: 'Responsive Flexbox Nav',
      code: `.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 2rem;
}

@media (max-width: 640px) {
  .nav {
    flex-direction: column;
    align-items: flex-start;
  }
}`
    },
    {
      id: 'css-keyframe-animation',
      name: 'Keyframe Animation',
      code: `@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast {
  animation: fadeSlideIn 0.3s ease-out forwards;
}`
    },
    {
      id: 'css-container-query',
      name: 'Container Query',
      code: `.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}`
    },
  
    {

      id: 'css-has-selector',

      name: ':has() Selector',

      code: `.card:has(img) {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1rem;
}

.form-field:has(input:invalid) {
  border-color: var(--color-error);
}

.form-field:has(input:focus) {
  outline: 2px solid var(--color-accent);
}`

    },
    {

      id: 'css-dark-mode',

      name: 'Dark Mode With System Pref',

      code: `:root {
  --bg: #ffffff;
  --text: #111111;
  --border: #e5e5e5;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0c0c0d;
    --text: #ededed;
    --border: #2a2a30;
  }
}

body {
  background: var(--bg);
  color: var(--text);
  color-scheme: light dark;
}`

    },
    {

      id: 'css-transitions',

      name: 'Smooth Transitions',

      code: `.button {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  padding: 0.625rem 1.25rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: transform 120ms ease-out, background 180ms ease-out;
}

.button:hover {
  background: var(--color-accent-hover);
}

.button:active {
  transform: translateY(1px);
}`

    },
    {
      id: 'css-grid',
      name: 'Grid Layout',
      code: `.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
}`
    },
    {
      id: 'css-custom-properties',
      name: 'Themeable Custom Properties',
      code: `:root {
  --color-bg: #0f0f12;
  --color-text: #e2e2e2;
  --space-unit: 8px;
}

[data-theme='light'] {
  --color-bg: #ffffff;
  --color-text: #111111;
}

.card {
  background: var(--color-bg);
  color: var(--color-text);
  padding: calc(var(--space-unit) * 3);
}`
    },
    {
      id: 'css-flexbox-nav',
      name: 'Responsive Flexbox Nav',
      code: `.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem 2rem;
}

@media (max-width: 640px) {
  .nav {
    flex-direction: column;
    align-items: flex-start;
  }
}`
    },
    {
      id: 'css-keyframes',
      name: 'Keyframe Animation',
      code: `@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast {
  animation: fadeSlideIn 0.3s ease-out forwards;
}`
    },
    {
      id: 'css-container-query',
      name: 'Container Query',
      code: `.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}`
    },
    {
      id: 'css-houdini-paint',
      name: 'Custom Property Animation',
      code: `.progress {
  --progress: 0%;
  background: linear-gradient(to right, #3b82f6 var(--progress), #1f2937 var(--progress));
  height: 8px;
  border-radius: 4px;
  transition: --progress 0.4s ease;
  animation: fill 2s forwards;
}

@keyframes fill {
  to { --progress: 100%; }
}

@property --progress {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}`
    },
    {
      id: 'css-logical-properties',
      name: 'Logical Properties',
      code: `.card {
  margin-block: 1rem;
  margin-inline: auto;
  padding-block: 1.5rem;
  padding-inline: 2rem;
  border-start-start-radius: 0.75rem;
  border-end-end-radius: 0.75rem;
  max-inline-size: 60ch;
}

.dual {
  display: flex;
  flex-direction: row;
}`
    },
    {
      id: 'css-cascade-layers',
      name: 'Cascade Layers',
      code: `@layer reset, base, components, utilities;

@layer reset {
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
}

@layer base {
  body {
    font-family: system-ui, sans-serif;
    line-height: 1.5;
  }
}

@layer components {
  .button {
    padding: 0.5rem 1rem;
    background: var(--color-primary, blue);
    color: white;
  }
}`
    },
    {
      id: 'css-fluid-typography',
      name: 'Fluid Typography',
      code: `h1 {
  font-size: clamp(1.5rem, 2vw + 1rem, 3rem);
  line-height: 1.2;
  font-weight: 700;
}

h2 {
  font-size: clamp(1.25rem, 1.5vw + 0.75rem, 2rem);
  line-height: 1.3;
}

p {
  font-size: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
  line-height: 1.6;
}`
    }
  ],

  sql: [
    {
      id: 'sql-join',
      name: 'Window Aggregation',
      code: `SELECT
    users.id,
    users.username,
    COUNT(sessions.id) AS total_sessions,
    AVG(sessions.wpm) AS average_wpm,
    RANK() OVER (ORDER BY AVG(sessions.wpm) DESC) AS user_rank
FROM users
LEFT JOIN sessions ON users.id = sessions.user_id
GROUP BY users.id, users.username;`
    },
    {
      id: 'sql-cte',
      name: 'Common Table Expression',
      code: `WITH recent_sessions AS (
    SELECT user_id, wpm, accuracy, created_at
    FROM sessions
    WHERE created_at >= NOW() - INTERVAL '30 days'
)
SELECT user_id, AVG(wpm) AS avg_wpm
FROM recent_sessions
GROUP BY user_id
HAVING AVG(wpm) > 60;`
    },
    {
      id: 'sql-upsert',
      name: 'Upsert Statement',
      code: `INSERT INTO user_settings (user_id, theme, sound_enabled)
VALUES ($1, $2, $3)
ON CONFLICT (user_id)
DO UPDATE SET
    theme = EXCLUDED.theme,
    sound_enabled = EXCLUDED.sound_enabled;`
    },
    {
      id: 'sql-index',
      name: 'Index And Constraint',
      code: `CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    wpm INTEGER NOT NULL CHECK (wpm >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);`
    },
  
    {

      id: 'sql-recursive-cte',

      name: 'Recursive CTE',

      code: `WITH RECURSIVE org_tree AS (
    SELECT id, name, manager_id, 1 AS depth
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    SELECT e.id, e.name, e.manager_id, t.depth + 1
    FROM employees e
    INNER JOIN org_tree t ON e.manager_id = t.id
)
SELECT id, name, depth FROM org_tree ORDER BY depth, name;`

    },
    {

      id: 'sql-window-funcs',

      name: 'Running Total',

      code: `SELECT
    order_date,
    daily_revenue,
    SUM(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_total,
    AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS seven_day_avg
FROM daily_sales
ORDER BY order_date;`

    },
    {

      id: 'sql-json-ops',

      name: 'JSON Column Query',

      code: `SELECT
    id,
    metadata->>'name' AS name,
    metadata->>'plan' AS plan,
    (metadata->>'usage_minutes')::int AS usage_minutes
FROM accounts
WHERE metadata->>'plan' = 'pro'
  AND (metadata->>'usage_minutes')::int > 1000
ORDER BY usage_minutes DESC;`

    },
    {
      id: 'sql-window-funcs',
      name: 'Window Functions',
      code: `SELECT
    user_id,
    amount,
    SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at) AS running_total,
    RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS amount_rank
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY user_id, created_at DESC;`
    },
    {
      id: 'sql-cte',
      name: 'Common Table Expression',
      code: `WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', created_at) AS month,
        SUM(amount) AS total
    FROM orders
    GROUP BY 1
),
previous_month AS (
    SELECT total FROM monthly_sales ORDER BY month DESC LIMIT 1 OFFSET 1
)
SELECT
    ms.month,
    ms.total,
    ms.total - pm.total AS change
FROM monthly_sales ms
CROSS JOIN previous_month pm
ORDER BY ms.month DESC;`
    },
    {
      id: 'sql-upsert',
      name: 'Upsert (ON CONFLICT)',
      code: `INSERT INTO user_settings (user_id, theme, sound_enabled)
VALUES ($1, $2, $3)
ON CONFLICT (user_id)
DO UPDATE SET
    theme = EXCLUDED.theme,
    sound_enabled = EXCLUDED.sound_enabled
RETURNING updated_at;`
    },
    {
      id: 'sql-index-constraint',
      name: 'Index and Constraint',
      code: `CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wpm INTEGER NOT NULL CHECK (wpm >= 0),
    accuracy NUMERIC(4, 2) CHECK (accuracy BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);`
    },
    {
      id: 'sql-recursive-cte',
      name: 'Recursive CTE (Org Tree)',
      code: `WITH RECURSIVE org_tree AS (
    SELECT id, name, manager_id, 1 AS depth
    FROM employees
    WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, t.depth + 1
    FROM employees e
    JOIN org_tree t ON e.manager_id = t.id
)
SELECT id, name, depth
FROM org_tree
ORDER BY depth, name;`
    },
    {
      id: 'sql-aggregates-having',
      name: 'GROUP BY with HAVING',
      code: `SELECT
    user_id,
    COUNT(*) AS session_count,
    AVG(wpm) AS avg_wpm,
    MAX(wpm) AS best_wpm,
    MIN(accuracy) AS worst_accuracy
FROM sessions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(*) >= 3 AND AVG(wpm) > 50
ORDER BY avg_wpm DESC;`
    },
    {
      id: 'sql-json-ops',
      name: 'JSON Column Query',
      code: `SELECT
    id,
    metadata->>'name' AS name,
    metadata->>'plan' AS plan,
    (metadata->>'usage_minutes')::int AS usage_minutes
FROM accounts
WHERE metadata->>'plan' = 'pro'
  AND (metadata->>'usage_minutes')::int > 1000
ORDER BY usage_minutes DESC;`
    },
    {
      id: 'sql-pagination',
      name: 'Cursor-Based Pagination',
      code: `SELECT id, title, created_at
FROM articles
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;`
    },
    {
      id: 'sql-explain',
      name: 'EXPLAIN ANALYZE',
      code: `EXPLAIN ANALYZE
SELECT u.id, u.name, COUNT(s.id) AS session_count
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id
ORDER BY session_count DESC
LIMIT 10;`
    },
    {
      id: 'sql-materialized-view',
      name: 'Materialized View',
      code: `CREATE MATERIALIZED VIEW daily_user_stats AS
SELECT
    user_id,
    DATE(created_at) AS day,
    COUNT(*) AS sessions,
    AVG(wpm) AS avg_wpm,
    MAX(wpm) AS best_wpm
FROM sessions
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY user_id, DATE(created_at);

CREATE UNIQUE INDEX idx_daily_user_stats
  ON daily_user_stats(user_id, day);`
    }
  ],

  json: [
    {
      id: 'json-config',
      name: 'KeyFlow Settings Schema',
      code: `{
  "theme": "obsidian-ritualist",
  "sound": {
    "enabled": true,
    "pack": "creamy-switch",
    "volume": 0.8
  },
  "fairPlay": {
    "preventPaste": true,
    "notifyOnViolation": true
  }
}`
    },
    {
      id: 'json-api-response',
      name: 'API Response Envelope',
      code: `{
  "status": "success",
  "data": {
    "id": 42,
    "wpm": 95,
    "accuracy": 97.8,
    "mode": "paragraph"
  },
  "meta": {
    "requestId": "a1b2c3d4",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`
    },
    {
      id: 'json-package',
      name: 'Package Manifest',
      code: `{
  "name": "keyflow",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "vite": "^6.3.5"
  }
}`
    },
  
    {

      id: 'json-tsconfig',

      name: 'TSConfig',

      code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "jsx": "preserve"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`

    },
    {

      id: 'json-eslint',

      name: 'ESLint Config',

      code: `{
  "root": true,
  "env": { "browser": true, "es2022": true },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}`

    },
    {
      id: 'json-config',
      name: 'Application Config',
      code: `{
  "app": {
    "name": "KeyFlow",
    "version": "1.0.0",
    "locale": "en"
  },
  "server": {
    "port": 8080,
    "timeout": 30,
    "cors": ["https://example.com"]
  },
  "features": {
    "leaderboards": true,
    "multiplayer": false,
    "tournaments": true
  }
}`
    },
    {
      id: 'json-api-response',
      name: 'API Response Envelope',
      code: `{
  "status": "success",
  "data": {
    "users": [
      { "id": 1, "name": "Ada", "email": "ada@example.com },\\n      { "id": 2, "name": "Grace", "email": "grace@example.com" }\\n    ],\\n    "pagination": { "page": 1, "per_page": 20, "total": 42 }\\n  },\\n  "meta": {\\n    "requestId": "a1b2c3",\\n    "timestamp": "2024-01-15T10:30:00Z"\\n  }\\n}`
    },
    {
      id: 'json-package',
      name: 'Package Manifest',
      code: `{
  "name": "@keyflow/typing-engine",
  "version": "2.1.0",
  "description": "Core typing engine for KeyFlow",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "fuse.js": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}`
    },
    {
      id: 'json-typed-config',
      name: 'Typed Config Schema',
      code: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "title": "UserSettings",
  "properties": {
    "theme": {
      "type": "string",
      "enum": ["paper", "carbon", "dusk", "aurora", "sunset", "serif", "mono"],
      "default": "paper"
    },
    "soundEnabled": { "type": "boolean", "default": true },
    "soundVolume": { "type": "number", "minimum": 0, "maximum": 1, "default": 0.5 },
    "language": { "type": "string", "default": "en }\\n  },\\n  "required": ["theme", "language"]\\n}`
    },
    {
      id: 'json-i18n',
      name: 'i18n Translation File',
      code: `{
  "en": {
    "app.title": "KeyFlow",
    "nav.practice": "Practice",
    "nav.developer": "Developer",
    "action.start": "Start typing",
    "message.complete": "Test complete!"
  },
  "fr": {
    "app.title": "KeyFlow",
    "nav.practice": "Pratique",
    "nav.developer": "Développeur",
    "action.start": "Commencer à taper",
    "message.complete": "Test terminé !"
  },
  "de": {
    "app.title": "KeyFlow",
    "nav.practice": "Übung",
    "nav.developer": "Entwickler",
    "action.start": "Tippen starten",
    "message.complete": "Test abgeschlossen!"
  }
}`
    },
    {
      id: 'json-tsconfig',
      name: 'TypeScript Config',
      code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "jsx": "preserve"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`
    },
    {
      id: 'json-vite',
      name: 'Vite Config',
      code: `{
  "name": "keyflow",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "firebase": "^12.0.0"
  },
  "devDependencies": {
    "playwright": "^1.40.0",
    "vite": "^6.0.0"
  }
}`
    },
    {
      id: 'json-eslint',
      name: 'ESLint Config',
      code: `{
  "root": true,
  "env": { "browser": true, "es2022": true },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_ }]\\n  }\\n}`
    },
    {
      id: 'json-lighthouse',
      name: 'Lighthouse Audit Config',
      code: `{
  "ci": {
    "collect": {
      "url": ["http://localhost:8080/"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.9 }]
      }
    }
  }
}`
    }
  ],

  markdown: [
    {
      id: 'md-readme',
      name: 'Open Source Readme',
      code: `# KeyFlow Platform

The definitive open-source typing platform for developers.

## Features
- **Developer Workspace**: Practice code snippets across 16 languages.
- **Fair Play**: Guaranteed typing metrics integrity.
- **Typing Replay**: Real-time canvas playback.`
    },
    {
      id: 'md-changelog',
      name: 'Changelog Entry',
      code: `## [1.2.0] - 2024-01-15

### Added
- Paragraph practice mode with categorized prose content.
- Raw WPM tracking alongside net WPM.

### Fixed
- Mode selector no longer resets state on switch.`
    },
    {
      id: 'md-api-docs',
      name: 'API Documentation Block',
      code: `## \`getText(mode, difficulty, options)\`

Retrieves practice text for the given mode.

| Parameter    | Type     | Description                |
|--------------|----------|----------------------------|
| \`mode\`       | string   | One of the supported modes |
| \`difficulty\` | string   | easy, medium, hard, expert |
| \`options\`    | object   | Mode-specific options      |`
    },
  
    {

      id: 'md-feature-grid',

      name: 'Feature Grid Table',

      code: `| Feature              | Status   | Notes                  |
|----------------------|----------|------------------------|
| Live WPM             | Stable   | Updated per keystroke  |
| Code highlighting    | Stable   | 16 languages           |
| Replay               | Beta     | Storage-bounded        |
| Cloud sync           | Planned  | Roadmap Q2             |`

    },
    {

      id: 'md-install',

      name: 'Install Section',

      code: `## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/keyflow/keyflow.git
cd keyflow

# Install dependencies
npm install

# Start the dev server
npm run dev
\`\`\`

Open <http://localhost:5173> to view it in your browser.`

    },
    {
      id: 'md-readme',
      name: 'Open Source Readme',
      code: `# KeyFlow Typing Engine

A fast, accessible typing engine for the modern web.

## Features

- **Real-time WPM and accuracy** - every keystroke updates the metrics.
- **Multi-language support** - paragraphs in 10 languages: English, French, German, Italian, Portuguese, Swedish, Polish, Czech, Turkish, Romanian.
- **Developer mode** - practice code in 16 programming languages with proper indentation and bracket tracking.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## License

MIT. See [LICENSE](./LICENSE) for details.`
    },
    {
      id: 'md-changelog',
      name: 'Changelog Entry',
      code: `## [2.1.0] - 2024-01-15

### Added
- **Multilingual prose** - paragraphs in French, German, Italian, Portuguese, Swedish, Polish, Czech, Turkish, and Romanian, each with id, source, difficulty, category, language, and name fields.
- **Named developer snippets** - every snippet in src/content/developer/languages.js has a human-readable name so the editor tab shows the program title.

### Changed
- Practice page now exposes a language selector inside the "More options" disclosure.
- The dev-page tab filename is derived from the snippet name (snake_case + language extension).

### Fixed
- Caret coordinate system: spans and caret now share the same container.
- Time mode actually has a timer - completion is wall-clock based.`
    },
    {
      id: 'md-api-docs',
      name: 'API Documentation Block',
      code: `## getText(mode, difficulty, options)

Retrieves practice text for the given mode.

### Parameters

| Parameter    | Type     | Description                |
|--------------|----------|----------------------------|
| mode         | string   | One of the supported modes |
| difficulty   | string   | easy, medium, hard, expert |
| options      | object   | Mode-specific options      |

### Returns

A promise resolving to a string. The string length depends on the
selected duration and difficulty.

### Example

\`\`\`js
const text = await getText("paragraph", "medium", { duration: 30 });
console.log(text.length);
\`\`\``
    },
    {
      id: 'md-feature-grid',
      name: 'Feature Grid Table',
      code: `| Feature              | Status   | Notes                  |
|----------------------|----------|------------------------|
| Multilingual prose   | Stable   | 9 non-English languages  |
| Live WPM             | Stable   | Updated per keystroke  |
| Replay               | Beta     | Storage-bounded        |
| Cloud sync           | Planned  | Roadmap Q2             |`
    },
    {
      id: 'md-contributing',
      name: 'Contributing Guide',
      code: `# Contributing

Thanks for your interest in making KeyFlow better. This document
explains how to set up a development environment and submit changes.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies with npm install.
3. Run the dev server with npm run dev.
4. Run the test suite with npm test.

## Pull Request Process

1. Make your changes in a feature branch.
2. Add tests for any new behaviour.
3. Ensure the full test suite still passes.
4. Submit a pull request describing your change.`
    },
    {
      id: 'md-install-section',
      name: 'Install Section',
      code: `## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/keyflow/keyflow.git
cd keyflow

# Install dependencies
npm install

# Start the dev server
npm run dev
\`\`\`

Open http://localhost:5173 to view it in your browser.`
    },
    {
      id: 'md-troubleshooting',
      name: 'Troubleshooting Section',
      code: `## Troubleshooting

### The dev server won't start

Make sure you are using Node 20 or later. Earlier versions are not
supported.

\`\`\`bash
node --version
\`\`\`

If the version is correct but the server still fails, try removing
node_modules and reinstalling:

\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Tests fail randomly

Run them with --run flag for sequential execution:

\`\`\`bash
npm test -- --run
\`\`\``
    },
    {
      id: 'md-license',
      name: 'License Block',
      code: `## License

MIT License

Copyright (c) 2024 KeyFlow Contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.`
    },
    {
      id: 'md-architecture',
      name: 'Architecture Diagram (ASCII)',
      code: `## Architecture

\`\`\`
                  +----------------+
                  |  Keyboard      |
                  +-------+--------+
                          |
                          v
                  +-------+--------+
                  |  InputEngine    |  (normalises events)
                  +-------+--------+
                          |
                          v
                  +-------+--------+
                  |  Session Model  |  (source of truth)
                  +-------+--------+
                          |
        +-----------------+------------------+
        |                 |                  |
        v                 v                  v
   +--------+      +------------+     +-----------+
   | Timer  |      |  Renderer  |     |  Stats    |
   +--------+      +------------+     +-----------+
\`\`\``
    },
    {
      id: 'md-roadmap',
      name: 'Roadmap Table',
      code: `## Roadmap

| Quarter | Milestone                          |
|---------|-------------------------------------|
| Q1 2024 | Multilingual prose support         |
| Q2 2024 | Adaptive weak-key training         |
| Q3 2024 | Cloud sync & leaderboards          |
| Q4 2024 | Public benchmark & methodology    |

Have a suggestion? Open an issue or join the discussion board.`
    }
  ],

  bash: [
    {
      id: 'bash-deploy',
      name: 'CI/CD Build Pipeline',
      code: `#!/usr/bin/env bash
set -euo pipefail

echo "==> Running production build..."
npm run build

echo "==> Deploying artifacts..."
rsync -avz --delete dist/ deploy@keyflow.app:/var/www/html/
echo "==> Deployment successful!"`
    },
    {
      id: 'bash-backup-script',
      name: 'Database Backup Script',
      code: `#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/var/backups/keyflow"
mkdir -p "$BACKUP_DIR"

pg_dump keyflow_production | gzip > "$BACKUP_DIR/backup-$TIMESTAMP.sql.gz"
find "$BACKUP_DIR" -mtime +7 -delete`
    },
    {
      id: 'bash-loop-retry',
      name: 'Retry Loop',
      code: `#!/usr/bin/env bash

retry() {
    local attempts=0
    local max_attempts=5
    until "$@"; do
        attempts=$((attempts + 1))
        if [ "$attempts" -ge "$max_attempts" ]; then
            echo "Command failed after $max_attempts attempts" >&2
            return 1
        fi
        sleep $((attempts * 2))
    done
}`
    },
    {
      id: 'bash-arg-parse',
      name: 'Argument Parsing',
      code: `#!/usr/bin/env bash

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done`
    },
  
    {

      id: 'bash-git-rotate',

      name: 'Git Branch Cleanup',

      code: `#!/usr/bin/env bash
set -euo pipefail

git fetch --all --prune
git for-each-ref --format='%(refname:short)' refs/heads/ \\
  | grep -E '^(feature|fix)/' \\
  | while read -r branch; do
      merged=$(git branch --merged main | grep -c "^  \${branch}\\$" || true)
      if [ "$merged" -gt 0 ]; then
        echo "Deleting merged branch: $branch"
        git branch -d "$branch"
      fi
    done`

    },
    {

      id: 'bash-system-info',

      name: 'System Info Reporter',

      code: `#!/usr/bin/env bash
echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "Kernel:   $(uname -r)"
echo "Distro:   $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
echo "Uptime:   $(uptime -p 2>/dev/null || uptime)"
echo "Memory:   $(free -h | awk '/Mem:/ {print $3 "/" $2}')"
echo "Disk:     $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " used)"}')`

    },
    {
      id: 'bash-deploy',
      name: 'CI/CD Build Pipeline',
      code: `#!/usr/bin/env bash
set -euo pipefail

echo "==> Running production build..."
npm run build

echo "==> Deploying artifacts..."
rsync -avz --delete dist/ deploy@keyflow.app:/var/www/html/
echo "==> Deployment successful!"`
    },
    {
      id: 'bash-backup-script',
      name: 'Database Backup Script',
      code: `#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/var/backups/keyflow"
mkdir -p "$BACKUP_DIR"

pg_dump keyflow_production | gzip > "$BACKUP_DIR/keyflow-$TIMESTAMP.sql.gz"

# Keep only the last 7 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup saved to $BACKUP_DIR/keyflow-$TIMESTAMP.sql.gz"`
    },
    {
      id: 'bash-loop-retry',
      name: 'Retry Loop with Backoff',
      code: `#!/usr/bin/env bash

retry() {
    local attempts=0
    local max_attempts=5
    until "$@"; do
        attempts=$((attempts + 1))
        if [ "$attempts" -ge "$max_attempts" ]; then
            echo "Command failed after $max_attempts attempts" >&2
            return 1
        fi
        sleep $((attempts * 2))
    done
}

retry curl --fail --silent https://api.example.com/health`
    },
    {
      id: 'bash-arg-parse',
      name: 'Argument Parsing',
      code: `#!/usr/bin/env bash

usage() {
    echo "Usage: $0 [-v] [-f FILE] NAME"
    exit 1
}

VERBOSE=false
FILE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--file)
            FILE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            NAME="$1"
            shift
            ;;
    esac
done

[[ -z "$NAME" ]] && usage

$VERBOSE && echo "Verbose mode enabled"
echo "Name: $NAME, File: $FILE"`
    },
    {
      id: 'bash-deps-check',
      name: 'Check Missing Dependencies',
      code: `#!/usr/bin/env bash

declare -a DEPS=("node" "npm" "git" "python3" "docker")

missing=()
for dep in "\${DEPS[@]}"; do
    if ! command -v "$dep" >/dev/null 2>&1; then
        missing+=("$dep")
    fi
done

if [ \${#missing[@]} -gt 0 ]; then
    echo "Missing: \${missing[*]}"
    echo "Install them before running this script."
    exit 1
fi

echo "All dependencies are present."`
    },
    {
      id: 'bash-log-rotation',
      name: 'Log Rotation Script',
      code: `#!/usr/bin/env bash

LOG_DIR="/var/log/keyflow"
ARCHIVE_DIR="/var/log/keyflow/archive"
MAX_SIZE="100M"

mkdir -p "$ARCHIVE_DIR"

for log in "$LOG_DIR"/*.log; do
    [ -f "$log" ] || continue
    size=$(stat -c%s "$log")
    if [ "$size" -gt 100000000 ]; then
        ts=$(date +%Y%m%d-%H%M%S)
        base=$(basename "$log" .log)
        gzip "$log"
        mv "\${log}.gz" "$ARCHIVE_DIR/\${base}-\${ts}.log.gz"
        touch "$log"
        echo "Rotated $log"
    fi
done`
    },
    {
      id: 'bash-file-watcher',
      name: 'File Watcher Loop',
      code: `#!/usr/bin/env bash

WATCH_DIR="\${1:-./src}"
EXT="\${2:-js}"

echo "Watching $WATCH_DIR for *.$EXT changes..."

last_hash=""
while true; do
    current_hash=$(find "$WATCH_DIR" -name "*.$EXT" -type f -exec md5sum {} \\; 2>/dev/null | sort | md5sum | cut -d' ' -f1)
    if [ "$current_hash" != "$last_hash" ] && [ -n "$last_hash" ]; then
        echo "Change detected at $(date +%H:%M:%S)"
    fi
    last_hash="$current_hash"
    sleep 2
done`
    },
    {
      id: 'bash-system-info',
      name: 'System Info Reporter',
      code: `#!/bin/bash

echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "Kernel:   $(uname -r)"
echo "OS:       $(uname -s)"
echo "Uptime:   $(uptime -p 2>/dev/null || uptime)"
echo

echo "=== Resources ==="
echo "Memory:   $(free -h | awk '/Mem:/ {print $3 " / " $2}')"
echo "Disk:     $(df -h / | awk 'NR==2 {print $3 " / " $2 " (" $5 ")\`}')"\\necho "Load:     $(uptime | awk -F'load average:' '{print $2}')"\\necho\\n\\necho "=== Network ==="\\nip -4 addr show 2>/dev/null | awk '/inet / && !/127.0.0.1/ {print "  " $2}' || echo "  (no info)`
    },
    {
      id: 'bash-text-processing',
      name: 'Log Analyzer',
      code: `#!/bin/bash

LOG="\${1:-/var/log/syslog}"
TOP_N=10

echo "Top $TOP_N error patterns in $LOG:"
grep -oE '[A-Z][a-zA-Z]+Error' "$LOG" 2>/dev/null |
    sort | uniq -c | sort -rn | head -n "$TOP_N" |
    awk '{printf "  %5d  %s\\n", $1, $2}'

echo
echo "Status code distribution:"
awk '/HTTP\\/1.1./ {for(i=1;i<=NF;i++) if($i ~ /^[0-9]{3}$/) print $i}' "$LOG" 2>/dev/null |
    sort | uniq -c | sort -rn | head -n 5`
    },
    {
      id: 'bash-ssh-deploy',
      name: 'SSH-Based Deployment',
      code: `#!/usr/bin/env bash
set -euo pipefail

HOST="\${1:-deploy@keyflow.app}"
REMOTE_DIR="/var/www/keyflow"

echo "==> Building locally..."
npm run build

echo "==> Syncing to $HOST..."
rsync -avz --delete \\
    --exclude 'node_modules' \\
    --exclude '.git' \\
    --exclude '.env' \\
    dist/ "\${HOST}:\${REMOTE_DIR}/"

echo "==> Reloading remote service..."
ssh "\${HOST}" 'sudo systemctl reload keyflow.service'

echo "==> Deployment complete!"`
    }
  ]
};
