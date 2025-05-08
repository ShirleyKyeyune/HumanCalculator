/**
 * Calculator Service
 * Contains all the business logic for the Human Calculator application
 * Handles expression parsing, sanitization, and evaluation
 */

import { Parser } from 'expr-eval';
import { processComplexExpression } from './complexExpressionHandler.js';
import { processStandaloneValues } from './standaloneValueHandler.js';
import * as patterns from './calculatorPatterns.js';

/**
 * Sanitizes an expression for the parser by removing commas and converting
 * human-readable formats to mathematical expressions
 * @param {string} expr - The expression to sanitize
 * @returns {string} - The sanitized expression
 */
export const sanitizeExpression = (expr) => {
  console.log(`\n*** DEBUG: sanitizeExpression called with: "${expr}" ***`);
  console.log(`Stack trace: ${new Error().stack}`);
  if (!expr) return '';

  // Special case for simple expressions like "1k - 2k"
  const simplePattern = /^\s*(\d+(?:\.\d+)?)\s*([km])\s*([+-])\s*(\d+(?:\.\d+)?)\s*([km])\s*$/i;
  const simpleMatch = expr.match(simplePattern);

  if (simpleMatch) {
    const [, num1, suffix1, operator, num2, suffix2] = simpleMatch;
    const multiplier1 = suffix1.toLowerCase() === 'k' ? 1000 : 1000000;
    const multiplier2 = suffix2.toLowerCase() === 'k' ? 1000 : 1000000;

    const value1 = parseFloat(num1) * multiplier1;
    const value2 = parseFloat(num2) * multiplier2;

    console.log(`Direct conversion of "${expr}" to ${value1}${operator}${value2}`);
    return `${value1}${operator}${value2}`;
  }

  // Special case for expressions with prefixed standalone values like "1k - another 2k"
  const prefixedPattern = /^\s*(\d+(?:\.\d+)?)\s*([km])\s*([+-])\s*([a-z][a-z\s]*)\s*(\d+(?:\.\d+)?)\s*([km])\s*$/i;
  const prefixedMatch = expr.match(prefixedPattern);

  if (prefixedMatch) {
    const [, num1, suffix1, operator, , num2, suffix2] = prefixedMatch; // Ignoring prefix
    const multiplier1 = suffix1.toLowerCase() === 'k' ? 1000 : 1000000;
    const multiplier2 = suffix2.toLowerCase() === 'k' ? 1000 : 1000000;

    const value1 = parseFloat(num1) * multiplier1;
    const value2 = parseFloat(num2) * multiplier2;

    console.log(`Direct conversion of prefixed expression "${expr}" to ${value1}${operator}${value2}`);
    return `${value1}${operator}${value2}`;
  }

  // First, handle the raw expression to convert human-readable formats to math
  expr = sanitizeExpressionRaw(expr);

  // Extract just the mathematical expression by finding numbers and operators
  const mathExprMatch = expr.match(/\d[\d\s,.+\-*/()x×÷k]*\d/i);
  if (mathExprMatch) {
    expr = mathExprMatch[0];
  }

  // Convert expression to lowercase for easier suffix handling
  const lowerExpr = expr.toLowerCase();

  // First, check if this is a simple expression with standalone numeric values with suffixes
  // like "1k - 2k" that doesn't need complex expression handling
  if (lowerExpr.includes('k') || lowerExpr.includes('m')) {
    // Check if this is a simple expression with standalone values
    const isSimpleExpression = !expr.includes('(') ||
                              (expr.match(/\b\d+(?:\.\d+)?\s*[km]\b/gi) &&
                               !expr.match(/\([^)]*\b\d+(?:\.\d+)?\s*[km]\b[^)]*\)/gi));

    if (isSimpleExpression) {
      console.log('Processing simple expression with standalone values');

      // Process all standalone numeric values with suffixes
      const processedExpr = processStandaloneValues(expr);

      // If the expression has been processed and is now just a simple calculation,
      // return it directly to avoid further processing
      if (processedExpr !== expr && processedExpr.match(/^\d+([+-]\d+)+$/)) {
        console.log(`Returning direct calculation: ${processedExpr}`);
        return processedExpr;
      }

      expr = processedExpr;
    }

    // Handle regular cases with one suffix at a time for any remaining suffixes
    // Handle standalone k suffix (e.g., "1.2k")
    expr = expr.replace(/\b(\d+(?:\.\d+)?)\s*k\b/gi, (match, num) => {
      const value = parseFloat(num) * 1000;
      console.log(`Converting ${match} to ${value}`);
      return value.toString();
    });

    // Handle standalone m suffix (e.g., "1.2m")
    expr = expr.replace(/\b(\d+(?:\.\d+)?)\s*m\b/gi, (match, num) => {
      const value = parseFloat(num) * 1000000;
      console.log(`Converting ${match} to ${value}`);
      return value.toString();
    });


  // Handle k suffix in multiplication (e.g., "300 * 1.2k")
  expr = expr.replace(/([\d.]+)\s*[*x×]\s*([\d.]+)\s*k\b/i, (match, num1, num2) => {
    return `${num1} * ${parseFloat(num2) * 1000}`;
  });

    // Handle m suffix in multiplication (e.g., "300 * 1.2m")
  expr = expr.replace(/([\d.]+)\s*[*x×]\s*([\d.]+)\s*m\b/i, (match, num1, num2) => {
    return `${num1} * ${parseFloat(num2) * 1000000}`;
  });

  // Handle k suffix before multiplication (e.g., "1.2k * 300")
  expr = expr.replace(/([\d.]+)\s*k\b\s*[*x×]\s*([\d.]+)/i, (match, num1, num2) => {
    return `${parseFloat(num1) * 1000} * ${num2}`;
  });

  // Handle m suffix before multiplication (e.g., "1.2m * 300")
  expr = expr.replace(/([\d.]+)\s*m\b\s*[*x×]\s*([\d.]+)/i, (match, num1, num2) => {
    return `${parseFloat(num1) * 1000000} * ${num2}`;
  });
  }

  // Then perform final sanitization for the parser
  expr = expr.replace(/,/g, ''); // Remove commas
  expr = expr.replace(/×/g, '*'); // Replace × with *
  expr = expr.replace(/x/g, '*'); // Replace x with *
  expr = expr.replace(/÷/g, '/'); // Replace ÷ with /
  expr = expr.replace(/\s+/g, ''); // Remove all whitespace

  // Handle trailing operators
  expr = expr.replace(/[+\-*/]$/, '');

  return expr;
};

