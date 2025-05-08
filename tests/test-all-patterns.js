// Test all patterns
const testCases = [
  // Original test cases
  "bottles 1.2k x 300 people",
  "bottles 1.2k x 300",
  "1.2k x 300 people",
  "1.2k x 300",
  "1200 x 300",

  // Previously failing patterns
  "300 bottles @ 1.2K",
  "300 bottles @1.2K",
  "Total for 300 bottles @ UGX 1.2K",
  "Quantity: 300 × 1.2k bottles",
  "Total bottles: 1,200 × 300"
];

// Function to test pattern matching
function testPattern(input) {
  console.log(`\nTesting: "${input}"`);

  // Pattern 1: decimal with k suffix and text on both sides
  let result = input.replace(/([a-zA-Z]+\s+)?(\d+\.\d+)\s*k\s+([x*])\s*(\d+)([a-zA-Z\s]+)?/gi, (match, prefix, num1, operator, num2, suffix) => {
    console.log(`  Pattern 1 matched: prefix=${prefix}, num1=${num1}, operator=${operator}, num2=${num2}, suffix=${suffix}`);
    return `${num1 * 1000} * ${num2}`;
  });

  // If pattern 1 didn't match, try pattern 2: decimal with k suffix
  if (result === input) {
    result = input.replace(/(\d+\.\d+)\s*k\s+([x*])\s*(\d+)([a-zA-Z\s]+)?/gi, (match, num1, operator, num2, suffix) => {
      console.log(`  Pattern 2 matched: num1=${num1}, operator=${operator}, num2=${num2}, suffix=${suffix}`);
      return `${num1 * 1000} * ${num2}`;
    });
  }

  // Pattern 3: Handle "300 bottles @ 1.2K" format (with space after @)
  if (result === input) {
    result = input.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+\.\d+)k/i, (match, num1, num2) => {
      console.log(`  Pattern 3 matched: num1=${num1}, num2=${num2}`);
      const cleanNum1 = num1.replace(/,/g, '');
      return `${cleanNum1} * ${parseFloat(num2) * 1000}`;
    });
  }

  // Pattern 4: Handle "300 bottles @1.2K" format (without space after @)
  if (result === input) {
    result = input.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@(\d+\.\d+)k/i, (match, num1, num2) => {
      console.log(`  Pattern 4 matched: num1=${num1}, num2=${num2}`);
      const cleanNum1 = num1.replace(/,/g, '');
      return `${cleanNum1} * ${parseFloat(num2) * 1000}`;
    });
  }

  // Pattern 5: Handle "Total for 300 bottles @ UGX 1.2K" format
  if (result === input) {
    result = input.replace(/(?:Total|Price)\s*for\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+\.\d+)k/i, (match, num1, num2) => {
      console.log(`  Pattern 5 matched: num1=${num1}, num2=${num2}`);
      const cleanNum1 = num1.replace(/,/g, '');
      return `${cleanNum1} * ${parseFloat(num2) * 1000}`;
    });
  }

  // Pattern 6: Handle "Quantity: 300 × 1.2k bottles" format
  if (result === input) {
    result = input.replace(/(?:Quantity|Total)[^:]*:\s*(\d+(?:,\d+)?)\s*[×x]\s*(\d+\.\d+)k/i, (match, num1, num2) => {
      console.log(`  Pattern 6 matched: num1=${num1}, num2=${num2}`);
      const cleanNum1 = num1.replace(/,/g, '');
      return `${cleanNum1} * ${parseFloat(num2) * 1000}`;
    });
  }

  // Pattern 7: Handle "Total bottles: 1,200 × 300" format
  if (result === input) {
    result = input.replace(/(?:Total|Quantity)[^:]*:\s*(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/i, (match, num1, num2) => {
      console.log(`  Pattern 7 matched: num1=${num1}, num2=${num2}`);
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }

  // If no pattern matched, just return the input
  if (result === input) {
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
