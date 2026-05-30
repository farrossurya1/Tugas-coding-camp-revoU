# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page, client-side web application built with plain HTML, CSS, and Vanilla JavaScript. It requires no build tools, no backend, and no external runtime dependencies beyond an optional charting library loaded via CDN. All state is held in memory during a session and persisted to the browser's `localStorage` API.

The application is structured around four visible UI regions:

1. **Input Form** — captures item name, amount, and category for a new transaction.
2. **Balance Display** — shows the running total of all transaction amounts.
3. **Transaction List** — scrollable list of every recorded transaction with a delete control per row.
4. **Pie Chart** — visualizes spending distribution across the three fixed categories (Food, Transport, Fun).

All four regions react synchronously to every add/delete event so the UI is always consistent with the in-memory state, which is itself always consistent with `localStorage`.

---

## Architecture

The application follows a simple **unidirectional data-flow** pattern without a framework:

```
User Action
    │
    ▼
Controller (app.js)
    │  reads / writes
    ▼
Store (store.js)  ◄──► localStorage
    │  notifies
    ▼
Renderer (render.js)
    │  updates DOM
    ▼
UI Components (HTML + CSS)
```

- **Store** is the single source of truth. It holds the in-memory transaction array and exposes `add`, `remove`, `getAll`, and `getTotals` methods. Every mutation writes to `localStorage` before returning.
- **Controller** wires DOM events to Store mutations and calls the Renderer after each mutation.
- **Renderer** is a collection of pure functions that accept the current state and update the relevant DOM nodes (list, balance, chart).
- **Validator** is a pure module that receives form field values and returns a structured result object (`{ valid: boolean, errors: { name?, amount?, category? } }`).

### File Structure

```
/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js        # Controller — event wiring, orchestration
    ├── store.js      # State management + localStorage I/O
    ├── validator.js  # Input validation (pure functions)
    ├── renderer.js   # DOM update functions
    └── chart.js      # Pie chart drawing (Canvas API or Chart.js)
```

### Dependency Decision

The pie chart is drawn using the **Canvas 2D API** directly (no external library). This keeps the project dependency-free and avoids CDN availability concerns. A lightweight custom `drawPieChart(canvas, segments)` function is sufficient for the three-category use case.

---

## Components and Interfaces

### Store (`store.js`)

```js
// Public API
store.add(transaction)        // → { ok: true } | { ok: false, error: string }
store.remove(id)              // → { ok: true } | { ok: false, error: string }
store.getAll()                // → Transaction[]
store.getTotals()             // → { Food: number, Transport: number, Fun: number, total: number }
store.load()                  // → { ok: true } | { ok: false, error: string }  (called on init)
```

`store.add` and `store.remove` write to `localStorage` **before** mutating the in-memory array. If the write fails, the in-memory array is not changed and `{ ok: false, error }` is returned.

### Validator (`validator.js`)

```js
// Pure function — no side effects
validator.validate({ name, amount, category })
// → { valid: true }
// → { valid: false, errors: { name?: string, amount?: string, category?: string } }
```

Validation rules:
- `name`: must be a non-empty string after trimming whitespace.
- `amount`: must parse as a finite number greater than zero.
- `category`: must be one of `["Food", "Transport", "Fun"]`.

### Renderer (`renderer.js`)

```js
renderer.renderList(transactions)   // Rebuilds the transaction list DOM
renderer.renderBalance(total)       // Updates the balance display text
renderer.renderChart(totals)        // Redraws the pie chart canvas
renderer.renderErrors(errors)       // Shows inline validation error messages
renderer.clearErrors()              // Removes all inline error messages
renderer.resetForm()                // Resets form fields to default state
renderer.showAppError(message)      // Displays a dismissible app-level error banner
```

### Controller (`app.js`)

Responsibilities:
1. On `DOMContentLoaded`: call `store.load()`, then render all three UI regions.
2. On form `submit`: call `validator.validate()`, show errors or call `store.add()` then re-render.
3. On delete button `click`: call `store.remove(id)`, handle error or re-render.

