// tests/validator.unit.test.js
// Unit tests for validator.js — edge cases and boundary values
// Feature: expense-budget-visualizer
// Validates: Requirements 1.3, 1.4, 1.5, 1.6

import { describe, it, expect } from "vitest";
import validator from "../js/validator.js";

describe("validator.validate — valid inputs", () => {
  it("accepts a typical valid transaction", () => {
    const result = validator.validate({ name: "Coffee", amount: 5.5, category: "Food" });
    expect(result).toEqual({ valid: true });
  });

  it("accepts amount = 0.001 (smallest positive boundary)", () => {
    const result = validator.validate({ name: "Bus", amount: 0.001, category: "Transport" });
    expect(result).toEqual({ valid: true });
  });

  it("accepts all three valid categories", () => {
    expect(validator.validate({ name: "Lunch", amount: 10, category: "Food" })).toEqual({ valid: true });
    expect(validator.validate({ name: "Taxi", amount: 5, category: "Transport" })).toEqual({ valid: true });
    expect(validator.validate({ name: "Movie", amount: 15, category: "Fun" })).toEqual({ valid: true });
  });
});

describe("validator.validate — invalid name", () => {
  it("rejects empty name string", () => {
    const result = validator.validate({ name: "", amount: 5, category: "Food" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("name");
    expect(result.errors.name).toBeTruthy();
  });

  it("rejects whitespace-only name", () => {
    const result = validator.validate({ name: "   ", amount: 5, category: "Food" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("name");
    expect(result.errors.name).toBeTruthy();
  });
});

describe("validator.validate — invalid amount", () => {
  it("rejects amount = 0 (boundary: not positive)", () => {
    const result = validator.validate({ name: "Coffee", amount: 0, category: "Food" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amount");
    expect(result.errors.amount).toBeTruthy();
  });

  it("rejects amount = -1 (negative)", () => {
    const result = validator.validate({ name: "Coffee", amount: -1, category: "Food" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amount");
    expect(result.errors.amount).toBeTruthy();
  });

  it("rejects amount = NaN", () => {
    const result = validator.validate({ name: "Coffee", amount: NaN, category: "Food" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amount");
    expect(result.errors.amount).toBeTruthy();
  });

  it("rejects amount = '' (empty string)", () => {
    const result = validator.validate({ name: "Coffee", amount: "", category: "Food" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("amount");
    expect(result.errors.amount).toBeTruthy();
  });
});

describe("validator.validate — invalid category", () => {
  it("rejects category = 'Shopping' (not in allowed list)", () => {
    const result = validator.validate({ name: "Coffee", amount: 5, category: "Shopping" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("category");
    expect(result.errors.category).toBeTruthy();
  });

  it("rejects category = '' (empty string)", () => {
    const result = validator.validate({ name: "Coffee", amount: 5, category: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("category");
    expect(result.errors.category).toBeTruthy();
  });
});

describe("validator.validate — multiple errors", () => {
  it("reports both name and amount errors when both are invalid", () => {
    const result = validator.validate({ name: "", amount: 0, category: "Food" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("name");
    expect(result.errors).toHaveProperty("amount");
    expect(result.errors.name).toBeTruthy();
    expect(result.errors.amount).toBeTruthy();
  });

  it("reports all three errors when all fields are invalid", () => {
    const result = validator.validate({ name: "", amount: 0, category: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty("name");
    expect(result.errors).toHaveProperty("amount");
    expect(result.errors).toHaveProperty("category");
  });
});