/**
 * Processes the raw expression to convert human-readable formats to mathematical expressions
 * @param {string} raw - The raw expression to process
 * @returns {string} - The processed expression
 */
export const sanitizeExpressionRaw = (raw) => {
  console.log(`\n*** DEBUG: sanitizeExpressionRaw called with: "${raw}" ***`);
  console.log(`Stack trace: ${new Error().stack}`);

  // Remove commas from numbers and trim spaces at the beginning and end
  let expr = raw.replace(/,/g, '').trim();
  console.log(`After trimming: "${expr}"`);


  // Try to use the complex expression handler for expressions with parentheses and operators
  if (expr.includes('(') && expr.includes(')') &&
      (expr.includes('+') || expr.includes('-')) &&
      (expr.includes('k') || expr.includes('m'))) {
    console.log('Potential complex expression detected:', expr);

    try {
      // Call the complex expression handler
      const result = processComplexExpression(expr);
      if (result !== null && result !== undefined) {
        console.log(`Complex expression processed successfully: ${result}`);

        // Always convert the result to a string to ensure consistent handling
        // throughout the calculator service
        const resultStr = result.toString();
        console.log(`Result string: ${resultStr}`);
        
        // If the result is a negative number, we need to handle it specially
        // to ensure it's preserved through the entire calculation process
        if (resultStr.startsWith('-')) {
          console.log(`Preserving negative number: ${resultStr}`);
          // For negative numbers, we need special handling
          // Return the negative number as a string that won't be further processed
          return resultStr;
        } else {
          // For positive numbers, just return the result as a string
          return resultStr;
        }
      }

      // Otherwise, continue with other patterns
      console.log('Complex expression handler did not return a result, continuing with other patterns');
    } catch (error) {
      console.error('Error processing potential complex expression:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Handle percentage calculations with parentheses (e.g., "(1,000,000 * 25%)")
  const percentageWithParensMatch = patterns.percentagePatternWithParens.exec(expr);
  if (percentageWithParensMatch) {
    try {
      // Extract the components
      const [, amount, percentage] = percentageWithParensMatch;

      // Remove commas from the amount
      const cleanAmount = amount.replace(/,/g, '');

      // Calculate the percentage
      const factor = parseFloat(percentage) / 100;

      // Return the mathematical expression
      return `${cleanAmount} * ${factor}`;
    } catch (error) {
      console.error('Error processing percentage with parentheses pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Handle percentage calculations without parentheses (e.g., "1,000,000 * 25%")
  const percentageNoParensMatch = patterns.percentagePatternNoParens.exec(expr);
  if (percentageNoParensMatch) {
    try {
      // Extract the components
      const [, amount, percentage] = percentageNoParensMatch;

      // Remove commas from the amount
      const cleanAmount = amount.replace(/,/g, '');

      // Calculate the percentage
      const factor = parseFloat(percentage) / 100;

      // Return the mathematical expression
      return `${cleanAmount} * ${factor}`;
    } catch (error) {
      console.error('Error processing percentage without parentheses pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Handle text followed by number with M/K suffix and percentage (e.g., "something 1M * 25%")
  const textMillionPercentMatch = patterns.textMillionPercentPattern.exec(expr);
  if (textMillionPercentMatch) {
    try {
      // Extract the components
      const [, , number, suffix, percentage] = textMillionPercentMatch;

      // Calculate the value with the multiplier applied
      const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
      const value = parseFloat(number) * multiplier;

      // Calculate the percentage
      const factor = parseFloat(percentage) / 100;

      // Return the mathematical expression
      return `${value} * ${factor}`;
    } catch (error) {
      console.error('Error processing text with million and percentage pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Handle text followed by number with M/K suffix and decimal (e.g., "something 1M x 0.25")
  const textMillionDecimalMatch = patterns.textMillionDecimalPattern.exec(expr);
  if (textMillionDecimalMatch) {
    try {
      // Extract the components
      const [, , number, suffix, decimal] = textMillionDecimalMatch;

      // Calculate the value with the multiplier applied
      const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
      const value = parseFloat(number) * multiplier;

      // Return the mathematical expression
      return `${value} * ${decimal}`;
    } catch (error) {
      console.error('Error processing text with million and decimal pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Handle fraction calculations (e.g., "(1,000,000 * (25/100))")
  const fractionMatch = patterns.fractionPattern.exec(expr);
  if (fractionMatch) {
    try {
      // Extract the components
      const [, amount, numerator, denominator] = fractionMatch;

      // Remove commas from the amount
      const cleanAmount = amount.replace(/,/g, '');

      // Calculate the fraction
      const factor = parseFloat(numerator) / parseFloat(denominator);

      // Return the mathematical expression
      return `${cleanAmount} * ${factor}`;
    } catch (error) {
      console.error('Error processing fraction pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Handle single expression in parentheses with text prefix (e.g., "something (2x2k)")
  const textWithParenExpressionMatch = patterns.textWithParenExpressionPattern.exec(expr);
  if (textWithParenExpressionMatch) {
    try {
      // Extract the components - we don't need the text part for calculation
      const [, , firstNum, secondNum, suffix] = textWithParenExpressionMatch;

      // Process the numbers
      let num1 = parseFloat(firstNum);
      let num2 = parseFloat(secondNum);

      // Apply multiplier if suffix is present
      if (suffix) {
        const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
        num2 = num2 * multiplier;
      }

      // Return the mathematical expression
      return `${num1} * ${num2}`;
    } catch (error) {
      console.error('Error processing text with parenthesized expression pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Note: Complex expression handling has been moved to the top of this function
  // to ensure it gets processed before individual patterns

  // Handle text with parenthesized expression (e.g., "something (1,000,000 * (25/100))")
  const textParenthesisMatch = patterns.textParenthesisPattern.exec(expr);
  if (textParenthesisMatch) {
    try {
      // Extract the expression inside parentheses
      const [, , expression] = textParenthesisMatch;

      // Process the expression recursively
      return sanitizeExpressionRaw(expression);
    } catch (error) {
      console.error('Error processing text with parenthesis pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Check for bottle boxes pattern (e.g., "Bottles (2 boxes * 10k)" or "Bottles 2 boxes @ 10k")
  const bottleBoxesMatch = patterns.bottleBoxesPattern.exec(expr);
  if (bottleBoxesMatch) {
    try {
      // Extract the components
      const [, , quantity, price, suffix] = bottleBoxesMatch;

      // Process the price with possible k/m suffix
      let calculatedPrice = price;
      if (suffix) {
        const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
        calculatedPrice = parseFloat(calculatedPrice) * multiplier;
      }

      // Return the mathematical expression
      return `${quantity} * ${calculatedPrice}`;
    } catch (error) {
      console.error('Error processing bottle boxes pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Check for compact bottle boxes pattern (e.g., "Bottles 2boxes @10k")
  const compactBottleBoxesMatch = patterns.compactBottleBoxesPattern.exec(expr);
  if (compactBottleBoxesMatch) {
    try {
      // Extract the components
      const [, , quantity, price, suffix] = compactBottleBoxesMatch;

      // Process the price with possible k/m suffix
      let calculatedPrice = price;
      if (suffix) {
        const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
        calculatedPrice = parseFloat(calculatedPrice) * multiplier;
      }

      // Return the mathematical expression
      return `${quantity} * ${calculatedPrice}`;
    } catch (error) {
      console.error('Error processing compact bottle boxes pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Check for generic item pattern with text, numbers and operators
  // This handles patterns like "Something 70 bags * 2k" or "bottles 1.2k x 300 people"
  const genericMatch = patterns.genericItemPattern.exec(expr);
  if (genericMatch) {
    try {
      // Extract the components - now with possible suffixes on either number
      // We don't need the description text, just the numbers and suffixes
      const [, , firstNum, firstSuffix, secondNum, secondSuffix] = genericMatch;

      // Process the first number (with possible k/m suffix)
      let num1 = firstNum.replace(/,/g, '');
      if (firstSuffix) {
        const multiplier = firstSuffix.toLowerCase() === 'k' ? 1000 : 1000000;
        num1 = parseFloat(num1) * multiplier;
      }

      // Process the second number (with possible k/m suffix)
      let num2 = secondNum.replace(/,/g, '');
      if (secondSuffix) {
        const multiplier = secondSuffix.toLowerCase() === 'k' ? 1000 : 1000000;
        num2 = parseFloat(num2) * multiplier;
      }

      // Return the mathematical expression
      return `${num1} * ${num2}`;
    } catch (error) {
      console.error('Error processing generic item pattern:', error);
      // Continue with other patterns if there's an error
    }
  }

  // Handle decimal numbers with 'k' or 'm' suffix (e.g., "1.2k x 300")
  expr = expr.replace(patterns.decimalWithSuffixPattern, (match, num1, suffix, num2) => {
    const cleanNum2 = num2.replace(/,/g, '');
    let multiplier = 1000; // Default for 'k'
    if (suffix && suffix.toLowerCase() === 'm') {
      multiplier = 1000000;
    }
    return `${parseFloat(num1) * multiplier} * ${cleanNum2}`;
  });

  // Handle "Total bottles: 1,200 × 300" format and "Quantity: 300 × 1.2k bottles" format
  const totalQuantityMatches = expr.match(patterns.totalQuantityPattern);

  if (totalQuantityMatches) {
    for (const match of totalQuantityMatches) {
      const expression = match.replace(/(?:Total|Quantity)[^:]*:\s*/i, '');

      // Check for decimal with k suffix in the expression first (e.g., "300 × 1.2k")
      const kSuffixMatch = patterns.kSuffixPattern.exec(expression);

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
      const multiplyMatch = patterns.multiplyPattern.exec(expression);

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
  expr = expr.replace(patterns.supplyingPattern, (match, num1, num2) => {
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
  const bottlesForMatches = expr.match(patterns.bottlesForPattern);

  if (bottlesForMatches) {
    for (const match of bottlesForMatches) {
      const numMatch = patterns.bottlesForNumPattern.exec(match);

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
  expr = expr.replace(patterns.bottlesAtPattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const cleanNum2 = num2.replace(/,/g, '');
    return `${cleanNum1} * ${cleanNum2}`;
  });

  // Handle "1,200 UGX per bottle × 300 people" format
  expr = expr.replace(patterns.ugxPerBottlePattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const cleanNum2 = num2.replace(/,/g, '');
    return `${cleanNum1} * ${cleanNum2}`;
  });

  // Handle "Total for 300 bottles @ UGX 1,200" format
  expr = expr.replace(patterns.totalForBottlesPattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const cleanNum2 = num2.replace(/,/g, '');
    return `${cleanNum1} * ${cleanNum2}`;
  });

  // Handle 'Total for 300 bottles @ UGX 1.2K' format
  expr = expr.replace(patterns.totalForBottlesKPattern, (match, num1, num2, suffix) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
    // Calculate the value with the multiplier applied
    const value = parseFloat(num2) * multiplier;
    // Return the complete multiplication with the numeric value
    return `${cleanNum1} * ${value}`;
  });

  // Handle standalone K suffix
  expr = expr.replace(patterns.kSuffixStandalonePattern, (match, num) => {
    return `${parseFloat(num) * 1000}`;
  });

  // Handle standalone M suffix
  expr = expr.replace(patterns.mSuffixStandalonePattern, (match, num) => {
    return `${parseFloat(num) * 1000000}`;
  });

  // Handle K suffix in multiplication
  expr = expr.replace(patterns.kSuffixMultiplyPattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    return `${cleanNum1} * ${parseFloat(num2) * 1000}`;
  });

  // Handle M suffix in multiplication
  expr = expr.replace(patterns.mSuffixMultiplyPattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    return `${cleanNum1} * ${parseFloat(num2) * 1000000}`;
  });

  // Handle K suffix before multiplication
  expr = expr.replace(patterns.kSuffixBeforeMultiplyPattern, (match, num1, num2) => {
    const cleanNum2 = num2.replace(/,/g, '');
    return `${parseFloat(num1) * 1000} * ${cleanNum2}`;
  });

  // Handle M suffix before multiplication
  expr = expr.replace(patterns.mSuffixBeforeMultiplyPattern, (match, num1, num2) => {
    const cleanNum2 = num2.replace(/,/g, '');
    return `${parseFloat(num1) * 1000000} * ${cleanNum2}`;
  });

  // Handle "300 bottles @ 1.2K" format
  expr = expr.replace(patterns.bottlesAtKPattern, (match, num1, num2, suffix) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
    return `${cleanNum1} * ${parseFloat(num2) * multiplier}`;
  });

  // Handle "300 bottles @ 1,200" format
  expr = expr.replace(patterns.bottlesAtNumPattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const cleanNum2 = num2.replace(/,/g, '');
    return `${cleanNum1} * ${cleanNum2}`;
  });

  // Handle "300 people × 1,200 bottles each" format
  expr = expr.replace(patterns.peopleBottlesPattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const cleanNum2 = num2.replace(/,/g, '');
    return `${cleanNum1} * ${cleanNum2}`;
  });

  // Handle "1,200 bottles for each of 300 people" format
  expr = expr.replace(patterns.bottlesForEachPattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const cleanNum2 = num2.replace(/,/g, '');
    return `${cleanNum1} * ${cleanNum2}`;
  });

  // Handle basic multiplication (e.g., "1200 x 300")
  expr = expr.replace(patterns.basicMultiplyPattern, (match, num1, num2) => {
    const cleanNum1 = num1.replace(/,/g, '');
    const cleanNum2 = num2.replace(/,/g, '');
    return `${cleanNum1} * ${cleanNum2}`;
  });

  // Handle item description with quantity and price (e.g., "Cement 70 bags * 32k")
  // This needs to be processed before other patterns to ensure it's not overridden
  const itemDescriptionMatch = patterns.genericItemPattern.exec(expr);
  if (itemDescriptionMatch) {
    // We don't need to use the description part or fullMatch, just the numbers
    const [, , quantity, price, suffix] = itemDescriptionMatch;
    const cleanQuantity = quantity.replace(/,/g, '');
    const multiplier = suffix.toLowerCase() === 'k' ? 1000 : 1000000;
    const calculatedPrice = parseFloat(price) * multiplier;
    // Replace the entire expression with the calculation
    return `${cleanQuantity} * ${calculatedPrice}`;
  }

  return expr;
};

/**
 * Evaluates a mathematical expression
 * @param {string} expr - The expression to evaluate
 * @param {Object} scope - Variables to use in the evaluation
 * @returns {number|null} - The result of the evaluation or null if there was an error
 */
export const evaluateExpression = (expr, scope = {}) => {
  if (!expr) return null;

  try {
    console.log(`Evaluating expression: "${expr}"`);
    
    // If the expression is already a number (as a string), we can directly parse it
    // This handles cases where complex expression handler returns a negative number
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      const parsedValue = parseFloat(expr);
      console.log(`Direct parse of numeric string: ${parsedValue}`);
      return parsedValue;
    }
    
    const sanitized = sanitizeExpression(expr);
    console.log(`After sanitization: "${sanitized}"`);
    if (!sanitized) return null;
    
    // Check again if the sanitized expression is a simple number
    if (/^-?\d+(\.\d+)?$/.test(sanitized)) {
      const parsedValue = parseFloat(sanitized);
      console.log(`Parsed sanitized numeric string: ${parsedValue}`);
      return parsedValue;
    }

    const parser = new Parser();
    const result = parser.evaluate(sanitized, scope);
    console.log(`Parser result: ${result}`);
    return result;
  } catch (e) {
    console.error('Error evaluating expression:', e);
    return null;
  }
};

/**
 * Processes a text input containing multiple expressions
 * @param {string} input - The text input to process
 * @returns {Array} - Array of processed expressions with their results
 */
export const processInput = (input) => {
  if (!input) return [];

  // Split input by newlines and filter out empty lines and comments
  const lines = input.split('\n').filter(line => line.trim() && !line.trim().startsWith('//'));

  // Process each line
  return lines.map(line => {
    try {
      // Remove trailing operators
      const stripped = line.replace(/[+\-*/]\s*$/, '');
      
      // First, check if this is a complex expression with multiple parts
      // that should be processed as a whole
      if (stripped.includes('(') && stripped.includes(')') && 
          (stripped.includes('+') || stripped.includes('-')) && 
          (stripped.includes('k') || stripped.includes('m'))) {
        console.log(`Processing complex multi-part expression: "${stripped}"`);
        
        // Process the entire expression at once using the complex expression handler directly
        // This ensures we get the correct result without losing the negative sign
        const complexResult = processComplexExpression(stripped);
        console.log(`Direct complex expression result: ${complexResult}`);
        
        // Convert the result to a number to ensure it's handled correctly
        const numericResult = parseFloat(complexResult);
        console.log(`Numeric result: ${numericResult}`);
        
        // Skip the sanitizeExpression and evaluateExpression steps for complex expressions
        // as they can potentially lose the negative sign
        
        return {
          expression: line,
          sanitized: stripped,
          result: numericResult,
          value: numericResult
        };
      }
      
      // Process function-like expressions (e.g., "tape(140*25)")
      let processedLine = stripped;
      const functionMatches = [...stripped.matchAll(/([a-zA-Z0-9_]+)\s*\(([^)]+)\)/g)];

      for (const match of functionMatches) {
        const [fullMatch, , formula] = match;
        try {
          const parser = new Parser();
          const result = parser.evaluate(formula);
          // Replace the function-like expression with its result
          processedLine = processedLine.replace(fullMatch, result.toString());
        } catch (innerError) {
          console.error('Error evaluating function-like expression:', innerError);
        }
      }

      // Handle multi-part expressions (e.g., "wallplug (1*10) + wallNails (40*3)")
      if (processedLine.includes('+')) {
        const parts = processedLine.split('+');
        let total = 0;

        for (const part of parts) {
          if (!part.trim()) continue;

          try {
            // Process each part
            const sanitized = sanitizeExpression(part.trim());
            const parser = new Parser();
            const result = parser.evaluate(sanitized);
            if (typeof result === 'number') {
              total += result;
            }
          } catch (e) {
            // Try to extract a simple number
            const numericMatch = part.trim().match(/^\s*([\d.]+)\s*$/);
            if (numericMatch) {
              total += parseFloat(numericMatch[1]);
            } else {
              // Try to extract variable names with embedded numbers
              const varNumMatch = part.trim().match(/^\s*([a-zA-Z]+)(\d+)\s*$/);
              if (varNumMatch) {
                total += parseFloat(varNumMatch[2]);
              }
            }
          }
        }

        return {
          expression: line,
          sanitized: processedLine,
          result: total || null,
          value: total || null
        };
      } else {
        // Standard single expression
        const sanitized = sanitizeExpressionRaw(processedLine);
        const result = evaluateExpression(sanitized);

        return {
          expression: line,
          sanitized,
          result,
          value: result
        };
      }
    } catch (error) {
      console.error('Error processing line:', error);
      return {
        expression: line,
        sanitized: line,
        result: null,
        value: null
      };
    }
  });
};

const calculatorService = {
  sanitizeExpression,
  sanitizeExpressionRaw,
  evaluateExpression,
  processInput
};

export default calculatorService;
