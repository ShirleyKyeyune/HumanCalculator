// Test m suffix handling
const testCases = [
  "300 bottles @ 1.2M",
  "300 bottles @1.2m",
  "bottles 1.2m x 300 people",
  "1.2M x 300",
  "Total for 300 bottles @ UGX 1.2M"
];

// Function to test pattern matching
function testPattern(input) {
  console.log(`\nTesting: "${input}"`);
  
  // Extract the number with m suffix for debugging
  const mMatch = input.match(/(\d+\.\d+)m/i);
  if (mMatch) {
    console.log(`Found m suffix number: ${mMatch[1]}`);
    console.log(`Converted value: ${parseFloat(mMatch[1]) * 1000000}`);
  }
  
  // Try patterns with m suffix
  let result = input;
  let matched = false;
  
  // Pattern 1: Handle decimal numbers with 'm' suffix (e.g., "bottles 1.2m x 300 people")
  result = result.replace(/([a-zA-Z]+\s+)?(\d+\.\d+)\s*m\s+([x*])\s*(\d+)([a-zA-Z\s]+)?/i, (match, prefix, num1, operator, num2, suffix) => {
    console.log(`  Pattern 1 matched: num1=${num1}, num2=${num2}`);
    matched = true;
    return `${parseFloat(num1) * 1000000} * ${num2}`;
  });
  
  // Pattern 2: Handle "300 bottles @ 1.2M" format
  if (!matched) {
    result = result.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+\.\d+)m/i, (match, num1, num2) => {
      console.log(`  Pattern 2 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      return `${num1} * ${parseFloat(num2) * 1000000}`;
    });
  }
  
  // Pattern 3: Handle "300 bottles @1.2m" format
  if (!matched) {
    result = result.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@(\d+\.\d+)m/i, (match, num1, num2) => {
      console.log(`  Pattern 3 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      return `${num1} * ${parseFloat(num2) * 1000000}`;
    });
  }
  
  // Pattern 4: Handle "Total for 300 bottles @ UGX 1.2M" format
  if (!matched) {
    result = result.replace(/(?:Total|Price)\s*for\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+\.\d+)m/i, (match, num1, num2) => {
      console.log(`  Pattern 4 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      return `${num1} * ${parseFloat(num2) * 1000000}`;
    });
  }
  
  // Pattern 5: Handle "1.2M x 300" format
  if (!matched) {
    result = result.replace(/(\d+\.\d+)\s*m\s*([x*])\s*(\d+(?:,\d+)?)/i, (match, num1, operator, num2) => {
      console.log(`  Pattern 5 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      const cleanNum2 = num2.replace(/,/g, '');
      return `${parseFloat(num1) * 1000000} * ${cleanNum2}`;
    });
  }
  
  if (!matched) {
    console.log("  No pattern matched");
  } else {
    console.log(`  Result: ${result}`);
    // Try to evaluate
    try {
      const parts = result.split('*').map(part => parseFloat(part.trim()));
      if (parts.length === 2) {
        const evaluated = parts[0] * parts[1];
        console.log(`  Evaluated: ${evaluated}`);
      }
    } catch (e) {
      console.log(`  Evaluation error: ${e.message}`);
    }
  }
}

// Test all cases
testCases.forEach(testPattern);
