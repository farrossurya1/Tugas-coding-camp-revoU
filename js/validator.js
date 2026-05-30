// validator.js — Input validation (pure functions)
// Feature: expense-budget-visualizer

const VALID_CATEGORIES = ["Food", "Transport", "Fun"];

const validator = {
  /**
   * Validates a new transaction input.
   * @param {{ name: any, amount: any, category: any }} input
   * @returns {{ valid: true } | { valid: false, errors: { name?: string, amount?: string, category?: string } }}
   */
  validate({ name, amount, category }) {
    const errors = {};

    // Validate name: must be a non-empty string after trimming whitespace
    if (typeof name !== "string" || name.trim().length === 0) {
      errors.name = "Item name is required and cannot be empty.";
    }

    // Validate amount: must parse as a finite number greater than zero
    const parsedAmount = Number(amount);
    if (amount === "" || amount === null || amount === undefined || !isFinite(parsedAmount) || parsedAmount <= 0) {
      errors.amount = "Amount must be a positive number greater than zero.";
    }

    // Validate category: must be one of the allowed values
    if (!VALID_CATEGORIES.includes(category)) {
      errors.category = `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`;
    }

    if (Object.keys(errors).length === 0) {
      return { valid: true };
    }

    return { valid: false, errors };
  },
};

export default validator;
