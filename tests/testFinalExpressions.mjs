/**
 * Final Test for Complex Expressions with Prefixed Values
 * 
 * This file tests both expressions to ensure they work correctly in the actual app environment
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
  },
  {
    expression: "1k - another 2k",
    expected: -1000,
    description: "Simple expression with prefixed standalone value"
  },
  {
    expression: "5k + some 3k",
    expected: 8000,
    description: "Addition with prefixed standalone value"
  }
];

console.log("=== Final Test for Complex Expressions with Prefixed Values ===\n");

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
