// Test specific failing patterns
const testCases = [
  "Total bottles: 1,200 × 300",
  "Quantity: 300 × 1.2k bottles",
  "Bottles for 300 people @ 1,200 each"
];

// Function to test pattern matching
function testPattern(input) {
  console.log(`\n=== Testing: "${input}" ===`);
  
  // Original expression
  console.log("Original:", input);
  
  // Test Total/Quantity pattern
  if (input.includes("Total") || input.includes("Quantity")) {
    const totalPattern = /(?:Total|Quantity)[^:]*:\s*(.*)/gi;
    const totalMatch = totalPattern.exec(input);
    
    if (totalMatch) {
      const expression = totalMatch[1];
      console.log("  Extracted expression:", expression);
      
      // Try to match decimal with k suffix
      const kSuffixPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+\.\d+)\s*([km])\b/i;
      const kSuffixMatch = expression.match(kSuffixPattern);
      
      if (kSuffixMatch) {
        console.log("  K suffix match:", kSuffixMatch);
        const [, num1, num2, suffix] = kSuffixMatch;
        const cleanNum1 = num1.replace(/,/g, '');
        let multiplier = 1000; // Default for 'k'
        if (suffix && suffix.toLowerCase() === 'm') {
          multiplier = 1000000;
        }
        const result = `${cleanNum1} * ${parseFloat(num2) * multiplier}`;
        console.log("  Result:", result);
        evaluateResult(result);
        return;
      }
      
      // Try to match regular multiplication
      const multiplyPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/i;
      const multiplyMatch = expression.match(multiplyPattern);
      
      if (multiplyMatch) {
        console.log("  Multiply match:", multiplyMatch);
        const [, num1, num2] = multiplyMatch;
        const cleanNum1 = num1.replace(/,/g, '');
        const cleanNum2 = num2.replace(/,/g, '');
        const result = `${cleanNum1} * ${cleanNum2}`;
        console.log("  Result:", result);
        evaluateResult(result);
        return;
      }
    }
  }
  
  // Test Bottles for pattern
  const bottlesForPattern = /(?:Bottles|Bottle|Items)\s+for\s+(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+[km])\s*(?:each)?/gi;
  const bottlesForMatch = bottlesForPattern.exec(input);
  
  if (bottlesForMatch) {
    console.log("  Bottles for match:", bottlesForMatch);
    const [, num1, num2] = bottlesForMatch;
    const cleanNum1 = num1.replace(/,/g, '');
    let cleanNum2 = num2.replace(/,/g, '');
    
    if (cleanNum2.toLowerCase().includes('k')) {
      cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
    } else if (cleanNum2.toLowerCase().includes('m')) {
      cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('m', '')) * 1000000;
    }
    
    const result = `${cleanNum1} * ${cleanNum2}`;
    console.log("  Result:", result);
    evaluateResult(result);
    return;
  }
  
  console.log("  ❌ No pattern matched");
}

// Helper function to evaluate result
function evaluateResult(expr) {
  try {
    const parts = expr.split('*').map(part => parseFloat(part.trim()));
    if (parts.length === 2) {
      const evaluated = parts[0] * parts[1];
      console.log(`  Evaluated: ${evaluated}`);
      if (Math.abs(evaluated - 360000) < 0.1) {
        console.log("  ✅ PASSED: Result is 360,000");
      } else {
        console.log(`  ❌ FAILED: Expected 360,000, got ${evaluated}`);
      }
    } else {
      console.log(`  ❌ FAILED: Could not evaluate expression`);
    }
  } catch (e) {
    console.log(`  ❌ FAILED: Evaluation error: ${e.message}`);
  }
}

// Run tests
console.log("=".repeat(80));
console.log("TESTING SPECIFIC PATTERNS");
console.log("=".repeat(80));

testCases.forEach(testCase => {
  testPattern(testCase);
});

console.log("\n" + "=".repeat(80));
console.log("TESTING COMPLETE");
console.log("=".repeat(80));
