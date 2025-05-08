// Comprehensive test for all patterns
const testCases = [
  // Group 1: Basic k suffix patterns
  "bottles 1.2k x 300 people",
  "bottles 1.2k x 300",
  "1.2k x 300 people",
  "1.2k x 300",
  "1200 x 300",

  // Group 2: Descriptive formats
  "300 people × 1,200 bottles each",
  "1,200 bottles for each of 300 people",
  "Total bottles: 1,200 × 300",
  "Supplying 300 people with 1.2k bottles each",
  "Quantity: 300 × 1.2k bottles",

  // Group 3: UGX and @ formats
  "300 people × 1,200 UGX per bottle",
  "Bottles for 300 people @ 1,200 each",
  "1,200 UGX per bottle × 300 people",
  "300 bottles at 1,200 UGX each",
  "Total for 300 bottles @ UGX 1,200",
  "Total for 300 bottles @ UGX 1.2K",

  // Group 4: @ with various formats
  "300 bottles @ 1,200",
  "300 bottles @ 1200",
  "300 bottles @ 1.2K",
  "300 bottles @1.2K"
];

let passCount = 0;
let failCount = 0;

// Function to test pattern matching
function testPattern(input) {
  console.log(`\nTesting: "${input}"`);
  let result = input;
  let matched = false;

  // Try all patterns in sequence

  // Pattern 1: Handle decimal numbers with 'k' suffix (e.g., "bottles 1.2k x 300 people")
  if (!matched) {
    const pattern = /([a-zA-Z]+\s+)?(\d+\.\d+)\s*k\s+([x*])\s*(\d+)([a-zA-Z\s]+)?/gi;
    const newResult = result.replace(pattern, (match, prefix, num1, operator, num2, suffix) => {
      console.log(`  Pattern 1 matched: decimal with k suffix - ${num1}k ${operator} ${num2}`);
      matched = true;
      return `${num1 * 1000} * ${num2}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 2: Handle "300 people × 1,200 bottles each" format
  if (!matched && !result.includes('Total') && !result.includes('Quantity')) {
    const pattern = /(\d+(?:,\d+)?)\s*(?:people|person)?\s*[×x]\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle|UGX)?/gi;
    const newResult = result.replace(pattern, (match, num1, num2) => {
      console.log(`  Pattern 2 matched: people × bottles - ${num1} × ${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 3: Handle "1,200 bottles for each of 300 people" format
  if (!matched) {
    const pattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle|UGX)?\s*(?:for|per)\s*(?:each|one)?\s*(?:of)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?/gi;
    const newResult = result.replace(pattern, (match, num1, num2) => {
      console.log(`  Pattern 3 matched: bottles for each of people - ${num1} for ${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 4: Handle "Quantity: 300 × 1.2k bottles" format
  if (!matched) {
    // First extract the expression after the colon
    const totalQuantityPattern = /(?:Total|Quantity)[^:]*:\s*(.*)/i;
    const totalQuantityMatch = totalQuantityPattern.exec(result);

    if (totalQuantityMatch) {
      const expression = totalQuantityMatch[1];

      // Check for decimal with k suffix in the expression
      const kSuffixPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+\.\d+)\s*([km])\b/i;
      const kSuffixMatch = kSuffixPattern.exec(expression);

      if (kSuffixMatch) {
        console.log(`  Pattern 4 matched: Quantity: num × decimal k - ${kSuffixMatch[1]} × ${kSuffixMatch[2]}${kSuffixMatch[3]}`);
        matched = true;
        const cleanNum1 = kSuffixMatch[1].replace(/,/g, '');
        let multiplier = 1000; // Default for 'k'
        if (kSuffixMatch[3] && kSuffixMatch[3].toLowerCase() === 'm') {
          multiplier = 1000000;
        }
        result = `${cleanNum1} * ${parseFloat(kSuffixMatch[2]) * multiplier}`;
      }
    }
  }

  // Pattern 5: Handle "Total bottles: 1,200 × 300" format
  if (!matched) {
    // First extract the expression after the colon
    const totalQuantityPattern = /(?:Total|Quantity)[^:]*:\s*(.*)/i;
    const totalQuantityMatch = totalQuantityPattern.exec(result);

    if (totalQuantityMatch) {
      const expression = totalQuantityMatch[1];

      // Now extract regular multiplication from the expression
      const multiplyPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/i;
      const multiplyMatch = multiplyPattern.exec(expression);

      if (multiplyMatch) {
        console.log(`  Pattern 5 matched: Total: num × num - ${multiplyMatch[1]} × ${multiplyMatch[2]}`);
        matched = true;
        const cleanNum1 = multiplyMatch[1].replace(/,/g, '');
        const cleanNum2 = multiplyMatch[2].replace(/,/g, '');
        result = `${cleanNum1} * ${cleanNum2}`;
      }
    }
  }

  // Pattern 6: Handle "Supplying 300 people with 1.2k bottles each" format
  if (!matched) {
    const pattern = /(?:Supplying)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?\s*(?:with)\s*(\d+(?:,\d+)?|\d+\.\d+[km])\s*(?:bottles|bottle)/gi;
    const newResult = result.replace(pattern, (match, num1, num2) => {
      console.log(`  Pattern 6 matched: Supplying people with bottles - ${num1} with ${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      let cleanNum2 = num2.replace(/,/g, '');
      if (cleanNum2.toLowerCase().includes('k')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
      } else if (cleanNum2.toLowerCase().includes('m')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('m', '')) * 1000000;
      }
      return `${cleanNum1} * ${cleanNum2}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 7: Handle "1,200 UGX per bottle × 300 people" format
  if (!matched) {
    const pattern = /(\d+(?:,\d+)?)\s*(?:UGX)?\s*per\s*(?:bottle|person)\s*[×x]\s*(\d+(?:,\d+)?)/gi;
    const newResult = result.replace(pattern, (match, num1, num2) => {
      console.log(`  Pattern 7 matched: UGX per bottle × people - ${num1} per bottle × ${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 8: Handle "300 bottles at 1,200 UGX each" format
  if (!matched) {
    const pattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*at\s*(\d+(?:,\d+)?)\s*(?:UGX)?\s*(?:each)?/gi;
    const newResult = result.replace(pattern, (match, num1, num2) => {
      console.log(`  Pattern 8 matched: bottles at UGX each - ${num1} at ${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 13: Handle "Bottles for 300 people @ 1,200 each" format
  if (!matched) {
    const pattern = /(?:Bottles|Bottle|Items)\s+for\s+(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+[km])\s*(?:each)?/gi;
    const bottlesForMatch = pattern.exec(result);

    if (bottlesForMatch) {
      console.log(`  Pattern 13 matched: Bottles for people @ each - ${bottlesForMatch[1]} @ ${bottlesForMatch[2]}`);
      matched = true;
      const cleanNum1 = bottlesForMatch[1].replace(/,/g, '');
      let cleanNum2 = bottlesForMatch[2].replace(/,/g, '');

      // Check for k or m suffix
      if (/\d+\.\d+[km]$/i.test(cleanNum2)) {
        const numPart = parseFloat(cleanNum2.replace(/[km]/gi, ''));
        const suffix = cleanNum2.slice(-1).toLowerCase();
        const multiplier = suffix === 'k' ? 1000 : 1000000;
        cleanNum2 = numPart * multiplier;
      } else if (cleanNum2.toLowerCase().includes('k')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
      } else if (cleanNum2.toLowerCase().includes('m')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('m', '')) * 1000000;
      }

      result = `${cleanNum1} * ${cleanNum2}`;
    }
  }

  // Pattern 9: Handle "Total for 300 bottles @ UGX 1.2K" format
  if (!matched) {
    const pattern = /(?:Total|Price)\s*for\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+\.\d+)([km])/gi;
    const newResult = result.replace(pattern, (match, num1, num2, suffix) => {
      console.log(`  Pattern 9 matched: Total for bottles @ UGX decimal k - ${num1} @ ${num2}${suffix}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      let multiplier = 1000; // Default for 'k'
      if (suffix && suffix.toLowerCase() === 'm') {
        multiplier = 1000000;
      }
      return `${cleanNum1} * ${parseFloat(num2) * multiplier}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 10: Handle "Total for 300 bottles @ UGX 1,200" format
  if (!matched) {
    const pattern = /(?:Total|Price)\s*for\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+(?:,\d+)?)/gi;
    const newResult = result.replace(pattern, (match, num1, num2) => {
      console.log(`  Pattern 10 matched: Total for bottles @ UGX - ${num1} @ ${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 11: Handle "300 bottles @ 1.2K" format (with space after @)
  if (!matched) {
    const pattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+\.\d+)([km])/gi;
    const newResult = result.replace(pattern, (match, num1, num2, suffix) => {
      console.log(`  Pattern 11 matched: bottles @ decimal k - ${num1} @ ${num2}${suffix}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      let multiplier = 1000; // Default for 'k'
      if (suffix && suffix.toLowerCase() === 'm') {
        multiplier = 1000000;
      }
      return `${cleanNum1} * ${parseFloat(num2) * multiplier}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 12: Handle "300 bottles @ 1,200" format (with space after @)
  if (!matched) {
    const pattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+(?:,\d+)?)/gi;
    const newResult = result.replace(pattern, (match, num1, num2) => {
      console.log(`  Pattern 12 matched: bottles @ num - ${num1} @ ${num2}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // Pattern 13: Handle "300 bottles @1.2K" format (without space after @)
  if (!matched) {
    const pattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@(\d+\.\d+)([km])/gi;
    const newResult = result.replace(pattern, (match, num1, num2, suffix) => {
      console.log(`  Pattern 13 matched: bottles @decimal k - ${num1} @${num2}${suffix}`);
      matched = true;
      const cleanNum1 = num1.replace(/,/g, '');
      let multiplier = 1000; // Default for 'k'
      if (suffix && suffix.toLowerCase() === 'm') {
        multiplier = 1000000;
      }
      return `${cleanNum1} * ${parseFloat(num2) * multiplier}`;
    });
    if (newResult !== result) {
      result = newResult;
      matched = true;
    }
  }

  // If no pattern matched, just return the input
  if (!matched) {
    console.log("  No pattern matched");
  } else {
    console.log(`  Result: ${result}`);
    // Try to evaluate without using eval
    try {
      // Special handling for Total/Quantity patterns
      if (result.includes('Total') || result.includes('Quantity')) {
        // Extract the expression after the colon
        const totalQuantityPattern = /(?:Total|Quantity)[^:]*:\s*(.*)/i;
        const totalQuantityMatch = totalQuantityPattern.exec(result);

        if (totalQuantityMatch) {
          const expression = totalQuantityMatch[1];

          // Check for multiplication in the expression
          const multiplyPattern = /(\d+(?:,\d+)?)\s*\*\s*(\d+(?:,\d+)?)/i;
          const multiplyMatch = multiplyPattern.exec(expression);

          if (multiplyMatch) {
            const [, num1, num2] = multiplyMatch;
            const evaluated = parseFloat(num1) * parseFloat(num2);
            console.log(`  Evaluated: ${evaluated}`);
            if (Math.abs(evaluated - 360000) < 0.1) {
              console.log("  PASSED: Result is 360,000");
              passCount++;
            } else {
              console.log(`  FAILED: Expected 360,000, got ${evaluated}`);
              failCount++;
            }
            return;
          }
        }
      }

      // Regular evaluation for other patterns
      const parts = result.split('*').map(part => parseFloat(part.trim()));
      if (parts.length === 2) {
        const evaluated = parts[0] * parts[1];
        console.log(`  Evaluated: ${evaluated}`);
        if (Math.abs(evaluated - 360000) < 0.1) {
          console.log("  PASSED: Result is 360,000");
          passCount++;
        } else {
          console.log(`  FAILED: Expected 360,000, got ${evaluated}`);
          failCount++;
        }
      } else {
        console.log(`  FAILED: Could not evaluate expression`);
        failCount++;
      }
    } catch (e) {
      console.log(`  FAILED: Evaluation error: ${e.message}`);
      failCount++;
    }
  }
}

// Test all cases
console.log("=".repeat(80));
console.log("COMPREHENSIVE PATTERN TESTING");
console.log("=".repeat(80));

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}/${testCases.length}`);
  testPattern(testCase);
});

console.log("\n" + "=".repeat(80));
console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
console.log("=".repeat(80));
