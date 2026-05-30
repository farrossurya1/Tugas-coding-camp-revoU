// Feature: expense-budget-visualizer, Property 3: Non-positive amounts are rejected
import { describe, it } from "vitest";
import * as fc from "fast-check";
import validator from "../js/validator.js";

/**
 * Property 3: Non-positive amounts are rejected
 * Validates: Requirements 1.3, 1.5
 *
 * For any numeric value that is zero, negative, or non-numeric (NaN, empty string),
 * submitting it as the amount should cause validator.validate() to return
 * { valid: false } with a non-empty errors.amount field.
 */
describe("Property 3: Non-positive amounts are rejected", () => {
  it("rejects zero, negative integers, NaN, and empty string as amount", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0),
          fc.integer({ max: -1 }),
          fc.constant(NaN),
          fc.constant("")
        ),
        (invalidAmount) => {
          const result = validator.validate({
            name: "Test",
            amount: invalidAmount,
            category: "Food",
          });

          // Must be invalid
          if (result.valid !== false) return false;

          // Must have a non-empty errors.amount field
          if (!result.errors || !result.errors.amount) return false;
          if (typeof result.errors.amount !== "string") return false;
          if (result.errors.amount.trim().length === 0) return false;

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
