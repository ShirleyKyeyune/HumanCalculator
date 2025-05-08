/**
 * Calculator Patterns
 * This file contains all the regex patterns used for parsing human-readable expressions
 * Each pattern is exported individually for better testability
 */

// Pattern for decimal numbers with 'k' or 'm' suffix (e.g., "1.2k x 300")
export const decimalWithSuffixPattern = /(\d+\.\d+)\s*([km])\s*(?:[x×])\s*(\d+(?:,\d+)?)/gi;

// Pattern for "Total bottles: 1,200 × 300" format and "Quantity: 300 × 1.2k bottles" format
export const totalQuantityPattern = /(?:Total|Quantity)[^:]*:\s*(.*)/gi;

// Pattern for extracting decimal with k suffix in an expression (e.g., "300 × 1.2k")
export const kSuffixPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+\.\d+)\s*([km])\b/i;

// Pattern for extracting regular multiplication from an expression (e.g., "1,200 × 300")
export const multiplyPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/i;

// Pattern for "Supplying 300 people with 1.2k bottles each" format
export const supplyingPattern = /(?:Supplying)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?\s*(?:with)\s*(\d+(?:,\d+)?|\d+\.\d+[km])\s*(?:bottles|bottle)/gi;

// Pattern for "Bottles for 300 people @ 1,200 each" format
export const bottlesForPattern = /(?:Bottles|Bottle|Items)\s+for\s+(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+[km])\s*(?:each)?/gi;

// Pattern for extracting numbers from "Bottles for" pattern
export const bottlesForNumPattern = /(?:Bottles|Bottle|Items)\s+for\s+(\d+(?:,\d+)?)\s*(?:people|person)?\s*@\s*(\d+(?:,\d+)?|\d+\.\d+[km])/i;

// Pattern for "300 bottles at 1,200 UGX each" format
export const bottlesAtPattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*at\s*(\d+(?:,\d+)?)\s*(?:UGX)?\s*(?:each)?/gi;

// Pattern for "1,200 UGX per bottle × 300 people" format
export const ugxPerBottlePattern = /(\d+(?:,\d+)?)\s*(?:UGX)?\s*per\s*(?:bottle|person)\s*[×x]\s*(\d+(?:,\d+)?)/gi;

// Pattern for "Total for 300 bottles @ UGX 1,200" format
export const totalForBottlesPattern = /Total\s+for\s+(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+(?:,\d+)?)/gi;

