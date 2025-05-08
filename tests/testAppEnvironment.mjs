/**
 * Test App Environment
 *
 * This file tests the expressions in a way that simulates the actual app environment
 * with multiple processing steps to identify where the issue might be occurring.
 */

import calculatorService from '../services/calculatorService.js';

// Test cases
const testCases = [
  {
    expression: "something (2x2k) - another (3x1k) + 1k - 2k",
    expected: 0,
    description: "Complex expression with simple standalone values"
  },
  {
    expression: "something (2x2k) - another (3x1k) + 1k - another 2k",
    expected: 0,
    description: "Complex expression with prefixed standalone value"
  }
];

console.log("=== Testing App Environment Simulation ===\n");

// Function to simulate the app's evaluation process step by step
const simulateAppStepByStep = (expression) => {
  console.log(`\nDetailed simulation for: "${expression}"`);

  // Step 1: Initial sanitization
  console.log("\n--- Step 1: Initial Sanitization ---");
  const sanitized = calculatorService.sanitizeExpression(expression);
  console.log(`Sanitized: ${sanitized}`);

  // Step 2: Evaluation
  console.log("\n--- Step 2: Evaluation ---");
  try {
    const result = calculatorService.evaluateExpression(sanitized);
    console.log(`Evaluated: ${result}`);
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

  // Simulate app step by step
  const result = simulateAppStepByStep(testCase.expression);

  // Check if the result matches the expected value
  console.log(`\nExpected: ${testCase.expected}`);
  console.log(`Actual: ${result}`);
  console.log(`Match? ${result === testCase.expected}`);

  if (result !== testCase.expected) {
    console.log(`ERROR: Result ${result} does not match expected ${testCase.expected}`);
  }

  console.log("\n---");
});

// Let's also test the prefixed standalone value handler directly
console.log("\n=== Testing Prefixed Standalone Value Handler Directly ===");

const prefixedValues = [
  "- another 2k",
  "+ some 3k",
  "- old 1k",
  "+ new 5k"
];

prefixedValues.forEach(value => {
  console.log(`\nTesting: "${value}"`);

  // Create a test expression that isolates the prefixed standalone value
  const testExpr = `dummy (1x1k) ${value}`;
  console.log(`Test expression: "${testExpr}"`);

  const sanitized = calculatorService.sanitizeExpression(testExpr);
  console.log(`Sanitized: ${sanitized}`);

  try {
    const result = calculatorService.evaluateExpression(sanitized);
    console.log(`Evaluated: ${result}`);
  } catch (error) {
    console.error(`Evaluation error: ${error.message}`);
  }
});

console.log("\n=== End of Tests ===");
