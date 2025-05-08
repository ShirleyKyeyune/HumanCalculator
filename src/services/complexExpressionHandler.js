/**
 * Complex Expression Handler
 *
 * This module handles complex expressions with multiple operations
 * following BODMAS (Brackets, Orders, Division, Multiplication, Addition, Subtraction) rules
 */

/**
 * Process a complex expression with multiple operations
 * @param {string} expression - The complex expression to process
 * @returns {string} - The result of the calculation
 */
const processComplexExpression = (expression) => {
  // Trim any spaces at the beginning and end of the expression
  const trimmedExpression = expression.trim();
  console.log(`\n*** DEBUG: Processing complex expression: "${trimmedExpression}" ***`);
  console.log(`Stack trace: ${new Error().stack}`);
  console.log(`Expression type: ${typeof trimmedExpression}`);
  console.log(`Expression length: ${trimmedExpression.length}`);
  console.log(`Expression characters: ${Array.from(trimmedExpression).map(c => c.charCodeAt(0)).join(', ')}`);
  console.log(`Contains parentheses: ${trimmedExpression.includes('(') && trimmedExpression.includes(')')}`);
  console.log(`Contains plus: ${trimmedExpression.includes('+')}`);
  console.log(`Contains minus: ${trimmedExpression.includes('-')}`);
  console.log(`Contains k: ${trimmedExpression.includes('k')}`);
  console.log(`Contains m: ${trimmedExpression.includes('m')}`);

  console.log('Called from:', new Error().stack.split('\n')[2]);
  try {
    console.log('Analyzing expression structure...');

    // First, let's break down the expression into its component parts
    // We'll identify each parenthesized expression and calculate its value

    // This regex extracts each individual part with its calculation
    const partRegex = /([a-zA-Z0-9]+(?:\s+[a-zA-Z0-9]+)*)\s+\((\d+(?:\.\d+)?)\s*[×x*@]\s*(\d+(?:\.\d+)?)\s*([km])?\)/g;

    // This will hold all the parts and their calculated values
    const parts = [];

    // Extract and calculate each part
    let match;

    // First, process parenthesized expressions
    while ((match = partRegex.exec(trimmedExpression)) !== null) {
      const [fullMatch, label, firstNum, secondNum, suffix] = match;

      // Process the numbers
      let num1 = parseFloat(firstNum);
      let num2 = parseFloat(secondNum);

      // Apply multiplier if suffix is present
      if (suffix) {
        const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
        num2 = num2 * multiplier;
      }

      // Calculate the result of this part
      const result = num1 * num2;
      console.log(`Calculated: ${label} (${firstNum}x${secondNum}${suffix || ''}) = ${result}`);

      // Store the part and its value
      parts.push({
        text: fullMatch,
        value: result
      });
    }

    // Replace each parenthesized part with a placeholder in the trimmed expression
    let modifiedExpr = trimmedExpression;
    for (let i = 0; i < parts.length; i++) {
      const placeholder = `__PART${i}__`;
      modifiedExpr = modifiedExpr.replace(parts[i].text, placeholder);
    }

    console.log(`Modified expression: ${modifiedExpr}`);

    // Process remaining text for standalone values
    const processStandaloneValues = (remainingText) => {
      if (!remainingText) return [];
      
      const standaloneTokens = [];
      let processedText = remainingText;
      
      // Process in multiple passes to catch all standalone values
      let madeChanges = true;
      let passCount = 0;
      const maxPasses = 5; // Limit to avoid infinite loops
      
      while (madeChanges && passCount < maxPasses) {
        madeChanges = false;
        passCount++;
        
        // 1. Process simple standalone values like '+1k' or '-2k'
        const simpleRegex = /([+-])\s*(\d+(?:\.\d+)?)\s*([km])\b/g;
        let simpleMatch;
        
        while ((simpleMatch = simpleRegex.exec(processedText)) !== null) {
          const [fullMatch, operator, number, suffix] = simpleMatch;
          
          // Skip if already processed
          if (fullMatch.includes('__PROCESSED__')) {
            continue;
          }
          
          // Process the number
          let value = parseFloat(number);
          const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
          value = value * multiplier;
          
          console.log(`Found standalone value: ${operator} ${number}${suffix} = ${operator === '-' ? -value : value}`);
          
          // Add the operator and value
          standaloneTokens.push({ type: 'operator', value: operator });
          standaloneTokens.push({ type: 'part', value: value });
          
          // Mark as processed
          processedText = processedText.replace(fullMatch, ` __PROCESSED__${passCount}__ `);
          madeChanges = true;
        }
        
        // 2. Process prefixed standalone values like '+ another 2k'
        const prefixedRegex = /([+-])\s+([a-z][a-z\s]*)\s*(\d+(?:\.\d+)?)\s*([km])\b/gi;
        let prefixedMatch;
        
        while ((prefixedMatch = prefixedRegex.exec(processedText)) !== null) {
          const [fullMatch, operator, prefix, number, suffix] = prefixedMatch;
          
          // Skip if already processed
          if (fullMatch.includes('__PROCESSED__')) {
            continue;
          }
          
          // Process the number
          let value = parseFloat(number);
          const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
          value = value * multiplier;
          
          console.log(`Found prefixed standalone value: ${operator} ${prefix}${number}${suffix} = ${operator === '-' ? -value : value}`);
          
          // Add the operator and value
          standaloneTokens.push({ type: 'operator', value: operator });
          standaloneTokens.push({ type: 'part', value: value });
          
          // Mark as processed
          processedText = processedText.replace(fullMatch, ` __PROCESSED__${passCount}__ `);
          madeChanges = true;
        }
      }
      
      return standaloneTokens;
    };

    // Initialize tokens array with first part (if exists)
    const tokens = [];
    if (parts.length > 0) {
      tokens.push({ type: 'part', value: parts[0].value });
    }

    // Process the modified expression to extract operators and parts
    let remainingExpr = modifiedExpr;
    
    // Skip the first part as we've already added it
    if (parts.length > 0) {
      const firstPartPlaceholder = `__PART0__`;
      const firstPartIndex = remainingExpr.indexOf(firstPartPlaceholder);
      remainingExpr = remainingExpr.substring(firstPartIndex + firstPartPlaceholder.length);
    }
    
    // Process remaining parts
    for (let i = 1; i < parts.length; i++) {
      const partPlaceholder = `__PART${i}__`;
      const partIndex = remainingExpr.indexOf(partPlaceholder);
      
      if (partIndex >= 0) {
        // Extract operator before this part
        const beforeText = remainingExpr.substring(0, partIndex).trim();
        const operator = beforeText.includes('+') ? '+' : '-';
        tokens.push({ type: 'operator', value: operator });
        tokens.push({ type: 'part', value: parts[i].value });
        
        // Remove processed part
        remainingExpr = remainingExpr.substring(partIndex + partPlaceholder.length);
      }
    }

    // Process any remaining text after the last part (might contain standalone values)
    if (remainingExpr.trim()) {
      console.log(`Processing remaining text: "${remainingExpr.trim()}"`);
      
      // Process standalone values in the remaining text
      const standaloneTokens = processStandaloneValues(remainingExpr.trim());
      tokens.push(...standaloneTokens);
    }

    console.log('Tokens:', tokens);

    // Calculate the final result by applying operations in order
    let result = 0;
    let currentOp = '+';

    for (const token of tokens) {
      if (token.type === 'operator') {
        currentOp = token.value;
      } else if (token.type === 'part') {
        if (currentOp === '+') {
          result += token.value;
          console.log(`After applying + ${token.value}: ${result}`);
        } else {
          result -= token.value;
          console.log(`After applying - ${token.value}: ${result}`);
        }
      }
    }

    console.log(`Final result: ${result}`);
    return result.toString();
  } catch (error) {
    console.error(`Error processing complex expression: ${error.message}`);
    return expression; // Return the original expression if there's an error
  }
};

// Create a named export object to fix lint issue
const complexExpressionHandler = {
  processComplexExpression
};

export { processComplexExpression };
export default complexExpressionHandler;
