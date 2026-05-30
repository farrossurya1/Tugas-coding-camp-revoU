// app.js — Controller: event wiring and orchestration
// Feature: expense-budget-visualizer

import store from './store.js';
import validator from './validator.js';
import { renderer } from './renderer.js';

/**
 * Re-renders all three UI regions (list, balance, chart) from current store state.
 */
function renderAll() {
  renderer.renderList(store.getAll());
  renderer.renderBalance(store.getTotals().total);
  renderer.renderChart(store.getTotals());
}

document.addEventListener('DOMContentLoaded', () => {
  // ── Initialization ──────────────────────────────────────────────────────────
  const loadResult = store.load();
  if (!loadResult.ok) {
    renderer.showAppError(loadResult.error ?? 'Failed to load saved transactions.');
  }
  renderAll();

  // ── Form submit handler ──────────────────────────────────────────────────────
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const nameInput     = document.getElementById('item-name');
      const amountInput   = document.getElementById('item-amount');
      const categoryInput = document.getElementById('item-category');

      const input = {
        name:     nameInput     ? nameInput.value     : '',
        amount:   amountInput   ? amountInput.value   : '',
        category: categoryInput ? categoryInput.value : '',
      };

      const result = validator.validate(input);

      if (!result.valid) {
        renderer.renderErrors(result.errors);
        return;
      }

      // Input is valid — clear any previous errors and add the transaction
      renderer.clearErrors();

      const addResult = store.add({
        name:     input.name.trim(),
        amount:   Number(input.amount),
        category: input.category,
      });

      if (!addResult.ok) {
        renderer.showAppError(addResult.error ?? 'Failed to save transaction.');
        return;
      }

      renderAll();
      renderer.resetForm();
    });
  }

  // ── Delete handler (event delegation on the transaction list) ────────────────
  const list = document.getElementById('transaction-list');
  if (list) {
    list.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-id]');
      if (!btn || !btn.classList.contains('btn-delete')) return;

      const id = btn.dataset.id;
      if (!id) return;

      const removeResult = store.remove(id);

      if (!removeResult.ok) {
        renderer.showAppError(removeResult.error ?? 'Failed to delete transaction.');
        return;
      }

      renderAll();
    });
  }
});
