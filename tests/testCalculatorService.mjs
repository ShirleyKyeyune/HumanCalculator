/**
 * Test Calculator Service
 * 
 * This file tests the calculator service with various expressions to ensure
 * that all changes are working correctly in the actual app environment.
 */

import calculatorService from '../services/calculatorService.js';

// Test cases for the calculator service
const testCases = [
  {
    expression: "something (2x2k) - another (3x1k) + 1k - 2k",
    expected: 0,
    description: "Complex expression with standalone numeric values with suffixes"
  },
  {
    expression: "1k - 2k",
    expected: -1000,
    description: "Simple expression with standalone numeric values with suffixes"
  },
  {
    expression: "2k + 3k",
    expected: 5000,
    description: "Addition of standalone numeric values with suffixes"
  },
  {
    expression: "5m - 2.5m",
    expected: 2500000,
    description: "Subtraction with m suffix"
  },
  {
    expression: "item (3x2k) + 1k",
    expected: 7000,
    description: "Mixed expression with parenthesized and standalone values"
  }
];

console.log("=== Testing Calculator Service ===\n");

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
