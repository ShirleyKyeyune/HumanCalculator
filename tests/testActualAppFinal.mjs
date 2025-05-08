/**
 * Test Actual App Environment with Complex Expressions
 * 
 * This file tests complex expressions in the actual app environment
 * to ensure they return the correct results.
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

console.log("=== Testing Complex Expressions in Actual App Environment ===\n");

// Run each test case
testCases.forEach(testCase => {
  console.log(`Testing: "${testCase.expression}"`);
  console.log(`Description: ${testCase.description}`);

  try {
    // Step 1: Process directly with complex expression handler
    console.log(`\n1. Direct processing with complex expression handler:`)
    const directResult = processComplexExpression(testCase.expression);
    console.log(`Direct result: ${directResult} (type: ${typeof directResult})`);
    
    // Step 2: Process with sanitizeExpression
    console.log(`\n2. Processing with sanitizeExpression:`)
    const sanitized = calculatorService.sanitizeExpression(testCase.expression);
    console.log(`Sanitized result: ${sanitized} (type: ${typeof sanitized})`);
    
    // Step 3: Process with evaluateExpression
    console.log(`\n3. Processing with evaluateExpression:`)
    const evaluated = calculatorService.evaluateExpression(sanitized);
    console.log(`Evaluated result: ${evaluated} (type: ${typeof evaluated})`);
    
    // Step 4: Process with processInput (simulates actual app)
    console.log(`\n4. Processing with processInput (simulates actual app):`)
    const processed = calculatorService.processInput(testCase.expression);
    console.log(`Processed result:`, processed);
    
    // Check if the final result matches the expected value
    const finalResult = processed[0].result;
    console.log(`\nFinal result: ${finalResult} (type: ${typeof finalResult})`);
    console.log(`Expected: ${testCase.expected} (type: ${typeof testCase.expected})`);
    console.log(`Match? ${finalResult === testCase.expected}`);
    
    if (finalResult !== testCase.expected) {
      console.log(`ERROR: Result ${finalResult} does not match expected ${testCase.expected}`);
    }
  } catch (error) {
    console.error(`Error processing expression: ${error.message}`);
    console.error(error.stack);
  }
  
  console.log("\n---\n");
});

console.log("=== End of Tests ===");
