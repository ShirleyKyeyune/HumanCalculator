// Test failing patterns
const testCases = [
  // Specific failing patterns from comprehensive test
  "Total bottles: 1,200 × 300",
  "Quantity: 300 × 1.2k bottles",
  "Bottles for 300 people @ 1,200 each"
];

function sanitizeExpression(expr) {
  console.log("Original expression:", expr);
  
  // Handle "Total bottles: 1,200 × 300" format
  expr = expr.replace(/(?:Total|Quantity)[^:]*:\s*(.*)/gi, (match, expression) => {
    console.log("  Matched Total/Quantity pattern, expression:", expression);
    
    // Check for decimal with k suffix in the expression first
    const kSuffixMatch = expression.match(/(\d+(?:,\d+)?)\s*[×x]\s*(\d+\.\d+)\s*([km])\b/i);
    if (kSuffixMatch) {
      console.log("  Found k suffix match:", kSuffixMatch);
      const [, num1, num2, suffix] = kSuffixMatch;
      const cleanNum1 = num1.replace(/,/g, '');
      let multiplier = 1000; // Default for 'k'
      if (suffix && suffix.toLowerCase() === 'm') {
        multiplier = 1000000;
      }
      return `${cleanNum1} * ${parseFloat(num2) * multiplier}`;
    }
    
    // Now extract regular multiplication from the expression
    const multiplyMatch = expression.match(/(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/i);
    if (multiplyMatch) {
      console.log("  Found multiply match:", multiplyMatch);
      const [, num1, num2] = multiplyMatch; // Using comma to skip first element
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    }
    
    return match; // Return original if no multiplication found
  });
  
  console.log("After Total/Quantity pattern:", expr);
  
  // Handle "Bottles for 300 people @ 1,200 each" format
  expr = expr.replace(/(?:Bottles|Bottle|Items)\s+for\s+(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+[km])\s*(?:each)?/gi, (match, num1, num2) => {
    console.log("  Matched Bottles for pattern:", match, "num1=", num1, "num2=", num2);
    const cleanNum1 = num1.replace(/,/g, '');
    let cleanNum2 = num2.replace(/,/g, '');
    if (cleanNum2.toLowerCase().includes('k')) {
      cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
    } else if (cleanNum2.toLowerCase().includes('m')) {
      cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('m', '')) * 1000000;
    }
    return `${cleanNum1} * ${cleanNum2}`;
  });
  
  console.log("Final expression:", expr);
  return expr;
}

// Function to test pattern matching
function testPattern(input) {
  console.log(`\n=== Testing: "${input}" ===`);
  const result = sanitizeExpression(input);
  
  // Try to evaluate without using eval
  try {
    // Check if the result is different from the input (pattern matched)
    if (result !== input) {
      // Parse the expression safely
      const parts = result.split('*').map(part => parseFloat(part.trim()));
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
    } else {
      console.log("  FAILED: No pattern matched");
    }
  } catch (e) {
    console.log(`  FAILED: Evaluation error: ${e.message}`);
  }
}
    });
  }
  
  // Pattern 3: Handle "Total for 300 bottles @ UGX 1.2K" format
  if (!matched) {
    result = result.replace(/(?:Total|Price)\s*for\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+\.\d+)k/i, (match, num1, num2) => {
      console.log(`  Pattern 3 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      return `${cleanNum1} * ${parseFloat(num2) * 1000}`;
    });
  }
  
  // Pattern 4: Handle "300 bottles at 1,200 UGX each" format
  if (!matched) {
    result = result.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*at\s*(\d+(?:,\d+)?)\s*(?:UGX)?\s*(?:each)?/i, (match, num1, num2) => {
      console.log(`  Pattern 4 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }
  
  // Pattern 5: Handle "1,200 UGX per bottle × 300 people" format
  if (!matched) {
    result = result.replace(/(\d+(?:,\d+)?)\s*(?:UGX)?\s*per\s*(?:bottle|person)\s*[×x]\s*(\d+(?:,\d+)?)/i, (match, num1, num2) => {
      console.log(`  Pattern 5 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }
  
  // Pattern 6: Handle "Quantity: 300 × 1.2k bottles" format
  if (!matched) {
    result = result.replace(/(?:Quantity|Total)[^:]*:\s*(\d+(?:,\d+)?)\s*[×x]\s*(\d+\.\d+)k/i, (match, num1, num2) => {
      console.log(`  Pattern 6 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      return `${cleanNum1} * ${parseFloat(num2) * 1000}`;
    });
  }
  
  // Pattern 7: Handle "Total bottles: 1,200 × 300" format
  if (!matched) {
    result = result.replace(/(?:Total|Quantity)[^:]*:\s*(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/i, (match, num1, num2) => {
      console.log(`  Pattern 7 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }
  
  // If no pattern matched, just return the input
  if (!matched) {
    console.log("  No pattern matched");
  } else {
    console.log(`  Result: ${result}`);
    // Try to evaluate without using eval
    try {
      // Parse the expression safely
      const parts = result.split('*').map(part => parseFloat(part.trim()));
      if (parts.length === 2) {
        const evaluated = parts[0] * parts[1];
        console.log(`  Evaluated: ${evaluated}`);
      } else {
        console.log(`  Could not evaluate: expression not in expected format`);
      }
    } catch (e) {
      console.log(`  Evaluation error: ${e.message}`);
    }
  }
}

// Test all cases
testCases.forEach(testPattern);
