import { processComplexExpression } from './src/services/complexExpressionHandler.js';
import { sanitizeExpression, sanitizeExpressionRaw } from './src/services/calculatorService.js';

const testExpr = "((6 boxes × 12K) + 18K delivery)";

console.log("\n========== DEBUG EXPRESSION ==========");
console.log(`Input: ${testExpr}`);

console.log("\n--- Step 1: sanitizeExpressionRaw ---");
const rawResult = sanitizeExpressionRaw(testExpr);
console.log(`Result: ${rawResult}`);

console.log("\n--- Step 2: sanitizeExpression ---");
const sanitized = sanitizeExpression(testExpr);
console.log(`Result: ${sanitized}`);

console.log("\n--- Step 3: processComplexExpression ---");
const complex = processComplexExpression(testExpr);
console.log(`Result: ${complex}`);

// Try to evaluate the final result
try {
  const Parser = (await import('expr-eval')).Parser;
  const result = Parser.evaluate(sanitized);
  console.log(`\nFinal Evaluation: ${sanitized} = ${result}`);
} catch (e) {
  console.log(`Error evaluating: ${e.message}`);
}
