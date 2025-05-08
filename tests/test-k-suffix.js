// Test k suffix handling
const testCases = [
  "300 bottles @ 1.2K",
  "300 bottles @1.2k"
];

// Function to test pattern matching
function testPattern(input) {
  console.log(`\nTesting: "${input}"`);
  
  // Extract the number with k suffix for debugging
  const kMatch = input.match(/(\d+\.\d+)k/i);
  if (kMatch) {
    console.log(`Found k suffix number: ${kMatch[1]}`);
    console.log(`Converted value: ${parseFloat(kMatch[1]) * 1000}`);
  }
  
  // Try a more specific pattern for the @ with k suffix
  let result = input.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+\.\d+)k/i, (match, num1, num2) => {
    console.log(`  Pattern 1 matched: num1=${num1}, num2=${num2}`);
    return `${num1} * ${parseFloat(num2) * 1000}`;
  });
  
  // If no match, try without space
  if (result === input) {
    result = input.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@(\d+\.\d+)k/i, (match, num1, num2) => {
      console.log(`  Pattern 2 matched: num1=${num1}, num2=${num2}`);
      return `${num1} * ${parseFloat(num2) * 1000}`;
    });
  }
  
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

// Test all cases
testCases.forEach(testPattern);
