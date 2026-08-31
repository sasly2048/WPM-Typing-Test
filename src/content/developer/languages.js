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

    }]
};
