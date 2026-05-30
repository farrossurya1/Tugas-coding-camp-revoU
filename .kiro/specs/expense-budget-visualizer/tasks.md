# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a single-page, client-side expense tracker using plain HTML, CSS, and Vanilla JavaScript. The app is structured around a unidirectional data-flow pattern: Controller → Store → Renderer. All state is held in memory and persisted to `localStorage`. A Canvas 2D pie chart visualizes spending by category. Property-based tests use `fast-check`.

## Tasks

- [x] 1. Set up project structure and core HTML skeleton
  - Create `index.html` with the four UI regions: Input Form, Balance Display, Transaction List, and Pie Chart canvas
  - Create `css/styles.css` with base layout, responsive grid (320px–1920px), focus indicators, and color contrast meeting WCAG 2.1 AA
  - Create empty JS module files: `js/app.js`, `js/store.js`, `js/validator.js`, `js/renderer.js`, `js/chart.js`
  - Link all JS files as ES modules in `index.html`
  - _Requirements: 1.1, 2.1, 7.1, 7.3, 7.4_

- [x] 2. Implement the Validator module
  - [x] 2.1 Implement `validator.validate({ name, amount, category })` in `js/validator.js`
    - Reject whitespace-only or empty `name`; reject `amount` that is not a finite positive number; reject `category` not in `["Food", "Transport", "Fun"]`
    - Return `{ valid: true }` or `{ valid: false, errors: { name?, amount?, category? } }`
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 Write property test for whitespace-only name rejection (Property 2)
    - **Property 2: Whitespace-only names are rejected**
    - **Validates: Requirements 1.3, 1.4**
    - Use `fc.string().filter(s => s.trim() === '')` as the arbitrary
    - Tag: `// Feature: expense-budget-visualizer, Property 2: Whitespace-only names are rejected`

  - [x] 2.3 Write property test for non-positive amount rejection (Property 3)
    - **Property 3: Non-positive amounts are rejected**
    - **Validates: Requirements 1.3, 1.5**
    - Use `fc.oneof(fc.constant(0), fc.integer({ max: -1 }), fc.constant(NaN), fc.constant(''))` as the arbitrary
    - Tag: `// Feature: expense-budget-visualizer, Property 3: Non-positive amounts are rejected`

  - [x] 2.4 Write unit tests for validator edge cases
    - Test valid inputs, invalid category strings, boundary values (amount = 0.001, amount = 0)
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [x] 3. Implement the Store module
  - [x] 3.1 Implement `store.js` with `add`, `remove`, `getAll`, `getTotals`, and `load` methods
    - `add` and `remove` write to `localStorage` before mutating in-memory array; revert on write failure
    - `load` reads and parses `localStorage`; discards corrupted data and initializes to `[]`
    - `getTotals` computes `{ Food, Transport, Fun, total }` by reducing the in-memory array
    - Use `"ebv_transactions"` as the `localStorage` key; generate IDs with `crypto.randomUUID()`
    - _Requirements: 1.2, 3.2, 3.4, 4.1, 5.1, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 3.2 Write property test for valid transaction addition growing the list (Property 1)
    - **Property 1: Valid transaction addition grows the list**
    - **Validates: Requirements 1.2, 1.3**
    - Use `fc.array(arbitraryTransaction)` and `arbitraryValidTransaction` arbitraries; mock `localStorage`
    - Tag: `// Feature: expense-budget-visualizer, Property 1: Valid transaction addition grows the list`

  - [ ]* 3.3 Write property test for transaction deletion removing exactly one entry (Property 4)
    - **Property 4: Transaction deletion removes exactly one entry**
    - **Validates: Requirements 3.2**
    - Use `fc.array(arbitraryTransaction, { minLength: 1 })` arbitrary; mock `localStorage`
    - Tag: `// Feature: expense-budget-visualizer, Property 4: Transaction deletion removes exactly one entry`

  - [ ]* 3.4 Write property test for balance equaling sum of all amounts (Property 5)
    - **Property 5: Balance equals sum of all transaction amounts**
    - **Validates: Requirements 4.1, 4.2**
    - Use `fc.array(arbitraryTransaction)` arbitrary; mock `localStorage`
    - Tag: `// Feature: expense-budget-visualizer, Property 5: Balance equals sum of all transaction amounts`

  - [ ]* 3.5 Write property test for category totals partitioning the overall total (Property 6)
    - **Property 6: Category totals partition the overall total**
    - **Validates: Requirements 5.1**
    - Use `fc.array(arbitraryTransaction)` arbitrary; mock `localStorage`
    - Tag: `// Feature: expense-budget-visualizer, Property 6: Category totals partition the overall total`

  - [ ]* 3.6 Write property test for serialization round-trip preserving all transaction data (Property 8)
    - **Property 8: Serialization round-trip preserves all transaction data**
    - **Validates: Requirements 6.1, 6.2, 6.4**
    - Use `fc.array(arbitraryTransaction)` arbitrary; call `store.load()` after `store.add()` sequence
    - Tag: `// Feature: expense-budget-visualizer, Property 8: Serialization round-trip preserves all transaction data`

  - [ ]* 3.7 Write unit tests for store error paths
    - Test `localStorage` write failure (quota/security), corrupted JSON on load, delete of non-existent ID
    - _Requirements: 3.4, 6.5, 6.6_

