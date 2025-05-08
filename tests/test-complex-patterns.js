// Test complex patterns
const testCases = [
  "300 people × 1,200 bottles each",
  "1,200 bottles for each of 300 people",
  "Total bottles: 1,200 × 300",
  "Supplying 300 people with 1.2k bottles each",
  "Quantity: 300 × 1.2k bottles",
  "300 people × 1,200 UGX per bottle",
  "Bottles for 300 people @ 1,200 each",
  "1,200 UGX per bottle × 300 people",
  "300 bottles at 1,200 UGX each",
  "Total for 300 bottles @ UGX 1,200",
  "Total for 300 bottles @ UGX 1.2K"
];

// Function to test pattern matching
function testPattern(input) {
  console.log(`\nTesting: "${input}"`);
  let result = input;
  let matched = false;
  
  // Pattern 1: Handle "300 people × 1,200 bottles each" format
  result = result.replace(/(\d+(?:,\d+)?)\s*(?:people|person)?\s*[×x]\s*(\d+(?:,\d+)?|\d+\.\d+k)\s*(?:bottles|bottle|UGX)?/i, (match, num1, num2) => {
    console.log(`  Pattern 1 matched: num1=${num1}, num2=${num2}`);
    matched = true;
    // Remove commas and handle 'k' suffix
    const cleanNum1 = num1.replace(/,/g, '');
    let cleanNum2 = num2.replace(/,/g, '');
    if (cleanNum2.toLowerCase().includes('k')) {
      cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
    }
    return `${cleanNum1} * ${cleanNum2}`;
  });
  
  // Pattern 2: Handle "1,200 bottles for each of 300 people" format
  if (!matched) {
    result = result.replace(/(\d+(?:,\d+)?|\d+\.\d+k)\s*(?:bottles|bottle|UGX)?\s*(?:for|per)\s*(?:each|one)?\s*(?:of)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?/i, (match, num1, num2) => {
      console.log(`  Pattern 2 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      // Remove commas and handle 'k' suffix
      let cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      if (cleanNum1.toLowerCase().includes('k')) {
        cleanNum1 = parseFloat(cleanNum1.toLowerCase().replace('k', '')) * 1000;
      }
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }
  
  // Pattern 3: Handle "Total bottles: 1,200 × 300" format
  if (!matched) {
    result = result.replace(/(?:Total|Quantity)[^:]*:\s*(\d+(?:,\d+)?|\d+\.\d+k)\s*[×x]\s*(\d+(?:,\d+)?)/i, (match, num1, num2) => {
      console.log(`  Pattern 3 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      // Remove commas and handle 'k' suffix
      let cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      if (cleanNum1.toLowerCase().includes('k')) {
        cleanNum1 = parseFloat(cleanNum1.toLowerCase().replace('k', '')) * 1000;
      }
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }
  
  // Pattern 4: Handle "Supplying 300 people with 1.2k bottles each" format
  if (!matched) {
    result = result.replace(/(?:Supplying)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?\s*(?:with)\s*(\d+(?:,\d+)?|\d+\.\d+k)\s*(?:bottles|bottle)/i, (match, num1, num2) => {
      console.log(`  Pattern 4 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      // Remove commas and handle 'k' suffix
      const cleanNum1 = num1.replace(/,/g, '');
      let cleanNum2 = num2.replace(/,/g, '');
      if (cleanNum2.toLowerCase().includes('k')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
      }
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }
  
  // Pattern 5: Handle "Quantity: 300 × 1.2k bottles" format
  if (!matched) {
    result = result.replace(/(?:Quantity|Total)[^:]*:\s*(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?|\d+\.\d+k)/i, (match, num1, num2) => {
      console.log(`  Pattern 5 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      // Remove commas and handle 'k' suffix
      const cleanNum1 = num1.replace(/,/g, '');
      let cleanNum2 = num2.replace(/,/g, '');
      if (cleanNum2.toLowerCase().includes('k')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
      }
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }
  
  // Pattern 6: Handle "Bottles for 300 people @ 1,200 each" format
  if (!matched) {
    result = result.replace(/(?:Bottles|Bottle)\s*for\s*(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+k)/i, (match, num1, num2) => {
      console.log(`  Pattern 6 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      // Remove commas and handle 'k' suffix
      const cleanNum1 = num1.replace(/,/g, '');
      let cleanNum2 = num2.replace(/,/g, '');
      if (cleanNum2.toLowerCase().includes('k')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
      }
      return `${cleanNum1} * ${cleanNum2}`;
    });
  }
  
  // Pattern 7: Handle "Total for 300 bottles @ UGX 1,200" format
  if (!matched) {
    result = result.replace(/(?:Total|Price)\s*for\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+(?:,\d+)?|\d+\.\d+k)/i, (match, num1, num2) => {
      console.log(`  Pattern 7 matched: num1=${num1}, num2=${num2}`);
      matched = true;
      // Remove commas and handle 'k' suffix
      const cleanNum1 = num1.replace(/,/g, '');
      let cleanNum2 = num2.replace(/,/g, '');
      if (cleanNum2.toLowerCase().includes('k')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
      }
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