### Chart (`chart.js`)

```js
// Draws a pie chart onto the provided <canvas> element
drawPieChart(canvas, segments)
// segments: Array<{ label: string, value: number, color: string }>
// Handles empty state (no segments) by drawing placeholder text
```

Each segment is labeled with `"CategoryName XX.X%"` drawn inside or adjacent to the slice. When `segments` is empty, the canvas displays a centered placeholder message.

---

## Data Models

### Transaction

```js
{
  id: string,          // UUID v4 generated at creation time (crypto.randomUUID())
  name: string,        // Item name, trimmed, non-empty
  amount: number,      // Positive finite number (stored as JS number, not string)
  category: string,    // "Food" | "Transport" | "Fun"
  createdAt: number    // Unix timestamp ms (Date.now()) — used for sort order
}
```

### Stored Format

Transactions are serialized as a JSON array and stored under a single `localStorage` key:

```
Key:   "ebv_transactions"
Value: JSON.stringify(Transaction[])
```

On load, the stored string is parsed with `JSON.parse`. If parsing throws, or if the result is not an array, the store discards the data, initializes to `[]`, and surfaces an error to the Controller.

### Totals (derived, not stored)

```js
{
  Food: number,       // Sum of amounts for Food transactions
  Transport: number,  // Sum of amounts for Transport transactions
  Fun: number,        // Sum of amounts for Fun transactions
  total: number       // Sum of all amounts
}
```

Totals are computed on demand by `store.getTotals()` by reducing the in-memory array. They are never persisted independently.

### Chart Segment (derived)

```js
{
  label: string,   // e.g. "Food 45.3%"
  value: number,   // Proportional angle or percentage
  color: string    // Fixed hex color per category
}
```

Category color map:
- Food → `#FF6384`
- Transport → `#36A2EB`
- Fun → `#FFCE56`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction addition grows the list

*For any* transaction list and any valid transaction (non-empty name, positive amount, valid category), calling `store.add(transaction)` should result in `store.getAll()` returning a list whose length is exactly one greater than before, and which contains the added transaction.

**Validates: Requirements 1.2, 1.3**

---

### Property 2: Whitespace-only names are rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), submitting it as the item name should cause `validator.validate()` to return `{ valid: false }` with a non-empty `errors.name` field, and the transaction list should remain unchanged.

**Validates: Requirements 1.3, 1.4**

---

### Property 3: Non-positive amounts are rejected

*For any* numeric value that is zero, negative, or non-numeric (NaN, empty string), submitting it as the amount should cause `validator.validate()` to return `{ valid: false }` with a non-empty `errors.amount` field, and the transaction list should remain unchanged.

**Validates: Requirements 1.3, 1.5**

---

### Property 4: Transaction deletion removes exactly one entry

*For any* transaction list containing at least one transaction, calling `store.remove(id)` for a valid `id` should result in `store.getAll()` returning a list whose length is exactly one less than before, and which no longer contains any transaction with that `id`.

**Validates: Requirements 3.2**

---

### Property 5: Balance equals sum of all transaction amounts

*For any* transaction list, `store.getTotals().total` should equal the arithmetic sum of the `amount` field of every transaction in `store.getAll()`, rounded to at most 2 decimal places.

**Validates: Requirements 4.1, 4.2**

---

### Property 6: Category totals partition the overall total

*For any* transaction list, the sum of `totals.Food + totals.Transport + totals.Fun` should equal `totals.total` (within floating-point tolerance), ensuring no amount is double-counted or omitted.

**Validates: Requirements 5.1**

---

### Property 7: Chart segments reflect only non-zero categories

*For any* transaction list, every segment produced for the pie chart should have a positive `value`, and every category with a positive total in `store.getTotals()` should appear as exactly one segment.

**Validates: Requirements 5.1, 5.6**

---

### Property 8: Serialization round-trip preserves all transaction data