- [x] 4. Checkpoint — Ensure all validator and store tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement the Chart module
  - [x] 5.1 Implement `drawPieChart(canvas, segments)` in `js/chart.js`
    - Compute segment angles from `value` proportions; draw filled arcs using Canvas 2D API
    - Label each segment with `"CategoryName XX.X%"` inside or adjacent to the slice
    - When `segments` is empty, draw centered placeholder text on the canvas
    - Use fixed colors: Food → `#FF6384`, Transport → `#36A2EB`, Fun → `#FFCE56`
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 7.5_

  - [x] 5.2 Implement chart segment computation helper (pure function)
    - Accept `totals` object and return `Array<{ label, value, color }>` excluding zero-value categories
    - Round percentage to one decimal place for labels
    - _Requirements: 5.1, 5.5, 5.6_

  - [ ]* 5.3 Write property test for chart segments reflecting only non-zero categories (Property 7)
    - **Property 7: Chart segments reflect only non-zero categories**
    - **Validates: Requirements 5.1, 5.6**
    - Use `fc.array(arbitraryTransaction)` arbitrary; derive totals and check segment set
    - Tag: `// Feature: expense-budget-visualizer, Property 7: Chart segments reflect only non-zero categories`

  - [ ]* 5.4 Write property test for segment percentage labels summing to 100% (Property 9)
    - **Property 9: Segment percentage labels sum to 100%**
    - **Validates: Requirements 5.5**
    - Use `fc.array(arbitraryTransaction, { minLength: 1 })` arbitrary; sum parsed label percentages
    - Tag: `// Feature: expense-budget-visualizer, Property 9: Segment percentage labels sum to 100%`

  - [ ]* 5.5 Write unit tests for chart segment computation
    - Test single-category full-circle, all three categories, zero-value category exclusion
    - _Requirements: 5.1, 5.3, 5.6_

- [x] 6. Implement the Renderer module
  - [x] 6.1 Implement `renderer.renderList(transactions)` in `js/renderer.js`
    - Rebuild the transaction list DOM; show item name, amount (currency symbol + 2 decimal places), category label, and a delete button per row
    - Show empty-state placeholder when `transactions` is empty
    - Order entries from most recently recorded to least recently recorded
    - _Requirements: 2.1, 2.2, 2.4, 3.1_

  - [x] 6.2 Implement `renderer.renderBalance(total)` in `js/renderer.js`
    - Update balance display text with currency symbol and 2 decimal places; handle negative values with minus-sign prefix
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 6.3 Implement `renderer.renderChart(totals)` in `js/renderer.js`
    - Call `drawPieChart` with derived segments; pass empty array when all totals are zero
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 6.4 Implement `renderer.renderErrors`, `renderer.clearErrors`, `renderer.resetForm`, and `renderer.showAppError` in `js/renderer.js`
    - `renderErrors` shows inline field-level messages; `clearErrors` removes them; `resetForm` resets all form fields; `showAppError` shows a dismissible app-level error banner
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 2.5, 3.4, 4.3, 6.5, 6.6_

- [x] 7. Implement the Controller and wire everything together
  - [x] 7.1 Implement `app.js` — initialization, form submit handler, and delete handler
    - On `DOMContentLoaded`: call `store.load()`, then call `renderer.renderList`, `renderer.renderBalance`, and `renderer.renderChart` with current state; show app error banner if `store.load()` fails
    - On form `submit`: call `validator.validate()`; if invalid call `renderer.renderErrors`; if valid call `store.add()`, handle error or call all three render functions and `renderer.resetForm` + `renderer.clearErrors`
    - On delete button `click` (event delegation): call `store.remove(id)`; handle error or call all three render functions
    - _Requirements: 1.2, 1.7, 2.2, 3.2, 3.3, 4.2, 5.2, 6.1, 6.2, 6.4_

  - [ ]* 7.2 Write integration test for add → persist → reload → verify list restored
    - Use a real (or simulated) `localStorage`; add transactions, reload store, verify `getAll()` matches
    - _Requirements: 6.4_

- [x] 8. Apply responsive layout and accessibility styles
  - [x] 8.1 Finalize `css/styles.css` for responsive layout (320px–1920px), keyboard focus indicators, and WCAG 2.1 AA color contrast
    - Ensure no horizontal scrolling or overlapping elements at any supported viewport width
    - Add visible `:focus` styles on all interactive elements
    - Verify text contrast ≥ 4.5:1 and UI component contrast ≥ 3:1
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 8.2 Add ARIA attributes and keyboard operability to interactive elements
    - Ensure all form fields, submit button, and delete controls are Tab-navigable and activatable via Enter/Space
    - Add `aria-label` or visible labels where needed; ensure chart labels convey information without relying on color alone
    - _Requirements: 7.2, 7.5_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use `fast-check` with a minimum of 100 iterations per property
- Unit tests complement property tests by covering specific examples and edge cases
- All property test files must include the tag comment: `// Feature: expense-budget-visualizer, Property N: <property_text>`
- The `localStorage` mock should be implemented once and shared across store and integration tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "5.1", "5.2", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "5.3", "5.4", "5.5"] },
    { "id": 3, "tasks": ["7.1", "8.1", "8.2"] },
    { "id": 4, "tasks": ["7.2"] }
  ]
}
```
