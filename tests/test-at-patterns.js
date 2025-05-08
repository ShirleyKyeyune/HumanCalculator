// Test @ patterns
const testCases = [
  "300 bottles @ 1,200",
  "300 bottles @ 1200",
  "300 bottles @ 1.2K",
  "300 bottles @1.2k"
];

// Function to test pattern matching
function testPattern(input) {
  console.log(`\nTesting: "${input}"`);
  let result = input;
  let matched = false;
  
  // Pattern for "300 bottles @ 1,200" format
  result = result.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+(?:,\d+)?|\d+\.\d+k)/i, (match, num1, num2) => {
    console.log(`  Pattern matched: num1=${num1}, num2=${num2}`);
    matched = true;
    // Remove commas and handle 'k' suffix
    const cleanNum1 = num1.replace(/,/g, '');
    let cleanNum2 = num2.replace(/,/g, '');
    if (cleanNum2.toLowerCase().includes('k')) {
      cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
    }
    return `${cleanNum1} * ${cleanNum2}`;
  });
  
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
