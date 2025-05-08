// Test script for calculator service
// Use ES Module imports
import calculatorService from '../src/services/calculatorService.js';

// Test input lines
const testInputs = [
  "bottles 1.2k x 300 people",
  "bottles 1.2k x 300",
  "1.2k x 300 people",
  "1.2k x 300",
  "1200 x 300",
  "",
  "300 people × 1,200 bottles each",
  "1,200 bottles for each of 300 people",
  "Total bottles: 1,200 × 300",
  "Supplying 300 people with 1.2k bottles each",
  "Quantity: 300 × 1.2k bottles",
  "",
  "300 people × 1,200 UGX per bottle",
  "Bottles for 300 people @ 1,200 each",
  "1,200 UGX per bottle × 300 people",
  "300 bottles at 1,200 UGX each",
  "Total for 300 bottles @ UGX 1,200",
  "Total for 300 bottles @ UGX 1.2K",
  "",
  "300 bottles @ 1,200",
  "300 bottles @ 1200",
  "300 bottles @ 1.2K",
  "300 bottles @1.2K"
];

console.log("=".repeat(80));
console.log("CALCULATOR SERVICE PATTERN TESTING");
console.log("=".repeat(80));

// Process each input line
testInputs.forEach((input, index) => {
  if (!input.trim()) {
    console.log("\n"); // Add extra space for empty lines
    return;
  }
  
  console.log(`\nTest ${index + 1}: "${input}"`);
  
  // Process with sanitizeExpressionRaw
  const rawProcessed = calculatorService.sanitizeExpressionRaw(input);
  console.log(`  Raw processed: ${rawProcessed}`);
  
  // Process with sanitizeExpression
  const sanitized = calculatorService.sanitizeExpression(input);
  console.log(`  Sanitized: ${sanitized}`);
  
  // Check for K suffix in the raw processed string
  if (rawProcessed.includes('K')) {
    console.log(`  ⚠️ WARNING: K suffix found in raw processed string: ${rawProcessed}`);
  }
  
  // Evaluate the expression
  try {
    const result = calculatorService.evaluateExpression(input);
    console.log(`  Evaluated: ${result}`);
    
    // Check if the result is approximately 360,000
    if (result && Math.abs(result - 360000) < 0.1) {
      console.log("  ✅ PASSED: Result is 360,000");
    } else {
      console.log(`  ❌ FAILED: Expected 360,000, got ${result}`);
    }
  } catch (e) {
    console.log(`  ❌ FAILED: Evaluation error: ${e.message}`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("TESTING COMPLETE");
console.log("=".repeat(80));
