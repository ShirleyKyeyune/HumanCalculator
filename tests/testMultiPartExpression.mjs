/**
 * Test Multi-Part Complex Expressions
 *
 * This file tests complex expressions with multiple parts and prefixed standalone values
 */

import calculatorService from '../services/calculatorService.js';

// Test cases
const testCases = [
  {
    expression: "something (2x2k) - another (3x1k) + 1k - another 2k - 1k",
    expected: -1000,
    description: "Complex expression with multiple parts and prefixed standalone values"
  },
  {
    expression: "item (5x2k) + some 3k - extra 5k + 2k",
    expected: 10000,
    description: "Complex expression with multiple prefixed standalone values"
  }
];

console.log("=== Testing Multi-Part Complex Expressions ===\n");

// Function to simulate the app's evaluation process
const simulateAppEvaluation = (expression) => {
  console.log(`\nSimulating app evaluation for: "${expression}"`);

  // Step 1: First sanitize the expression (as would happen in the app)
  const sanitized = calculatorService.sanitizeExpression(expression);
  console.log(`Sanitized expression: ${sanitized}`);

  // Step 2: Then evaluate the sanitized expression (as would happen in the app)
  try {
    const result = calculatorService.evaluateExpression(sanitized);
    console.log(`Evaluated result: ${result}`);
    return result;
  } catch (error) {
    console.error(`Evaluation error: ${error.message}`);
    return null;
  }
};

// Run each test case
testCases.forEach(testCase => {
  console.log(`\n=== Testing: "${testCase.expression}" ===`);
  console.log(`Description: ${testCase.description}`);

  // Simulate app evaluation
  const result = simulateAppEvaluation(testCase.expression);

  // Check if the result matches the expected value
  console.log(`Expected: ${testCase.expected}`);
  console.log(`Match? ${result === testCase.expected}`);

  if (result !== testCase.expected) {
    console.log(`ERROR: Result ${result} does not match expected ${testCase.expected}`);
  }

  console.log("\n---");
});

console.log("\n=== End of Tests ===");
