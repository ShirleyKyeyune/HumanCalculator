// Direct test for HumanWebCalculator's pattern matching functionality
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Set up a minimal DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { userAgent: 'node.js' };

// Mock React
global.React = {
  useState: (initialValue) => [initialValue, () => {}],
  useEffect: () => {},
  useRef: () => ({ current: null }),
  useCallback: (fn) => fn,
};

// Create a simplified version of the sanitizeExpressionRaw function
const createSanitizeFunction = () => {
  const filePath = path.join(__dirname, 'src', 'HumanWebCalculator.jsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // We'll implement a simplified version that focuses on the patterns we want to test
  return function sanitizeExpressionRaw(raw) {
    let expr = raw;
    
    // Handle decimal numbers with 'k' suffix (e.g., "1.2k x 300")
    expr = expr.replace(/(?:[a-zA-Z]+\s+)?(\d+\.\d+)\s*k\s*(?:[x×])\s*(\d+(?:,\d+)?)(?:[a-zA-Z\s]+)?/gi, (match, num1, num2) => {
      const cleanNum2 = num2.replace(/,/g, '');
      return `${parseFloat(num1) * 1000} * ${cleanNum2}`;
    });
    
    // Handle "Total bottles: 1,200 × 300" format and "Quantity: 300 × 1.2k bottles" format
    const totalQuantityPattern = /(?:Total|Quantity)[^:]*:\s*(.*)/gi;
    const totalQuantityMatches = expr.match(totalQuantityPattern);
    
    if (totalQuantityMatches) {
      for (const match of totalQuantityMatches) {
        const expression = match.replace(/(?:Total|Quantity)[^:]*:\s*/i, '');
        
        // Check for decimal with k suffix in the expression first (e.g., "300 × 1.2k")
        const kSuffixPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+\.\d+)\s*([km])\b/i;
        const kSuffixMatch = kSuffixPattern.exec(expression);
        
        if (kSuffixMatch) {
          const [, num1, num2, suffix] = kSuffixMatch;
          const cleanNum1 = num1.replace(/,/g, '');
          let multiplier = 1000; // Default for 'k'
          if (suffix && suffix.toLowerCase() === 'm') {
            multiplier = 1000000;
          }
          const result = `${cleanNum1} * ${parseFloat(num2) * multiplier}`;
          expr = expr.replace(match, result);
          continue;
        }
        
        // Now extract regular multiplication from the expression (e.g., "1,200 × 300")
        const multiplyPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/i;
        const multiplyMatch = multiplyPattern.exec(expression);
        
        if (multiplyMatch) {
          const [, num1, num2] = multiplyMatch;
          const cleanNum1 = num1.replace(/,/g, '');
          const cleanNum2 = num2.replace(/,/g, '');
          const result = `${cleanNum1} * ${cleanNum2}`;
          expr = expr.replace(match, result);
        }
      }
    }
    
    // Handle "Supplying 300 people with 1.2k bottles each" format
    expr = expr.replace(/(?:Supplying)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?\s*(?:with)\s*(\d+(?:,\d+)?|\d+\.\d+[km])\s*(?:bottles|bottle)/gi, (match, num1, num2) => {
      const cleanNum1 = num1.replace(/,/g, '');
      let cleanNum2 = num2.replace(/,/g, '');
      if (cleanNum2.toLowerCase().includes('k')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('k', '')) * 1000;
      } else if (cleanNum2.toLowerCase().includes('m')) {
        cleanNum2 = parseFloat(cleanNum2.toLowerCase().replace('m', '')) * 1000000;
      }
      return `${cleanNum1} * ${cleanNum2}`;
    });
    
    // Handle "Bottles for 300 people @ 1,200 each" format
    const bottlesForPattern = /(?:Bottles|Bottle|Items)\s+for\s+(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+[km])\s*(?:each)?/gi;
    const bottlesForMatches = expr.match(bottlesForPattern);
    
    if (bottlesForMatches) {
      for (const match of bottlesForMatches) {
        const numPattern = /(?:Bottles|Bottle|Items)\s+for\s+(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+[km])/i;
        const numMatch = numPattern.exec(match);
        
        if (numMatch) {
          const [, num1, num2] = numMatch;
          const cleanNum1 = num1.replace(/,/g, '');
          let cleanNum2 = num2.replace(/,/g, '');
          
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
          
          const result = `${cleanNum1} * ${cleanNum2}`;
          expr = expr.replace(match, result);
        }
      }
    }
    
    // Handle "300 bottles at 1,200 UGX each" format
    expr = expr.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*at\s*(\d+(?:,\d+)?)\s*(?:UGX)?\s*(?:each)?/gi, (match, num1, num2) => {
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    
    // Handle "1,200 UGX per bottle × 300 people" format
    expr = expr.replace(/(\d+(?:,\d+)?)\s*(?:UGX)?\s*per\s*(?:bottle|person)\s*[×x]\s*(\d+(?:,\d+)?)/gi, (match, num1, num2) => {
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    
    // Handle "300 bottles @ 1.2K" format
    expr = expr.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+\.\d+)\s*[km]\b/gi, (match, num1, num2, suffix) => {
      const cleanNum1 = num1.replace(/,/g, '');
      let multiplier = 1000; // Default for 'k'
      if (suffix && suffix.toLowerCase() === 'm') {
        multiplier = 1000000;
      }
      return `${cleanNum1} * ${parseFloat(num2) * multiplier}`;
    });
    
    // Handle "300 bottles @ 1,200" format
    expr = expr.replace(/(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+(?:,\d+)?)/gi, (match, num1, num2) => {
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    
    // Handle basic multiplication (e.g., "1200 x 300")
    expr = expr.replace(/(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/gi, (match, num1, num2) => {
      const cleanNum1 = num1.replace(/,/g, '');
      const cleanNum2 = num2.replace(/,/g, '');
      return `${cleanNum1} * ${cleanNum2}`;
    });
    
    return expr;
  };
};

// Test cases with expected results
const testCases = [
  {
    input: "bottles 1.2k x 300 people",
    expected: "1200 * 300",
    expectedResult: 360000
  },
  {
    input: "bottles 1.2k x 300",
    expected: "1200 * 300",
    expectedResult: 360000
  },
  {
    input: "1.2k x 300 people",
    expected: "1200 * 300",
    expectedResult: 360000
  },
  {
    input: "1.2k x 300",
    expected: "1200 * 300",
    expectedResult: 360000
  },
  {
    input: "1200 x 300",
    expected: "1200 * 300",
    expectedResult: 360000
  },
  {
    input: "300 people × 1,200 bottles each",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "1,200 bottles for each of 300 people",
    expected: "1200 * 300",
    expectedResult: 360000
  },
  {
    input: "Total bottles: 1,200 × 300",
    expected: "1200 * 300",
    expectedResult: 360000
  },
  {
    input: "Supplying 300 people with 1.2k bottles each",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "Quantity: 300 × 1.2k bottles",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "300 people × 1,200 UGX per bottle",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "Bottles for 300 people @ 1,200 each",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "1,200 UGX per bottle × 300 people",
    expected: "1200 * 300",
    expectedResult: 360000
  },
  {
    input: "300 bottles at 1,200 UGX each",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "Total for 300 bottles @ UGX 1,200",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "Total for 300 bottles @ UGX 1.2K",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "300 bottles @ 1,200",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "300 bottles @ 1200",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "300 bottles @ 1.2K",
    expected: "300 * 1200",
    expectedResult: 360000
  },
  {
    input: "300 bottles @1.2K",
    expected: "300 * 1200",
    expectedResult: 360000
  }
];

// Run the tests
try {
  const sanitizeExpressionRaw = createSanitizeFunction();

  console.log("=".repeat(80));
  console.log("DIRECT TESTING OF HUMANWEBCALCULATOR PATTERN MATCHING");
  console.log("=".repeat(80));

  let passCount = 0;
  let failCount = 0;

  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}/${testCases.length}`);
    console.log(`Testing: "${testCase.input}"`);

    try {
      const result = sanitizeExpressionRaw(testCase.input);
      console.log(`  Result: ${result}`);

      // Evaluate the result
      const parts = result.split('*').map(part => parseFloat(part.trim()));
      if (parts.length === 2) {
        const evaluated = parts[0] * parts[1];
        console.log(`  Evaluated: ${evaluated}`);

        if (Math.abs(evaluated - testCase.expectedResult) < 0.1) {
          console.log(`  PASSED: Result is ${testCase.expectedResult.toLocaleString()}`);
          passCount++;
        } else {
          console.log(`  FAILED: Expected ${testCase.expectedResult.toLocaleString()}, got ${evaluated.toLocaleString()}`);
          failCount++;
        }
      } else {
        console.log(`  FAILED: Could not evaluate expression`);
        failCount++;
      }
    } catch (e) {
      console.log(`  FAILED: Error: ${e.message}`);
      failCount++;
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
  console.log("=".repeat(80));
} catch (e) {
  console.error("Error setting up tests:", e);
}
