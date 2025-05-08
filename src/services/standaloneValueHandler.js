/**
 * Standalone Value Handler
 *
 * This module handles standalone numeric values with suffixes (e.g., "1k", "2m")
 * It ensures that all occurrences of these values are properly processed
 */

/**
 * Process an expression containing standalone numeric values with suffixes
 * @param {string} expression - The expression to process
 * @returns {string} - The processed expression with all suffixes converted to their numeric values
 */
export const processStandaloneValues = (expression) => {
  if (!expression) return '';
  
  console.log(`Processing standalone values in: "${expression}"`);
  
  // Special case for "1k - 2k" pattern
  const simplePattern = /^\s*(\d+(?:\.\d+)?)\s*([km])\s*([+-])\s*(\d+(?:\.\d+)?)\s*([km])\s*$/i;
  const simpleMatch = expression.match(simplePattern);
  
  if (simpleMatch) {
    const [, num1, suffix1, operator, num2, suffix2] = simpleMatch;
    const multiplier1 = suffix1.toLowerCase() === 'k' ? 1000 : 1000000;
    const multiplier2 = suffix2.toLowerCase() === 'k' ? 1000 : 1000000;
    
    const value1 = parseFloat(num1) * multiplier1;
    const value2 = parseFloat(num2) * multiplier2;
    
    console.log(`Direct conversion of "${expression}" to ${value1}${operator}${value2}`);
    return `${value1}${operator}${value2}`;
  }
  
  // Create a copy of the expression to work with
  let processedExpr = expression;
  
  // Handle expressions with multiple standalone values with suffixes
  if (expression.match(/\b\d+(?:\.\d+)?\s*[km]\b.*\b\d+(?:\.\d+)?\s*[km]\b/i)) {
    console.log('Found expression with multiple standalone values with suffixes');
    
    // Process all 'k' suffixes first
    const kRegex = /\b(\d+(?:\.\d+)?)\s*k\b/gi;
    let match;
    let matches = [];
    
    // First collect all matches to avoid regex state issues
    while ((match = kRegex.exec(expression)) !== null) {
      matches.push({
        fullMatch: match[0],
        number: match[1],
        index: match.index,
        length: match[0].length
      });
    }
    
    // Process matches in reverse order (from end to start) to avoid position shifts
    matches.reverse().forEach(match => {
      const value = parseFloat(match.number) * 1000;
      console.log(`Converting ${match.fullMatch} to ${value}`);
      
      // Replace the exact match at the exact position
      processedExpr = 
        processedExpr.substring(0, match.index) + 
        value.toString() + 
        processedExpr.substring(match.index + match.length);
    });
    
    // Then process all 'm' suffixes
    const mRegex = /\b(\d+(?:\.\d+)?)\s*m\b/gi;
    matches = [];
    
    // First collect all matches
    while ((match = mRegex.exec(expression)) !== null) {
      matches.push({
        fullMatch: match[0],
        number: match[1],
        index: match.index,
        length: match[0].length
      });
    }
    
    // Process matches in reverse order
    matches.reverse().forEach(match => {
      const value = parseFloat(match.number) * 1000000;
      console.log(`Converting ${match.fullMatch} to ${value}`);
      
      // Replace the exact match at the exact position
      processedExpr = 
        processedExpr.substring(0, match.index) + 
        value.toString() + 
        processedExpr.substring(match.index + match.length);
    });
    
    console.log(`Processed expression: ${processedExpr}`);
  }
  
  return processedExpr;
};

// Create a named export object to fix lint issue
const standaloneValueHandler = {
  processStandaloneValues
};

export default standaloneValueHandler;
