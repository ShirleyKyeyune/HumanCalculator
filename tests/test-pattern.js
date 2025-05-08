// Test pattern for "bottles 2k x 12k"
const testString = "bottles 2k x 12k";

// Pattern to match and extract values
const pattern = /([a-zA-Z]+\s+)?(\d+)\s*k\s+([x*])\s*(\d+)\s*k\b/i;
const match = testString.match(pattern);

if (match) {
  const [fullMatch, prefix, num1, operator, num2] = match;
  console.log(`Match found: ${fullMatch}`);
  console.log(`Prefix: ${prefix}, Num1: ${num1}, Operator: ${operator}, Num2: ${num2}`);
  console.log(`Result: ${num1 * 1000} * ${num2 * 1000} = ${num1 * 1000 * num2 * 1000}`);
} else {
  console.log("No match found");
}