// Pattern for "Total for 300 bottles @ UGX 1.2K" format
export const totalForBottlesKPattern = /Total\s+for\s+(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(?:UGX)?\s*(\d+\.\d+)\s*([km])/gi;

// General patterns for K and M suffixes
export const kSuffixStandalonePattern = /(\d+(?:\.\d+)?)\s*k\b/i;
export const mSuffixStandalonePattern = /(\d+(?:\.\d+)?)\s*m\b/i;

// Patterns for K and M suffixes in multiplication contexts
export const kSuffixMultiplyPattern = /(\d+(?:,\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*k\b/i;
export const mSuffixMultiplyPattern = /(\d+(?:,\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*m\b/i;
export const kSuffixBeforeMultiplyPattern = /(\d+(?:\.\d+)?)\s*k\b\s*[×x*]\s*(\d+(?:,\d+)?)/i;
export const mSuffixBeforeMultiplyPattern = /(\d+(?:\.\d+)?)\s*m\b\s*[×x*]\s*(\d+(?:,\d+)?)/i;

// Pattern for "300 bottles @ 1.2K" format
export const bottlesAtKPattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+\.\d+)\s*([km])\b/gi;

// Pattern for "300 bottles @ 1,200" format
export const bottlesAtNumPattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle)\s*@\s*(\d+(?:,\d+)?)/gi;

// Pattern for "300 people × 1,200 bottles each" format
export const peopleBottlesPattern = /(\d+(?:,\d+)?)\s*(?:people|person)?\s*[×x]\s*(\d+(?:,\d+)?)\s*(?:bottles|bottle|UGX)?/gi;

// Pattern for "1,200 bottles for each of 300 people" format
export const bottlesForEachPattern = /(\d+(?:,\d+)?)\s*(?:bottles|bottle|UGX)?\s*(?:for|per)\s*(?:each|one)?\s*(?:of)?\s*(\d+(?:,\d+)?)\s*(?:people|person)?/gi;

// Pattern for basic multiplication (e.g., "1200 x 300")
export const basicMultiplyPattern = /(\d+(?:,\d+)?)\s*[×x]\s*(\d+(?:,\d+)?)/gi;

// Generic pattern for any text with numbers and operators (e.g., "Something 70 bags * 2k" or "Something 70 bags * 2000")
export const genericItemPattern = /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(\d+(?:\.\d+)?(?:,\d+)?)(?:\s*([km])\b)?\s*(?:[a-zA-Z]*)?\s*[×x*@]\s*(\d+(?:\.\d+)?(?:,\d+)?)(?:\s*([km])\b)?(?:\s+[a-zA-Z]+)*/i;

// Pattern for bottle boxes format (e.g., "Bottles (2 boxes * 10k)" or "Bottles 2 boxes @ 10k")
export const bottleBoxesPattern = /([a-zA-Z]+)\s*(?:\()\s*(\d+)\s*(?:boxes|box)\s*[×x*@]\s*(\d+)\s*([km])?\b/i;

// Pattern for compact bottle boxes format (e.g., "Bottles 2boxes @10k")
export const compactBottleBoxesPattern = /([a-zA-Z]+)\s+(\d+)(?:boxes|box)\s*@\s*(\d+)\s*([km])?\b/i;

// Pattern for percentage calculations with parentheses (e.g., "(1,000,000 * 25%)")
export const percentagePatternWithParens = /\((\d+(?:,\d+)*)\s*[×x*]\s*(\d+(?:\.\d+)?)%\)/i;

// Pattern for percentage calculations without parentheses (e.g., "1,000,000 * 25%")
export const percentagePatternNoParens = /(\d+(?:,\d+)*)\s*[×x*]\s*(\d+(?:\.\d+)?)%/i;

// Pattern for fraction calculations (e.g., "something (1,000,000 * (25/100))")
export const fractionPattern = /\((\d+(?:,\d+)*)\s*[×x*]\s*\((\d+)\/(\d+)\)\)/i;

// Pattern for any parenthesized expression with text prefix (e.g., "something (1,000,000 * 25%)")
export const textParenthesisPattern = /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+\((.+?)\)/i;

// Pattern for text followed by number with M suffix and percentage (e.g., "something 1M * 25%")
export const textMillionPercentPattern = /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(\d+(?:\.\d+)?)\s*([km])\s*[×x*]\s*(\d+(?:\.\d+)?)%/i;

// Pattern for text followed by number with M suffix and decimal (e.g., "something 1M x 0.25")
export const textMillionDecimalPattern = /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(\d+(?:\.\d+)?)\s*([km])\s*[×x*]\s*(0\.\d+)/i;

// Pattern for a single expression in parentheses with a text prefix (e.g., "something (2x2k)")
export const textWithParenExpressionPattern = /([a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+\((\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*([km])?\)/i;

// Pattern for complex expressions with multiple operations (e.g., "something (2x2k) - another (3x1k) + anotherThing (4.5 x 3k)")
// This pattern is used to identify if a string contains a complex expression with multiple operations
// The actual parsing and calculation is done in the complexExpressionHandler.js
// This is a simple pattern to check if the expression contains parentheses and operators
export const complexExpressionPattern = /\([^)]+\)[\s]*[+-][\s]*\([^)]+\)/i;

// Export all patterns as a collection for easier imports
export const patterns = {
  decimalWithSuffixPattern,
  totalQuantityPattern,
  kSuffixPattern,
  multiplyPattern,
  supplyingPattern,
  bottlesForPattern,
  bottlesForNumPattern,
  bottlesAtPattern,
  ugxPerBottlePattern,
  totalForBottlesPattern,
  totalForBottlesKPattern,
  kSuffixStandalonePattern,
  mSuffixStandalonePattern,
  kSuffixMultiplyPattern,
  mSuffixMultiplyPattern,
  kSuffixBeforeMultiplyPattern,
  mSuffixBeforeMultiplyPattern,
  bottlesAtKPattern,
  bottlesAtNumPattern,
  peopleBottlesPattern,
  bottlesForEachPattern,
  basicMultiplyPattern,
  genericItemPattern,
  bottleBoxesPattern,
  compactBottleBoxesPattern,
  percentagePatternWithParens,
  percentagePatternNoParens,
  fractionPattern,
  textParenthesisPattern,
  textMillionPercentPattern,
  textMillionDecimalPattern,
  textWithParenExpressionPattern,
  complexExpressionPattern
};

export default patterns;
