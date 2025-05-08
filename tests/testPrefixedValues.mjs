/**
 * Test Prefixed Values
 * 
 * This file tests the complex expression handler with both simple and prefixed standalone values
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
  },
  {
    expression: "item (5x2k) + some 3k",
    expected: 13000,
    description: "Simple expression with prefixed standalone value"
  },
  {
    expression: "product (2x3k) - old 1k + new 2k",
    expected: 7000,
    description: "Complex expression with multiple prefixed standalone values"
  }
];

console.log("=== Testing Complex Expression Handler with Prefixed Values ===\n");

// Run each test case
testCases.forEach(testCase => {
  console.log(`Testing: "${testCase.expression}"`);
  console.log(`Description: ${testCase.description}`);
  
  try {
    // Process the expression using the calculator service
    const sanitized = calculatorService.sanitizeExpression(testCase.expression);
    console.log(`Sanitized: ${sanitized}`);
    
    // Evaluate the sanitized expression
    const result = calculatorService.evaluateExpression(sanitized);
    console.log(`Result: ${result}`);
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Match? ${result === testCase.expected}`);
    
    if (result !== testCase.expected) {
      console.log(`ERROR: Result ${result} does not match expected ${testCase.expected}`);
    }
  } catch (error) {
    console.error(`Error processing expression: ${error.message}`);
  }
  
  console.log("\n---\n");
});

console.log("=== End of Tests ===");
