// renderer.js — DOM update functions
// Feature: expense-budget-visualizer

import { drawPieChart, computeSegments } from './chart.js';

/**
 * Formats a numeric amount as an IDR currency string.
 * Uses "Rp" prefix with thousand separators and no decimal places.
 * Handles negative values with a minus-sign prefix (e.g. -Rp10.000).
 *
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  const abs = Math.abs(amount);
  const formatted = `Rp${abs.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  return amount < 0 ? `-${formatted}` : formatted;
}

export const renderer = {
  /**
   * Rebuilds the transaction list DOM.
   * Orders entries from most recently recorded to least recently recorded.
   * Shows an empty-state placeholder when the list is empty.
   *
   * @param {Array<{ id: string, name: string, amount: number, category: string, createdAt: number }>} transactions
   */
  renderList(transactions) {
    const list = document.getElementById('transaction-list');
    const emptyState = document.getElementById('empty-state');
    if (!list) return;

    // Clear existing items
    list.innerHTML = '';

    if (!transactions || transactions.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    // Sort newest first
    const sorted = [...transactions].sort((a, b) => b.createdAt - a.createdAt);

    sorted.forEach((tx) => {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.dataset.id = tx.id;

      li.innerHTML = `
        <span class="tx-name">${escapeHtml(tx.name)}</span>
        <span class="tx-category">${escapeHtml(tx.category)}</span>
        <span class="tx-amount">${formatCurrency(tx.amount)}</span>
        <button
          type="button"
          class="btn-delete"
          data-id="${escapeHtml(tx.id)}"
          aria-label="Delete transaction ${escapeHtml(tx.name)}"
        >Delete</button>
      `;

      list.appendChild(li);
    });
  },

  /**
   * Updates the balance display text.
   * Formats with currency symbol and 2 decimal places; handles negative values.
   *
   * @param {number} total
   */
  renderBalance(total) {
    const display = document.getElementById('balance-display');
    if (!display) return;
    display.textContent = formatCurrency(total);
  },

  /**
   * Redraws the pie chart canvas.
   * Derives segments from totals using computeSegments.
   * Passes an empty array to drawPieChart when all totals are zero.
   * Updates the canvas aria-label to describe current chart data for screen readers.
   *
   * @param {{ Food: number, Transport: number, Fun: number, total: number }} totals
   */
  renderChart(totals) {
    const canvas = document.getElementById('pie-chart');
    const chartEmptyState = document.getElementById('chart-empty-state');
    if (!canvas) return;

    const segments = computeSegments(totals);

    // If all totals are zero (or no non-zero categories), pass empty array
    const hasData = segments.length > 0;

    drawPieChart(canvas, hasData ? segments : []);

    // Update canvas aria-label to describe current data for screen readers
    if (hasData) {
      const segmentDescriptions = segments.map((s) => s.label).join(', ');
      canvas.setAttribute(
        'aria-label',
        `Pie chart showing spending by category: ${segmentDescriptions}`
      );
    } else {
      canvas.setAttribute(
        'aria-label',
        'Pie chart showing spending distribution by category. No data yet.'
      );
    }

    // Toggle the chart empty-state message
    if (chartEmptyState) {
      chartEmptyState.hidden = hasData;
    }
  },

  /**
   * Shows inline field-level validation error messages.
   *
   * @param {{ name?: string, amount?: string, category?: string }} errors
   */
  renderErrors(errors) {
    if (!errors) return;

    const fieldMap = {
      name: 'name-error',
      amount: 'amount-error',
      category: 'category-error',
    };

    Object.entries(fieldMap).forEach(([field, elementId]) => {
      const el = document.getElementById(elementId);
      if (!el) return;
      if (errors[field]) {
        el.textContent = errors[field];
        el.hidden = false;
      } else {
        el.textContent = '';
        el.hidden = true;
      }
    });
  },

  /**
   * Removes all inline validation error messages.
   */
  clearErrors() {
    ['name-error', 'amount-error', 'category-error'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = '';
      el.hidden = true;
    });
  },

  /**
   * Resets all form fields to their default empty/unselected state.
   */
  resetForm() {
    const form = document.getElementById('transaction-form');
    if (form) form.reset();
  },

  /**
   * Displays a dismissible app-level error banner.
   *
   * @param {string} message
   */
  showAppError(message) {
    const banner = document.getElementById('app-error-banner');
    const messageEl = document.getElementById('app-error-message');
    const dismissBtn = document.getElementById('app-error-dismiss');

    if (!banner || !messageEl) return;

    messageEl.textContent = message;
    banner.hidden = false;

    if (dismissBtn) {
      // Remove any previous listener to avoid stacking
      const newBtn = dismissBtn.cloneNode(true);
      dismissBtn.parentNode.replaceChild(newBtn, dismissBtn);
      newBtn.addEventListener('click', () => {
        banner.hidden = true;
        messageEl.textContent = '';
      });
    }
  },
};

/**
 * Escapes HTML special characters to prevent XSS when inserting user data into innerHTML.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
