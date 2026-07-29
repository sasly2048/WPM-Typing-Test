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
    const callbacks = this.#listeners.get(event) || [];
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
    }
  ]
};
