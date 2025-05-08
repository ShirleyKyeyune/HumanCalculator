// Test pattern for "bottles 2k x 12k"
const testString = "bottles 2k x 12k";

// Pattern to match and extract values
const pattern = /([a-zA-Z]+\s+)?(\d+)\s*k\s+([x*])\s*(\d+)(\s*k)?([a-zA-Z]+)?/i;
const match = testString.match(pattern);

if (match) {
  const [fullMatch, prefix, num1, operator, num2, kSuffix, suffix] = match;
  const value1 = parseInt(num1) * 1000;
  const value2 = kSuffix ? parseInt(num2) * 1000 : parseInt(num2);
  console.log(`Match found: ${fullMatch}`);
  console.log(`Prefix: ${prefix}, Num1: ${num1}, Operator: ${operator}, Num2: ${num2}, kSuffix: ${kSuffix}, Suffix: ${suffix}`);
  console.log(`Value1: ${value1}, Value2: ${value2}`);
  console.log(`Result: ${value1 * value2}`);
} else {
  console.log("No match found");
}
