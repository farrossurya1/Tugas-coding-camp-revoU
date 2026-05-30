# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses, categorize spending, and visualize their budget distribution through an interactive pie chart. The application runs entirely in the browser using HTML, CSS, and Vanilla JavaScript, with all data persisted via the browser's Local Storage API. No backend server or complex setup is required.

## Glossary

- **App**: The Expense & Budget Visualizer web application
- **Transaction**: A single expense entry consisting of an item name, amount, and category
- **Transaction_List**: The scrollable UI component displaying all recorded transactions
- **Input_Form**: The UI form component used to add new transactions
- **Balance_Display**: The UI component showing the total sum of all transaction amounts
- **Chart**: The pie chart component visualizing spending distribution by category
- **Category**: A classification label for a transaction; one of: Food, Transport, or Fun
- **Local_Storage**: The browser's built-in client-side key-value storage API
- **Validator**: The logic component responsible for checking form input correctness

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill in a form with an item name, amount, and category, so that I can record a new expense transaction.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name, a numeric field for the amount, and a dropdown selector for the category (Food, Transport, Fun).
2. WHEN the user submits the Input_Form with all fields filled and a valid positive amount, THE App SHALL add the transaction to the Transaction_List and persist it to Local_Storage.
3. WHEN the user submits the Input_Form, THE Validator SHALL verify that the item name field is not empty, the amount field contains a positive numeric value greater than zero, and a category is selected from the available options.
4. IF the Validator detects that the item name field is empty, THEN THE Input_Form SHALL display an inline error message adjacent to the item name field and SHALL NOT add the transaction.
5. IF the Validator detects that the amount field is empty, zero, negative, or non-numeric, THEN THE Input_Form SHALL display an inline error message adjacent to the amount field and SHALL NOT add the transaction.
6. IF the Validator detects that no category is selected, THEN THE Input_Form SHALL display an inline error message adjacent to the category dropdown and SHALL NOT add the transaction.
7. WHEN a transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty/unselected state and remove any previously displayed error messages.

---

### Requirement 2: View Transaction List

**User Story:** As a user, I want to see a scrollable list of all my recorded transactions, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all persisted transactions, each showing the item name, amount formatted with a currency symbol and exactly 2 decimal places, and category label.
2. WHEN the App loads in the browser, THE Transaction_List SHALL render all transactions previously saved in Local_Storage, ordered from most recently recorded to least recently recorded.
3. WHEN the number of transactions exceeds the visible area of the Transaction_List, THE Transaction_List SHALL become scrollable to reveal all entries without affecting the layout of other page components.
4. WHEN no transactions exist, THE Transaction_List SHALL display both the empty list structure and a placeholder message indicating that no transactions have been recorded.
5. IF Local_Storage is unavailable or unreadable on App load, THE App SHALL display an error message and render the Transaction_List with no entries.

---

### Requirement 3: Delete a Transaction

**User Story:** As a user, I want to delete a transaction from the list, so that I can remove incorrect or unwanted entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL render a visible delete control for each transaction entry; WHEN no transactions remain after a deletion, THE Transaction_List SHALL display the empty-state placeholder message.
2. WHEN the user activates the delete control for a transaction, THE App SHALL remove that transaction from the Transaction_List and write the updated list to Local_Storage.
3. WHEN a transaction is deleted, THE Balance_Display SHALL recalculate and display the updated sum of remaining transaction amounts, and THE Chart SHALL redraw to reflect the updated category distribution.
4. IF the write to Local_Storage fails after a deletion, THEN THE App SHALL revert the transaction removal from the in-memory Transaction_List and display an error message indicating that the deletion could not be saved.

---

### Requirement 4: Display Total Balance

**User Story:** As a user, I want to see the total of all my expenses at the top of the page, so that I can quickly understand my overall spending.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all transaction amounts formatted with a currency symbol and exactly 2 decimal places (e.g., $0.00).
2. WHEN a transaction is added or deleted, THE Balance_Display SHALL recalculate and update the displayed total without requiring a page reload.
3. IF the Balance_Display recalculation cannot complete, THE App SHALL display a visible error message and retain the last successfully calculated total.
4. WHEN no transactions exist, THE Balance_Display SHALL display a total of $0.00.
5. WHEN the sum of all transaction amounts is negative, THE Balance_Display SHALL display the value with a minus-sign prefix (e.g., -$10.00).

---

### Requirement 5: Visualize Spending by Category

**User Story:** As a user, I want to see a pie chart of my spending broken down by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render a pie chart displaying the proportional spending for each category (Food, Transport, Fun) that has at least one transaction, relative to the total amount of all transactions.
2. WHEN a transaction is added or deleted, THE Chart SHALL update automatically to reflect the current category distribution within 500 milliseconds, without requiring a page reload.
3. WHEN only one category has transactions, THE Chart SHALL display a single full-circle segment for that category.
4. WHEN no transactions exist, THE Chart SHALL display a visible placeholder or empty-state message indicating there is no data to visualize, and no pie segments SHALL be rendered.
5. THE Chart SHALL label each segment with the category name and its percentage of total spending rounded to one decimal place (e.g., "Food 45.3%").
6. WHEN a category has a transaction amount of zero or no transactions, THE Chart SHALL exclude that category's segment from the rendered pie chart.

---

### Requirement 6: Persist Data Across Sessions

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my data when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL write the updated transaction list to Local_Storage synchronously before the UI reflects the change.
2. WHEN a transaction is deleted, THE App SHALL write the updated transaction list to Local_Storage synchronously before the UI reflects the change.
3. WHEN the App loads and Local_Storage contains no previously saved transaction data, THE App SHALL initialize the Transaction_List as empty and display a Balance_Display of $0.00 and an empty Chart placeholder.
4. WHEN the App loads and Local_Storage contains previously saved transaction data, THE App SHALL parse and restore the Transaction_List, Balance_Display, and Chart to reflect the persisted data within 500 milliseconds of page load.
5. IF the transaction data read from Local_Storage cannot be parsed as a valid transaction list, THEN THE App SHALL discard the corrupted data, initialize the Transaction_List as empty, and display an error message indicating that saved data could not be loaded.
6. IF a write to Local_Storage fails due to storage quota or access restrictions, THEN THE App SHALL retain the transaction in the in-memory Transaction_List and display an error message indicating that the data could not be saved persistently.

---

### Requirement 7: Responsive and Accessible UI

**User Story:** As a user, I want the application to be usable on different screen sizes and accessible via keyboard, so that I can use it on any device.

#### Acceptance Criteria

1. THE App SHALL render a usable layout on viewport widths from 320px to 1920px with no horizontal scrolling, no overlapping elements, and all interactive elements reachable and operable.
2. ALL interactive elements in THE App (including Input_Form fields, submit button, and delete controls) SHALL be navigable using Tab and Shift-Tab keys, and activatable using the Enter or Space key.
3. ALL interactive and focusable elements SHALL display a visible focus indicator that meets WCAG 2.1 AA focus appearance requirements when focused via keyboard.
4. THE App SHALL use color contrast ratios of at least 4.5:1 for normal text and at least 3:1 for large text and UI component boundaries against their backgrounds.
5. WHERE a category color is used in THE Chart, THE Chart SHALL also display a text label so that the information is not conveyed by color alone.
