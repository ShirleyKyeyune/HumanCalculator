/**
 * Debug Application
 * 
 * This script tests how the application processes a specific expression
 */

const { sanitizeExpressionRaw } = require('../services/calculatorService');

// The expression to test
const expression = "something (2x2k) - another (3x1k) + anotherThing (4.5 x 3k)";

console.log(`Testing expression: "${expression}"`);
const result = sanitizeExpressionRaw(expression);
console.log(`Result from application: ${result}`);
console.log(`Expected result: 14500`);
