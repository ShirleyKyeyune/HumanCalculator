/**
 * Test Multi-Part Complex Expressions with Multiple Standalone Values
 *
 * This file tests complex expressions with multiple parts and multiple standalone values,
 * including those with prefixes like "another 2k"
 */

import calculatorService from '../services/calculatorService.js';
import { processComplexExpression } from '../services/complexExpressionHandler.js';

// Test cases
const testCases = [
  {
    expression: "something (2x2k) - another (3x1k) + 1k - another 2k - 1k",
    expected: -1000,
    description: "Complex expression with multiple parts and multiple standalone values"
  }
];

console.log("=== Testing Multi-Part Complex Expressions with Multiple Standalone Values ===\n");

// Run each test case
testCases.forEach(testCase => {
  console.log(`Testing: "${testCase.expression}"`);
  console.log(`Description: ${testCase.description}`);

  try {
    // Process the expression directly with the complex expression handler
    console.log(`Processing directly with complex expression handler: "${testCase.expression}"`);
    const directResult = processComplexExpression(testCase.expression);
    console.log(`Direct result from complex expression handler: ${directResult}`);
    console.log(`Direct result type: ${typeof directResult}`);
    console.log(`Direct result as number: ${parseFloat(directResult)}`);
    console.log(`Direct match? ${parseFloat(directResult) === testCase.expected}`);

    // Process the expression using the calculator service
    const sanitized = calculatorService.sanitizeExpression(testCase.expression);
    console.log(`\nSanitized: ${sanitized}`);
    console.log(`Sanitized type: ${typeof sanitized}`);

    // Log the raw sanitized expression to see if it contains the negative sign
    console.log(`Raw sanitized expression: '${sanitized}'`);
    console.log(`Contains negative sign: ${sanitized.includes('-')}`);
    console.log(`First character: '${sanitized.charAt(0)}'`);
    console.log(`Character codes: ${Array.from(sanitized).map(c => c.charCodeAt(0)).join(', ')}`);

    // Evaluate the sanitized expression
    const result = calculatorService.evaluateExpression(sanitized);
    console.log(`Result: ${result}`);
    console.log(`Result type: ${typeof result}`);
    console.log(`Expected: ${testCase.expected}`);
    console.log(`Expected type: ${typeof testCase.expected}`);
    console.log(`Match? ${result === testCase.expected}`);

    // Try parsing the result as a number for comparison
    const parsedResult = parseFloat(result);
    console.log(`Parsed result: ${parsedResult}`);
    console.log(`Parsed match? ${parsedResult === testCase.expected}`);

    if (result !== testCase.expected) {
      console.log(`ERROR: Result ${result} does not match expected ${testCase.expected}`);
    }
  } catch (error) {
    console.error(`Error processing expression: ${error.message}`);
  }

  console.log("\n---\n");
});

console.log("=== End of Tests ===");
