/**
 * Test Actual App Environment
 * 
 * This file tests the expressions in an environment that more closely resembles the actual app
 */

import calculatorService from '../services/calculatorService.js';

// Test cases for the complex expression handler with prefixed values
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

console.log("=== Testing Actual App Environment ===\n");

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
