// store.js — State management + localStorage I/O
// Feature: expense-budget-visualizer

const STORAGE_KEY = "ebv_transactions";
const VALID_CATEGORIES = ["Food", "Transport", "Fun"];

/** @type {Array<{id: string, name: string, amount: number, category: string, createdAt: number}>} */
let _transactions = [];

/**
 * Attempt to write the given array to localStorage.
 * Returns { ok: true } on success, { ok: false, error: string } on failure.
 * @param {Array} data
 * @returns {{ ok: boolean, error?: string }}
 */
function _persist(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const store = {
  /**
   * Load transactions from localStorage.
   * If the stored value is missing, corrupted, or not an array, initializes to [].
   * @returns {{ ok: boolean, error?: string }}
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        _transactions = [];
        return { ok: true };
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        _transactions = [];
        return { ok: false, error: "Saved data is not a valid transaction list. Starting fresh." };
      }
      _transactions = parsed;
      return { ok: true };
    } catch (err) {
      _transactions = [];
      return {
        ok: false,
        error: "Could not load saved data: " + (err instanceof Error ? err.message : String(err)),
      };
    }
  },

  /**
   * Add a transaction to the store.
   * Writes to localStorage BEFORE mutating the in-memory array.
   * Reverts (no mutation) if the write fails.
   * @param {{ id?: string, name: string, amount: number, category: string, createdAt?: number }} transaction
   * @returns {{ ok: boolean, error?: string }}
   */
  add(transaction) {
    const entry = {
      id: transaction.id ?? crypto.randomUUID(),
      name: transaction.name,
      amount: transaction.amount,
      category: transaction.category,
      createdAt: transaction.createdAt ?? Date.now(),
    };

    const next = [..._transactions, entry];
    const result = _persist(next);
    if (!result.ok) {
      return result;
    }
    _transactions = next;
    return { ok: true };
  },

  /**
   * Remove a transaction by id.
   * Writes to localStorage BEFORE mutating the in-memory array.
   * Reverts (no mutation) if the write fails.
   * If the id does not exist, logs a warning and returns { ok: true } (no-op).
   * @param {string} id
   * @returns {{ ok: boolean, error?: string }}
   */
  remove(id) {
    const index = _transactions.findIndex((t) => t.id === id);
    if (index === -1) {
      console.warn(`store.remove: no transaction found with id "${id}"`);
      return { ok: true };
    }

    const next = _transactions.filter((t) => t.id !== id);
    const result = _persist(next);
    if (!result.ok) {
      return result;
    }
    _transactions = next;
    return { ok: true };
  },

  /**
   * Return a shallow copy of the current transaction array.
   * @returns {Array}
   */
  getAll() {
    return [..._transactions];
  },

  /**
   * Compute category totals and overall total from the in-memory array.
   * @returns {{ Food: number, Transport: number, Fun: number, total: number }}
   */
  getTotals() {
    const totals = { Food: 0, Transport: 0, Fun: 0, total: 0 };
    for (const t of _transactions) {
      if (VALID_CATEGORIES.includes(t.category)) {
        totals[t.category] += t.amount;
      }
      totals.total += t.amount;
    }
    return totals;
  },
};

export default store;