*For any* array of valid transactions, serializing it to JSON (as done by `store.add`) and then deserializing it (as done by `store.load`) should produce an array that is deeply equal to the original — all fields (`id`, `name`, `amount`, `category`, `createdAt`) preserved without loss or mutation.

**Validates: Requirements 6.1, 6.2, 6.4**

---

### Property 9: Segment percentage labels sum to 100%

*For any* non-empty transaction list, the sum of all percentage values displayed in chart segment labels should equal 100% (within ±0.1% rounding tolerance).

**Validates: Requirements 5.5**

---

## Error Handling

| Scenario | Detection | Response |
|---|---|---|
| `localStorage` write fails (quota / security) | `try/catch` around `localStorage.setItem` | Revert in-memory change; show app-level error banner |
| `localStorage` read fails / corrupted JSON | `try/catch` around `JSON.parse`; check `Array.isArray` | Discard data; init to `[]`; show app-level error banner |
| `localStorage` unavailable on load | `try/catch` around `localStorage.getItem` | Init to `[]`; show app-level error banner |
| Form submitted with invalid data | `validator.validate()` returns `{ valid: false }` | Show inline field-level error messages; do not add transaction |
| Balance recalculation error (unexpected) | `try/catch` around `getTotals()` | Retain last displayed total; show app-level error banner |
| Delete of non-existent ID | `store.remove` finds no matching entry | No-op; log warning to console |

All app-level error banners are dismissible and do not block further use of the application.

---

## Testing Strategy

### Unit Tests

Unit tests cover the pure logic modules (`validator.js`, `store.js` with a mocked `localStorage`, `chart.js` segment computation). Focus areas:

- **Validator**: specific valid and invalid inputs for each field (empty name, zero amount, invalid category string, boundary values).
- **Store**: add/remove/load/getTotals with a mock `localStorage`; error paths (write failure, parse failure).
- **Chart segment computation**: correct percentage calculation, exclusion of zero-value categories, single-category full-circle case.

Avoid writing exhaustive example tests for cases already covered by property tests.

### Property-Based Tests

Property-based testing is appropriate for this feature because the core logic (`validator.validate`, `store.add/remove/getTotals`, JSON serialization, chart segment generation) consists of pure or near-pure functions whose correctness must hold across a wide input space.

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript property-based testing library).

**Configuration**: Each property test runs a minimum of **100 iterations**.

**Tag format**: `// Feature: expense-budget-visualizer, Property N: <property_text>`

Each correctness property from the design document maps to exactly one property-based test:

| Property | Test description |
|---|---|
| Property 1 | `fc.property(arbitraryTransactionList, arbitraryValidTransaction, ...)` — list grows by 1 |
| Property 2 | `fc.property(fc.string().filter(isAllWhitespace), ...)` — validator rejects |
| Property 3 | `fc.property(fc.oneof(fc.constant(0), fc.integer({max: -1}), fc.constant(NaN)), ...)` — validator rejects |
| Property 4 | `fc.property(arbitraryNonEmptyTransactionList, ...)` — list shrinks by 1, id absent |
| Property 5 | `fc.property(arbitraryTransactionList, ...)` — total equals sum |
| Property 6 | `fc.property(arbitraryTransactionList, ...)` — category totals partition total |
| Property 7 | `fc.property(arbitraryTransactionList, ...)` — segments match non-zero categories |
| Property 8 | `fc.property(arbitraryTransactionList, ...)` — JSON round-trip identity |
| Property 9 | `fc.property(arbitraryNonEmptyTransactionList, ...)` — label percentages sum to 100% |

### Integration / Smoke Tests

- **Smoke**: Verify the app loads without JS errors in a browser environment (e.g., Playwright or manual check).
- **Integration**: End-to-end add → persist → reload → verify list restored (covers Requirement 6.4 with a real `localStorage`).

### Accessibility Checks

- Run automated accessibility audit (e.g., axe-core) to catch contrast and ARIA issues.
- Manual keyboard-navigation walkthrough to verify Tab order and focus indicators (WCAG 2.1 AA — full validation requires manual testing with assistive technologies).
