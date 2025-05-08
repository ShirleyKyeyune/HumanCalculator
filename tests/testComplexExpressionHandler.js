/**
 * Test for Complex Expression Handler
 *
 * This file tests the complex expression handler's ability to process
 * expressions with multiple operations following BODMAS rules
 */

const { processComplexExpression } = require('../services/complexExpressionHandler');

// Test cases for complex expressions
const testCases = [
  {
    expression: "something (2x2k) - another (3x1k) + anotherThing (4.5 x 3k)",
    expected: "14500",
    description: "Complex expression with addition and subtraction"
  },
  {
    expression: "item (5x2k) + item (3x4k)",
    expected: "22000",
    description: "Complex expression with addition only"
  },
  {
    expression: "product (10x1.5k) - discount (2x500)",
    expected: "14000",
    description: "Complex expression with subtraction only"
  },
  {
    expression: "part1 (1x1k) + part2 (2x2k) - part3 (3x1k) + part4 (4x1k) - part5 (5x0.5k) + part6 (6x0.25k)",
    expected: "5000",
    description: "Complex expression with many parts (unlimited parts test)"
  },
  {
    expression: "something (2x2k) - another (3x1k) + 1k - 2k",
    expected: "0",
    description: "Complex expression with standalone numeric values with suffixes"
  }
];

// Run the tests
console.log("=== Testing Complex Expression Handler ===");

testCases.forEach(test => {
  console.log(`\nTesting: "${test.expression}"`);
  console.log(`Description: ${test.description}`);

  const result = processComplexExpression(test.expression);
  console.log(`Result: ${result}`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Match? ${result === test.expected}`);
});

console.log("\n=== End of Tests ===");
