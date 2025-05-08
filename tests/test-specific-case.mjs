// Test script for the specific problematic case
import calculatorService from '../src/services/calculatorService.js';

const testInput = "Total for 300 bottles @ UGX 1.2K";

console.log("=".repeat(80));
console.log("TESTING SPECIFIC CASE");
console.log("=".repeat(80));
console.log(`\nInput: "${testInput}"`);

// Step 1: Raw processing
const rawProcessed = calculatorService.sanitizeExpressionRaw(testInput);
console.log(`\nStep 1 - Raw processed: "${rawProcessed}"`);

// Step 2: Extract just the mathematical expression
const mathExprMatch = rawProcessed.match(/\d[\d\s,.+\-*/()x×÷k]*\d/i);
console.log(`\nStep 2 - Math expression match: ${mathExprMatch ? `"${mathExprMatch[0]}"` : "null"}`);

// Step 3: Handle K suffix
let expr = mathExprMatch ? mathExprMatch[0] : rawProcessed;
console.log(`\nStep 3a - Expression before K handling: "${expr}"`);

// Apply our K suffix handling manually
if (expr.includes('K') || expr.includes('k')) {
  // First try the specific pattern for this case
  const kPattern = /(\d+)\s*\*\s*(\d+\.\d+)\s*[kK]/i;
  const match = expr.match(kPattern);
  
  if (match) {
    const [fullMatch, num1, num2] = match;
    const result = `${num1} * ${parseFloat(num2) * 1000}`;
    console.log(`\nStep 3b - K pattern match: "${fullMatch}" -> "${result}"`);
    expr = expr.replace(fullMatch, result);
  } else {
    console.log(`\nStep 3b - No K pattern match found`);
  }
}

console.log(`\nStep 3c - Expression after K handling: "${expr}"`);

// Step 4: Final sanitization
expr = expr.replace(/,/g, ''); // Remove commas
expr = expr.replace(/×/g, '*'); // Replace × with *
expr = expr.replace(/x/g, '*'); // Replace x with *
expr = expr.replace(/÷/g, '/'); // Replace ÷ with /
expr = expr.replace(/\s+/g, ''); // Remove all whitespace
expr = expr.replace(/[+\-*/]$/, ''); // Handle trailing operators

console.log(`\nStep 4 - Final sanitized expression: "${expr}"`);

// Step 5: Evaluate
try {
  const result = calculatorService.evaluateExpression(testInput);
  console.log(`\nStep 5 - Evaluated result: ${result}`);
  console.log(`\nExpected: 360,000, Got: ${result}`);
  console.log(`\nResult: ${Math.abs(result - 360000) < 0.1 ? "✅ PASSED" : "❌ FAILED"}`);
} catch (e) {
  console.log(`\nStep 5 - Evaluation error: ${e.message}`);
}

console.log("\n" + "=".repeat(80));
console.log("TESTING COMPLETE");
console.log("=".repeat(80));
